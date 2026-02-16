import { useState, useEffect } from 'react'
import railsApi from "@/lib/railsApi"
import { BanknotesIcon } from '@heroicons/react/24/outline'

interface Transaction {
    id: number;
    amount: string;
    transaction_type: string;
    description: string;
    created_at: string;
    status: string;
}

interface BalanceData {
    available_balance: number;
    currency: string;
    total_deposited: number;
    total_order_amount: number;
    order_count: number;
    discount_percentage: number;
    recent_transactions: Transaction[];
    // Removed unused fields: reseller_id, username
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

                const response = await railsApi.get<BalanceData>('/wallet')

                if (response.data) {
                    setBalanceData(response.data)
                } else {
                    throw new Error('No data received')
                }

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
                        {balanceData.currency} {Number.parseFloat(balanceData.available_balance.toString()).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">Available Balance</p>
                </div>

                {/* Additional balance info */}
                <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Total Deposited:</span>
                        <span className="text-white">
                            {balanceData.currency} {Number.parseFloat(balanceData.total_deposited.toString()).toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Total Spent:</span>
                        <span className="text-white">
                            {balanceData.currency} {Number.parseFloat(balanceData.total_order_amount.toString()).toFixed(2)}
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