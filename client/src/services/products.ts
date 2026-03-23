import railsApi from "../lib/railsApi";

export interface Product {
    id: number;
    name: string;
    description: string;
    product_type: string;
    provider_type: string;
    status: string;
    featured: boolean;
    metadata: Record<string, any>;
    pricings: ProductPricing[];
}

export interface ProductPricing {
    id: number;
    duration_type: string;
    duration_value: number;
    api_price: number;
    selling_price: number;
    user_selling_price: number;
    reseller_selling_price: number;
    currency: string;
}

export interface ProductCategory {
    id: number;
    name: string;
    slug: string;
    products: Product[];
}

// Fetch all products
export const fetchProducts = async (params?: {
    type?: string;
    category?: string;
    featured?: boolean;
}): Promise<Product[]> => {
    try {
        const response = await railsApi.get<{ products: Product[] } | Product[]>("/products", {
            params,
        });

        const data = response.data;
        return Array.isArray(data) ? data : data.products || [];
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

// Fetch single product
export const fetchProduct = async (productId: number): Promise<Product | null> => {
    try {
        const response = await railsApi.get<{ product: Product } | Product>(`/products/${productId}`);
        const data = response.data;
        return "product" in data ? data.product : data;
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
};

// Fetch products by type (proxy, vm, esim, vpn)
export const fetchProductsByType = async (type: string): Promise<Product[]> => {
    return fetchProducts({ type });
};

// Fetch VPN plans
export const fetchVPNPlans = async (): Promise<Product[]> => {
    return fetchProductsByType("vpn");
};

// Fetch proxy products
export const fetchProxyProducts = async (): Promise<Product[]> => {
    return fetchProductsByType("proxy");
};

// Fetch eSIM products
export const fetchESIMProducts = async (): Promise<Product[]> => {
    return fetchProductsByType("esim");
};

// Fetch VM products
export const fetchVMProducts = async (): Promise<Product[]> => {
    return fetchProductsByType("vm");
};

// Legacy compatibility - Proxy plans
export const fetchProxyPlans = async (): Promise<any[]> => {
    const products = await fetchProxyProducts();
    return products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.provider_type,
        metadata: p.metadata,
        pricings: p.pricings,
    }));
};
