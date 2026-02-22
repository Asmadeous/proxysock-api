import { useState, useEffect } from 'react'

import { BanknotesIcon } from '@heroicons/react/24/outline'

// Supabase completely removed. Mock object to prevent compile/runtime crash.
const supabase: any = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signInWithOAuth: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    refreshSession: async () => ({ data: { session: null }, error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: async () => ({ data: [], error: null }),
        not: () => ({ order: async () => ({ data: [], error: null }) })
      }),
      order: async () => ({ data: [], error: null }),
      not: () => ({ order: async () => ({ data: [], error: null }) }),
      neq: () => ({ order: async () => ({ data: [], error: null }) })
    }),
    insert: async () => ({ error: null }),
    update: () => ({ eq: async () => ({ error: null }) })
  }),
  functions: { invoke: async () => ({ data: null, error: null }) },
  channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
  removeChannel: async () => {}
};


interface BalanceData {
    available_balance: number;
    currency: string;
    total_deposited: number;
    total_order_amount: number;
    deposit_transactions: number;
    order_count: number;
    reseller_id: string;
    username: string;
    discount_percentage: number;
}

interface BalanceResponse {
    success: boolean;
    data?: BalanceData;
    error?: string;
}

const Balance = () => {
    const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                setLoading(true)
                setError(null)

                // Get current session
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    throw new Error('No active session')
                }

                // Call the Supabase Edge Function with better error handling
                const { data, error: functionError } = await supabase.functions.invoke('My_Proxy_API', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                })

                console.log('Function response:', { data, functionError })

                if (functionError) {
                    console.error('Function error details:', functionError)
                    throw new Error(`Function error: ${functionError.message}`)
                }

                const response = data as BalanceResponse

                if (!response.success) {
                    throw new Error(response.error || 'Failed to fetch balance')
                }

                if (!response.data) {
                    throw new Error('No balance data received')
                }

                setBalanceData(response.data)

            } catch (err) {
                console.error('Balance fetch error:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch balance')
            } finally {
                setLoading(false)
            }
        }

        fetchBalance()
    }, [])

    if (loading) {
        return (
            <div className="space-y-3 p-4">
                {/* Balance Card Skeleton */}
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                    <BanknotesIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-red-500 mb-1">Balance Error</p>
                <p className="text-xs text-gray-400">{error}</p>
            </div>
        )
    }

    if (!balanceData) {
        return (
            <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                    <BanknotesIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No balance data available</p>
            </div>
        )
    }

    return (
        <div className="text-center">
            <div className="flex items-center justify-center mb-4">
                <BanknotesIcon className="h-6 w-6 text-gray-400" />
                <span className="text-sm font-medium text-green-500 ml-2">Available</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-2xl font-bold text-white">
                        {balanceData.currency} {balanceData.available_balance.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">Available Balance</p>
                </div>

                {/* Additional balance info */}
                <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Total Deposited:</span>
                        <span className="text-white">
                            {balanceData.currency} {balanceData.total_deposited.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Total Spent:</span>
                        <span className="text-white">
                            {balanceData.currency} {balanceData.total_order_amount.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Orders:</span>
                        <span className="text-white">{balanceData.order_count}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Discount:</span>
                        <span className="text-green-500">{balanceData.discount_percentage}%</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Balance