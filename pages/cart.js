import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../lib/cartContext';
import { useAuth } from '../lib/authContext';
import { ordersAPI, paymentsAPI } from '../lib/api';
import { MessagingService } from '../lib/messaging';
import Navbar from '../components/Navbar';
import styles from '../styles/cart.module.css';

export default function Cart() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [khataSummary, setKhataSummary] = useState(null);

    useEffect(() => {
        if (isAuthenticated) {
            paymentsAPI.getSummary().then(res => setKhataSummary(res.data)).catch(console.error);
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        if (typeof window !== 'undefined') router.push('/login');
        return null;
    }

    const availableCredits = khataSummary?.ledger_by_dealer?.filter(d => 
        cartItems.some(item => String(item.dealer_id) === String(d.dealer_id)) && d.balance < 0
    ) || [];
    
    const totalAvailableCredit = availableCredits.reduce((acc, curr) => acc + Math.abs(curr.balance), 0);

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) return;
        
        setLoading(true);
        setError('');
        
        try {
            // Group items by dealer
            const itemsByDealer = cartItems.reduce((acc, item) => {
                const dId = String(item.dealer_id);
                if (!acc[dId]) acc[dId] = [];
                acc[dId].push(item);
                return acc;
            }, {});

            // Create an order for each dealer
            for (const dealerId in itemsByDealer) {
                const items = itemsByDealer[dealerId].map(item => ({
                    product: item.product_id,
                    product_name: item.name,
                    product_price: item.price,
                    quantity: item.quantity,
                    unit: item.unit,
                    subtotal: item.price * item.quantity
                }));

                const orderRes = await ordersAPI.createOrder({
                    items,
                    dealer_id: dealerId,
                    shipping_address: user?.address || 'Main Street, City', 
                    notes: 'Order from Kirana Shopping Cart'
                });

                // Phase IV: WhatsApp Confirmation
                try {
                    await MessagingService.sendOrderConfirmation({
                        ...orderRes.data,
                        shopkeeper_email: user.email
                    });
                } catch (msgErr) {
                    console.warn("Messaging failed", msgErr);
                }
            }

            setSuccess('Order(s) placed successfully! Redirecting to dashboard...');
            clearCart();
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <Navbar />
            
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Shopping Cart ({cartCount} items)</h1>
                    <button onClick={() => router.push('/products')} className={styles.continueBtn}>
                        ← Continue Shopping
                    </button>
                </header>

                {error && <div className={styles.errorAlert}>{error}</div>}
                {success && <div className={styles.successAlert}>{success}</div>}

                {cartItems.length === 0 ? (
                    <div className={styles.emptyCart}>
                        <div className={styles.emptyIcon}>🛒</div>
                        <h2>Your cart is empty</h2>
                        <p>Browse products from your favorite dealers and stock up your shop!</p>
                        <button onClick={() => router.push('/products')} className={styles.primaryBtn}>
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className={styles.cartGrid}>
                        <div className={styles.itemsList}>
                            {cartItems.map((item) => (
                                <div key={item.product_id} className={styles.cartItem}>
                                    <div className={styles.itemInfo}>
                                        <h3>{item.name}</h3>
                                        <p className={styles.itemMeta}>Dealer ID: {item.dealer_id} | {item.unit}</p>
                                    </div>
                                    <div className={styles.itemControls}>
                                        <div className={styles.quantityControls}>
                                            <button 
                                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >-</button>
                                            <span>{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                            >+</button>
                                        </div>
                                        <div className={styles.itemPrice}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                                                {item.price < item.base_price && (
                                                    <span style={{ fontSize: '11px', color: '#059669' }}>
                                                        💰 Bulk Savings: -₹{((item.base_price - item.price) * item.quantity).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            className={styles.removeBtn}
                                            onClick={() => removeFromCart(item.product_id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button className={styles.clearBtn} onClick={clearCart}>
                                Clear Cart
                            </button>
                        </div>

                        <div className={styles.summaryCard}>
                            <h3>Order Summary</h3>
                            <div className={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>₹{cartItems.reduce((acc, item) => acc + (item.base_price * item.quantity), 0).toLocaleString()}</span>
                            </div>
                            {cartItems.some(item => item.price < item.base_price) && (
                                <div className={styles.summaryRow} style={{ color: '#059669' }}>
                                    <span>Bulk Discount</span>
                                    <span>-₹{(cartItems.reduce((acc, item) => acc + (item.base_price * item.quantity), 0) - cartTotal).toLocaleString()}</span>
                                </div>
                            )}
                            
                            {totalAvailableCredit > 0 && (
                                <div className={styles.summaryRow} style={{ color: '#0369a1', background: '#f0f9ff', padding: '8px', margin: '10px -15px', paddingLeft: '15px', paddingRight: '15px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600' }}>✨ Return Credits Available</span>
                                        <span style={{ fontSize: '10px' }}>From approved returns</span>
                                    </div>
                                    <span style={{ fontWeight: 'bold' }}>₹{totalAvailableCredit.toLocaleString()}</span>
                                </div>
                            )}

                            <div className={styles.summaryRow}>
                                <span>Shipping</span>
                                <span className={styles.free}>FREE</span>
                            </div>
                            <hr />
                            <div className={`${styles.summaryRow} ${styles.total}`}>
                                <span>Current Total</span>
                                <span>₹{cartTotal.toLocaleString()}</span>
                            </div>

                            {totalAvailableCredit > 0 && (
                                <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '15px', fontStyle: 'italic' }}>
                                    Your available credit will be automatically deducted from your Digital Ledger balance after placing this order.
                                </div>
                            )}

                            <button 
                                className={styles.checkoutBtn} 
                                onClick={handlePlaceOrder}
                                disabled={loading}
                            >
                                {loading ? 'Placing Order...' : 'Confirm & Place Order'}
                            </button>
                            <p className={styles.trustNote}>
                                🛡️ Secure Wholesale Transaction
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
