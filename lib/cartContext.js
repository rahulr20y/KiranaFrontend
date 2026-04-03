import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('kirana_cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (err) {
                console.error("Failed to parse cart storage", err);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('kirana_cart', JSON.stringify(cartItems));
        }
    }, [cartItems, isLoaded]);

    const getTieredPrice = (product, quantity) => {
        if (!product.price_tiers || product.price_tiers.length === 0) {
            return product.price || product.base_price;
        }
        
        const sortedTiers = [...product.price_tiers].sort((a, b) => parseInt(b.min_quantity) - parseInt(a.min_quantity));
        const applicableTier = sortedTiers.find(tier => parseInt(quantity) >= parseInt(tier.min_quantity));
        
        return applicableTier ? applicableTier.price : (product.price || product.base_price);
    };

    const addToCart = (product, quantity = 1) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.product_id === product.id);
            if (existing) {
                const newQuantity = existing.quantity + quantity;
                return prev.map((item) =>
                    item.product_id === product.id
                        ? { 
                            ...item, 
                            quantity: newQuantity,
                            price: getTieredPrice(item, newQuantity) 
                        }
                        : item
                );
            }
            const initialPrice = getTieredPrice(product, quantity);
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    base_price: product.price,
                    price: initialPrice,
                    price_tiers: product.price_tiers || [],
                    unit: product.unit || 'kg',
                    quantity,
                    dealer_id: product.dealer,
                    image: product.image
                },
            ];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) return;
        setCartItems((prev) =>
            prev.map((item) => {
                if (item.product_id === productId) {
                    return { 
                        ...item, 
                        quantity,
                        price: getTieredPrice(item, quantity)
                    };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const loadOrderIntoCart = (orderItems, dealerId) => {
        // This is used for One-Click Re-ordering
        const newItems = orderItems.map(item => {
            const productData = {
                ...item,
                id: item.product,
                price: item.product_price, // Fallback if no tiers
                price_tiers: item.price_tiers || []
            };
            const quantity = item.quantity || 1;
            const finalPrice = getTieredPrice(productData, quantity);
            
            return {
                product_id: item.product,
                name: item.product_name,
                base_price: item.product_price,
                price: finalPrice,
                price_tiers: item.price_tiers || [],
                unit: item.unit || 'kg',
                quantity: quantity,
                dealer_id: dealerId
            };
        });
        
        setCartItems(newItems);
    };

    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                loadOrderIntoCart,
                cartTotal,
                cartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
