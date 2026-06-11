import railsApi from "../lib/railsApi";

// All IDs are UUIDs (string) — the backend schema uses id: :uuid.
export interface CartItem {
    id: string;
    product_id: string;
    product_pricing_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: {
        id: string;
        name: string;
        product_type: string;
    };
    product_pricing: {
        id: string;
        duration_days: number;
        selling_price: number;
    };
}

export interface Cart {
    id: string;
    user_id: string;
    status: string;
    items: CartItem[];
}

export interface CheckoutResult {
    success: boolean;
    message: string;
    payment_url?: string;
    reference?: string;
    checkout_session_id?: string;
    orders?: { id: string; status: string }[];
    error?: string;
}

// Get current cart
export const getCart = async (): Promise<Cart | null> => {
    try {
        const response = await railsApi.get<{ cart: Cart; items: CartItem[] }>("/cart");
        return {
            ...response.data.cart,
            items: response.data.items || [],
        };
    } catch (error) {
        console.error("Error fetching cart:", error);
        return null;
    }
};

// Add item to cart
export const addToCart = async (
    productId: string,
    pricingId: string,
    quantity: number = 1
): Promise<{ success: boolean; cartItem?: CartItem; error?: string }> => {
    try {
        const response = await railsApi.post<{ message: string; cart_item: CartItem }>("/cart/add_item", {
            product_id: productId,
            pricing_id: pricingId,
            quantity,
        });

        return { success: true, cartItem: response.data.cart_item };
    } catch (error: any) {
        console.error("Error adding to cart:", error);
        return {
            success: false,
            error: error.response?.data?.error || "Failed to add item to cart",
        };
    }
};

// Remove item from cart
export const removeFromCart = async (
    itemId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        await railsApi.delete("/cart/remove_item", {
            params: { item_id: itemId },
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error removing from cart:", error);
        return {
            success: false,
            error: error.response?.data?.error || "Failed to remove item from cart",
        };
    }
};

// Checkout with wallet
export const checkoutWithWallet = async (): Promise<CheckoutResult> => {
    try {
        const response = await railsApi.post<CheckoutResult>("/cart/checkout", {
            payment_method: "wallet",
        });

        return {
            success: true,
            message: response.data.message || "Checkout successful",
            orders: response.data.orders,
        };
    } catch (error: any) {
        console.error("Error during wallet checkout:", error);
        return {
            success: false,
            message: "Checkout failed",
            error: error.response?.data?.error || "Failed to process checkout",
        };
    }
};

// Checkout with payment gateway
export const checkoutWithGateway = async (
    paymentMethod: "paystack" | "plisio" | "fastspring"
): Promise<CheckoutResult> => {
    try {
        const response = await railsApi.post<CheckoutResult>("/cart/checkout", {
            payment_method: paymentMethod,
        });

        return {
            success: true,
            message: response.data.message || "Redirect to payment gateway",
            payment_url: response.data.payment_url,
            reference: response.data.reference,
            checkout_session_id: response.data.checkout_session_id,
        };
    } catch (error: any) {
        console.error("Error during gateway checkout:", error);
        return {
            success: false,
            message: "Checkout failed",
            error: error.response?.data?.error || "Failed to initiate payment",
        };
    }
};

// Calculate cart total
export const calculateCartTotal = (items: CartItem[]): number => {
    return items.reduce((total, item) => total + item.total_price, 0);
};
