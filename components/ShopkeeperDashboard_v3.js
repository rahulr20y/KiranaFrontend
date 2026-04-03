import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../lib/cartContext';
import { shopkeepersAPI, dealersAPI, ordersAPI, notificationsAPI, paymentsAPI, returnsAPI } from '../lib/api';
import { generateInvoicePDF } from '../lib/invoice';
import styles from '../styles/dashboard.module.css';
import toastStyles from '../styles/toast.module.css';
import NotificationToast from './NotificationToast';
import { useNotifications } from '../lib/notificationContext';
import NotificationBell from './NotificationBell';
import { 
    LayoutDashboard, 
    Users, 
    ShoppingBag, 
    Radio, 
    CreditCard, 
    RotateCcw, 
    User,
    TrendingDown,
    ArrowRight
} from 'lucide-react';


export default function ShopkeeperDashboard_v3() {
    const router = useRouter();
    const { loadOrderIntoCart } = useCart();
    const [shopkeeperProfile, setShopkeeperProfile] = useState(null);
    const [preferredDealers, setPreferredDealers] = useState([]);
    const [allDealers, setAllDealers] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const { notifications, setNotifications, markAsRead } = useNotifications();
    const [khataSummary, setKhataSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileFormData, setProfileFormData] = useState({
        shop_name: '',
        business_type: '',
        monthly_budget: '',
    });
    const [toasts, setToasts] = useState([]);
    const [activeLedger, setActiveLedger] = useState(null);
    const [ledgerHistory, setLedgerHistory] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [myReturns, setMyReturns] = useState([]);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnForm, setReturnForm] = useState({
        order: null,
        item: null,
        product_name: '',
        quantity: 1,
        reason: '',
        max_qty: 1
    });
    const [suggestions, setSuggestions] = useState([]);
    const [showMockPaymentModal, setShowMockPaymentModal] = useState(false);
    const [mockPaymentData, setMockPaymentData] = useState({ dealer: null, amount: 0 });
    const lastToastedId = useRef(null);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch Profile first to trigger backend lazy creation, preventing 404 on followed dealers
            const profileRes = await shopkeepersAPI.myProfile();
            const [dealersRes, preferredDealersRes, ordersRes, broadcastsRes, notificationsRes, khataRes, returnsRes, suggestionsRes] = await Promise.all([
                dealersAPI.listDealers(),
                shopkeepersAPI.getPreferredDealers(),
                ordersAPI.myOrders(),
                notificationsAPI.listBroadcasts(),
                notificationsAPI.listPersonal(),
                paymentsAPI.getSummary(),
                returnsAPI.listReturns(),
                ordersAPI.getSuggestions()
            ]);
            setShopkeeperProfile(profileRes.data);
            setProfileFormData({
                shop_name: profileRes.data.shop_name || '',
                business_type: profileRes.data.business_type || '',
                monthly_budget: profileRes.data.monthly_budget || '',
            });
            setAllDealers(Array.isArray(dealersRes.data.results) ? dealersRes.data.results : (Array.isArray(dealersRes.data) ? dealersRes.data : []));
            setPreferredDealers(Array.isArray(preferredDealersRes.data) ? preferredDealersRes.data : []);
            setRecentOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
            setBroadcasts(Array.isArray(broadcastsRes.data.results) ? broadcastsRes.data.results : (Array.isArray(broadcastsRes.data) ? broadcastsRes.data : []));
            setNotifications(Array.isArray(notificationsRes.data.results) ? notificationsRes.data.results : (Array.isArray(notificationsRes.data) ? notificationsRes.data : []));
            setKhataSummary(khataRes.data);
            setMyReturns(Array.isArray(returnsRes.data.results) ? returnsRes.data.results : (Array.isArray(returnsRes.data) ? returnsRes.data : []));
            setSuggestions(Array.isArray(suggestionsRes.data) ? suggestionsRes.data : []);
            setError('');
            console.log('FetchData Success:', {
                returns: returnsRes.data,
                count: returnsRes.data.count,
                firstReturn: returnsRes.data.results?.[0]?.id
            });
        } catch (err) {

            setError('Failed to load shopkeeper information');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [setNotifications, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle real-time notification toasts for shopkeeper
    useEffect(() => {
      const latestNotification = notifications[0];
      if (latestNotification && !latestNotification.is_read && latestNotification.id !== lastToastedId.current) {
        // Only show toast if it's "fresh" (within last few seconds) to avoid spam on load
        const createdAt = new Date(latestNotification.created_at);
        const now = new Date();
        if (now - createdAt < 5000) {
          addToast(latestNotification.message, latestNotification.notification_type === 'order_update' ? 'success' : 'info');
          lastToastedId.current = latestNotification.id;
          
          // Also optionally refresh the dashboard if it's an order update or broadcast
          if (latestNotification.notification_type === 'order_update') {
            fetchData();
          }
        }
      }
    }, [notifications, addToast, fetchData]);

    const handleFollowDealer = async (dealerId) => {
        try {
            await shopkeepersAPI.followDealer(dealerId);
            fetchData();
            addToast('Successfully followed dealer!', 'success');
        } catch (err) {
            addToast('Failed to follow dealer', 'error');
        }
    };

    const handleUnfollowDealer = async (dealerId) => {
        try {
            await shopkeepersAPI.unfollowDealer(dealerId);
            fetchData();
            addToast('Unfollowed dealer', 'info');
        } catch (err) {
            addToast('Failed to unfollow dealer', 'error');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        try {
            await ordersAPI.cancelOrder(orderId);
            fetchData();
            addToast('Order cancelled and stock restored!', 'success');
        } catch (err) {
            addToast('Failed to cancel order', 'error');
        }
    };

    const handleViewLedger = async (partner) => {
        try {
            setLedgerLoading(true);
            setActiveLedger(partner);
            const res = await paymentsAPI.detailedLedger(partner.dealer_id);
            setLedgerHistory(res.data.history);
        } catch (err) {
            addToast('Failed to load ledger history', 'error');
            setActiveLedger(null);
        } finally {
            setLedgerLoading(false);
        }
    };

    const handleReorder = async (orderId) => {
        try {
            setLoading(true);
            addToast('Loading previous order items...', 'info');
            const res = await ordersAPI.getOrder(orderId);
            const orderData = res.data;
            
            if (orderData.items && orderData.items.length > 0) {
                // If the order has items, load them into cart
                // Extract dealerId from orderData
                loadOrderIntoCart(orderData.items, orderData.dealer);
                addToast('Cart populated! Redirecting to checkout...', 'success');
                router.push('/cart');
            } else {
                addToast('Could not find items for this order', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Failed to load order items', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleRazorpayPayment = async (ledgerEntry, customAmount = null) => {
        const amountToPay = customAmount || ledgerEntry.balance;
        if (amountToPay <= 0) {
            addToast('Nothing to pay for this dealer', 'info');
            return;
        }

        try {
            addToast('Initializing secure payment...', 'info');
            
            // 1. Load Razorpay script
            const resScript = await loadRazorpay();
            if (!resScript) {
                addToast('Razorpay SDK failed to load. Are you online?', 'error');
                return;
            }

            // 2. Create order on backend
            // For now, we use current user's info
            const orderRes = await paymentsAPI.createRazorpayOrder({
                amount: amountToPay,
                dealer_id: ledgerEntry.dealer_id
            });

            const { razorpay_order_id, amount } = orderRes.data;

            // 3. Open Razorpay Checkout
            // We'll use a test key or environment variable
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_simulated',
                amount: amount * 100, // paise
                currency: 'INR',
                name: 'Kirana Platform',
                description: `Payment to ${ledgerEntry.business_name}`,
                order_id: razorpay_order_id,
                handler: async function (response) {
                    try {
                        addToast('Verifying payment...', 'info');
                        // 4. Verify signature on backend
                        await paymentsAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        
                        addToast('Payment Successful!', 'success');
                        fetchData();
                        if (activeLedger && activeLedger.dealer_id === ledgerEntry.dealer_id) {
                            handleViewLedger(ledgerEntry);
                        }
                    } catch (err) {
                        addToast('Payment verification failed', 'error');
                    }
                },
                prefill: {
                    name: shopkeeperProfile?.shop_name,
                    email: shopkeeperProfile?.user?.email,
                },
                theme: {
                    color: '#667eea'
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (err) {
            console.error(err);
            addToast('Failed to initiate payment', 'error');
        }
    };

    const handleMockPayment = async () => {
        try {
            setLoading(true);
            const { dealer, amount } = mockPaymentData;
            
            // Call the new simulation endpoint
            const res = await paymentsAPI.simulateDirectPayment({
                dealer_id: dealer.dealer_id,
                amount: parseFloat(amount),
                payment_method: 'upi',
                notes: `Mock UPI payment to ${dealer.business_name}`
            });

            addToast(`Payment of ₹${amount} successful! Trans ID: ${res.data.transaction_id}`, 'success');
            setShowMockPaymentModal(false);
            fetchData();
        } catch (err) {
            addToast('Mock payment failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReturnForm = (order, item) => {
        setReturnForm({
            order: order.id,
            item: item.id,
            product_name: item.product_name,
            quantity: 1,
            reason: '',
            max_qty: item.quantity
        });
        setIsReturnModalOpen(true);
    };

    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        try {
            await returnsAPI.createReturn(returnForm);
            addToast('Return request submitted!', 'success');
            setIsReturnModalOpen(false);
            fetchData();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to submit return request', 'error');
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.dashboardHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1>Shopkeeper Dashboard</h1>
                        <p>Welcome, {shopkeeperProfile?.shop_name || 'Shopkeeper'}</p>
                    </div>
                    <NotificationBell />
                </div>
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <ShoppingBag className={styles.statIcon} size={24} />
                    <div className={styles.statNumber}>{shopkeeperProfile?.total_orders || '0'}</div>
                    <div className={styles.statLabel}>Active Orders</div>
                </div>
                <div className={styles.statCard}>
                    <Users className={styles.statIcon} size={24} />
                    <div className={styles.statNumber}>{preferredDealers.length || '0'}</div>
                    <div className={styles.statLabel}>Preferred Dealers</div>
                </div>
                <div className={styles.statCard}>
                    <CreditCard className={styles.statIcon} size={24} />
                    <div className={styles.statNumber}>₹{khataSummary?.my_total_payable || '0'}</div>
                    <div className={styles.statLabel}>Digital Ledger</div>
                </div>
            </div>

            <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <LayoutDashboard size={18} />
                        <span>Overview</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'dealers' ? styles.active : ''}`}
                        onClick={() => setActiveTab('dealers')}
                    >
                        <Users size={18} />
                        <span>Dealers</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <ShoppingBag size={18} />
                        <span>Orders</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'broadcasts' ? styles.active : ''}`}
                        onClick={() => setActiveTab('broadcasts')}
                    >
                        <Radio size={18} />
                        <span>Broadcasts</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'khata' ? styles.active : ''}`}
                        onClick={() => setActiveTab('khata')}
                    >
                        <CreditCard size={18} />
                        <span>Khata</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'returns' ? styles.active : ''}`}
                        onClick={() => setActiveTab('returns')}
                    >
                        <RotateCcw size={18} />
                        <span>Returns</span>
                        {myReturns.length > 0 && <span className={styles.tabBadge}>{myReturns.length}</span>}
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={18} />
                        <span>Profile</span>
                    </button>
                </div>


                <div className={styles.tabContent}>
                    {activeTab === 'overview' && (
                        <div className={styles.overviewTab}>
                             {suggestions && suggestions.length > 0 && (
                                <div className={styles.suggestionsBanner} style={{ marginBottom: '20px', padding: '15px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '20px', marginRight: '10px' }}>📉</span>
                                        <h3 style={{ margin: 0, fontSize: '16px', color: '#1e40af' }}>Smart Stock Suggestions</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                                        {suggestions.map((s, idx) => (
                                            <div key={idx} style={{ minWidth: '200px', background: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{s.name}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b', margin: '4px 0' }}>{s.reason}</div>
                                                <button 
                                                    className={styles.secondaryBtn}
                                                    style={{ width: '100%', fontSize: '12px', padding: '4px 0' }}
                                                    onClick={() => {
                                                        const itemData = {
                                                            product: s.product_id,
                                                            product_name: s.name,
                                                            product_price: s.price,
                                                            quantity: 1, // Default to 1 for quick restock
                                                            unit: 'unit'
                                                        };
                                                        loadOrderIntoCart([itemData], s.dealer_id);
                                                        addToast(`Added ${s.name} to cart!`, 'success');
                                                        router.push('/cart');
                                                    }}
                                                >
                                                    🛒 Quick Restock
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.statsGrid}>
                                <h2>Business Overview</h2>
                                <div className={styles.overviewGrid}>
                                    <div className={styles.overviewCard}>
                                        <h3>📝 Recent Orders</h3>
                                        {recentOrders && recentOrders.length > 0 ? (
                                            <div className={styles.recentList}>
                                                {recentOrders.slice(0, 3).map(order => (
                                                    <div key={order.id} className={styles.recentItem}>
                                                        <span>Order #{order.order_number?.substring(0, 8) || order.id}</span>
                                                        <span className={styles.statusBadge}>{order.status}</span>
                                                        <span>₹{Number(order.net_amount || order.total_amount).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={styles.emptyMessage}>No recent orders</p>
                                        )}
                                    </div>
                                    <div className={styles.overviewCard}>
                                        <h3>📣 Latest Broadcasts</h3>
                                        {broadcasts && broadcasts.length > 0 ? (
                                            <div className={styles.recentList}>
                                                {broadcasts.slice(0, 3).map(broadcast => (
                                                    <div key={broadcast.id} className={`${styles.recentItem} ${styles['type_' + broadcast.notification_type]}`}>
                                                        <div className={styles.recentItemMain}>
                                                            <strong>{broadcast.business_name}:</strong> {broadcast.title}
                                                        </div>
                                                    </div>
                                                ))}
                                                <button 
                                                    className={styles.textBtn} 
                                                    onClick={() => setActiveTab('broadcasts')}
                                                    style={{ marginTop: '10px', fontSize: '13px' }}
                                                >
                                                    View all broadcasts →
                                                </button>
                                            </div>
                                        ) : (
                                            <p className={styles.emptyMessage}>No broadcasts from followed dealers</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dealers' && (
                        <div className={styles.dealersTab}>
                            <div className={styles.sectionHeader}>
                                <h2>Browse Dealers</h2>
                                <span className={styles.subtitle}>
                                    Find and follow dealers to view their product catalog
                                </span>
                            </div>

                            {loading ? (
                                <p>Loading dealers...</p>
                            ) : allDealers.length === 0 ? (
                                <p className={styles.emptyMessage}>
                                    No dealers available
                                </p>
                            ) : (
                                <div className={styles.dealersGrid}>
                                    {allDealers.map((dealer) => {
                                        const isFollowed = preferredDealers.some(pd => pd.id === dealer.id);
                                        return (
                                            <div key={dealer.id} className={styles.dealerCard}>
                                                <h3>{dealer.business_name}</h3>
                                                <p className={styles.dealerInfo}>
                                                    Category: {dealer.business_category}
                                                </p>
                                                <p className={styles.dealerInfo}>
                                                    Rating: ⭐ {dealer.rating}
                                                </p>
                                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {isFollowed ? (
                                                        <>
                                                            <button
                                                                className={styles.secondaryBtn}
                                                                onClick={() => handleUnfollowDealer(dealer.id)}
                                                            >
                                                                Unfollow
                                                            </button>
                                                            <button
                                                                className={styles.primaryBtn}
                                                                onClick={() => router.push(`/products?dealer=${dealer.user_id}`)}
                                                            >
                                                                🛒 Browse Products
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            className={styles.primaryBtn}
                                                            onClick={() => handleFollowDealer(dealer.id)}
                                                        >
                                                            Follow Dealer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className={styles.ordersTab}>
                            <h2>My Orders</h2>
                            {recentOrders && recentOrders.length > 0 ? (
                                <div className={styles.ordersGrid}>
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className={styles.orderCard}>
                                            <div className={styles.orderHeader}>
                                                <h3>Order #{order.order_number?.substring(0, 8) || order.id}</h3>
                                                <span className={styles.orderStatus}>{order.status}</span>
                                            </div>
                                            <div className={styles.orderDetails}>
                                                <p>Dealer: {order.dealer_business_name || order.dealer_name || 'N/A'}</p>
                                                <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className={styles.orderItemList} style={{ margin: '10px 0', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                                {order.items?.map(item => (
                                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                                                        <span>{item.product_name} x {item.quantity}</span>
                                                        {order.status === 'delivered' && (
                                                            <button 
                                                                className={styles.textBtn} 
                                                                style={{ color: '#ef4444', height: 'auto', padding: '0' }}
                                                                onClick={() => handleOpenReturnForm(order, item)}
                                                            >
                                                                Report Issue
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={styles.orderTotal}>
                                                <strong>Total: ₹{Number(order.net_amount || order.total_amount).toLocaleString()}</strong>
                                            </div>
                                            {order.status === 'shipped' && order.delivery_otp && (
                                                <div className={styles.otpBox} style={{
                                                    marginTop: '10px',
                                                    padding: '10px',
                                                    background: '#ebf8ff',
                                                    border: '1px dashed #3182ce',
                                                    borderRadius: '8px',
                                                    textAlign: 'center'
                                                }}>
                                                    <span style={{ fontSize: '12px', color: '#2c5282', display: 'block' }}>Delivery OTP</span>
                                                    <strong style={{ fontSize: '20px', letterSpacing: '4px', color: '#2b6cb0' }}>{order.delivery_otp}</strong>
                                                </div>
                                            )}
                                            {order.status !== 'cancelled' ? (
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                    <button 
                                                        className={styles.primaryBtn}
                                                        onClick={() => handleReorder(order.id)}
                                                        style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                                                    >
                                                        ⚡ Re-order
                                                    </button>
                                                    <button 
                                                        className={styles.btnSmallDanger}
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        style={{ padding: '8px', fontSize: '12px' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        className={styles.secondaryBtn}
                                                        style={{ padding: '8px', fontSize: '12px' }}
                                                        onClick={() => generateInvoicePDF(order)}
                                                    >
                                                        📄 Invoice
                                                    </button>
                                                    {order.status === 'delivered' && (
                                                        <button 
                                                            className={styles.secondaryBtn}
                                                            style={{ padding: '8px', fontSize: '12px', color: '#dc2626', borderColor: '#fecdd3' }}
                                                            onClick={() => {
                                                                const reason = prompt('Describe the damage/issue:');
                                                                if (!reason) return;
                                                                const qty = prompt('Quantity to return:', '1');
                                                                if (!qty || isNaN(qty)) return;
                                                                
                                                                returnsAPI.createReturn({
                                                                    item: order.items[0].id,
                                                                    reason: reason,
                                                                    quantity: parseInt(qty)
                                                                }).then(() => {
                                                                    addToast('Return request submitted successfully!', 'success');
                                                                    fetchData();
                                                                    setActiveTab('returns');
                                                                }).catch(err => {
                                                                    addToast(err.response?.data?.error || 'Failed to submit return', 'error');
                                                                });
                                                            }}
                                                        >
                                                            ⚠️ Report Damage
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button 
                                                    className={styles.primaryBtn}
                                                    onClick={() => handleReorder(order.id)}
                                                    style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '12px' }}
                                                >
                                                    ⚡ Re-order
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyMessage}>
                                    No orders yet. Start browsing products to place your first order!
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'broadcasts' && (
                        <div className={styles.broadcastsTab}>
                            <div className={styles.sectionHeader}>
                                <h2>Dealers Broadcasts</h2>
                                <span className={styles.subtitle}>
                                    Important updates from dealers you follow
                                </span>
                            </div>

                            {loading ? (
                                <p>Loading broadcasts...</p>
                            ) : broadcasts.length === 0 ? (
                                <p className={styles.emptyMessage}>
                                    No broadcasts yet. Follow more dealers to stay updated!
                                </p>
                            ) : (
                                <div className={styles.broadcastList}>
                                    {broadcasts.map((broadcast) => (
                                        <div key={broadcast.id} className={`${styles.broadcastCard} ${styles['type_' + broadcast.notification_type]}`}>
                                            <div className={styles.broadcastHeader}>
                                                <div className={styles.broadcastSource}>
                                                    <strong>{broadcast.business_name}</strong>
                                                    <span className={styles.dealerName}>({broadcast.dealer_name})</span>
                                                </div>
                                                <span className={styles.broadcastDate}>
                                                    {new Date(broadcast.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className={styles.broadcastBody}>
                                                <h3>{broadcast.title}</h3>
                                                <p>{broadcast.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'khata' && (
                        <div className={styles.khataSection}>
                            <h2>Digital Ledger (Khata)</h2>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <h3>Total Outstanding</h3>
                                    <p className={styles.amount}>₹{khataSummary?.my_total_payable || 0}</p>
                                </div>
                                <div className={styles.statCard}>
                                    <h3>Total Purchases</h3>
                                    <p>₹{khataSummary?.total_purchases_value || 0}</p>
                                </div>
                                <div className={styles.statCard}>
                                    <h3>Total Payments Made</h3>
                                    <p>₹{khataSummary?.total_payments_made || 0}</p>
                                </div>
                            </div>

                            <div className={styles.ledgerTableContainer}>
                                <h3>Dealer Wise Balances</h3>
                                <table className={styles.ledgerTable}>
                                    <thead>
                                        <tr>
                                            <th>Dealer</th>
                                            <th>Business Name</th>
                                            <th>Total Purchases</th>
                                            <th>Total Payments</th>
                                            <th>Balance Due</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {khataSummary?.ledger_by_dealer?.map((entry) => (
                                            <tr key={entry.dealer_id}>
                                                <td>{entry.dealer_name}</td>
                                                <td>{entry.business_name}</td>
                                                <td>₹{entry.total_orders}</td>
                                                <td>₹{entry.total_payments}</td>
                                                <td className={entry.balance > 0 ? styles.due : styles.settled}>
                                                    ₹{entry.balance}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        <button 
                                                            className={styles.primaryBtn}
                                                            onClick={() => handleRazorpayPayment(entry)}
                                                            style={{ fontSize: '11px', padding: '5px 10px' }}
                                                            disabled={entry.balance <= 0}
                                                        >
                                                            💳 Pay Digitally
                                                        </button>
                                                        <button 
                                                            className={styles.secondaryBtn}
                                                            onClick={() => {
                                                                setMockPaymentData({ dealer: entry, amount: entry.balance });
                                                                setShowMockPaymentModal(true);
                                                            }}
                                                            style={{ fontSize: '11px', padding: '5px 10px', background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}
                                                            disabled={entry.balance <= 0}
                                                        >
                                                            🔍 Scan & Pay (Mock)
                                                        </button>
                                                        <button 
                                                            className={styles.actionButton}
                                                            onClick={() => {
                                                                const amount = prompt(`Enter cash amount paid to ${entry.business_name}:`);
                                                                if (amount && !isNaN(amount)) {
                                                                    paymentsAPI.createPayment({
                                                                        shopkeeper: shopkeeperProfile.user.id,
                                                                        dealer: entry.dealer_id,
                                                                        amount: parseFloat(amount),
                                                                        payment_method: 'cash',
                                                                        notes: 'Manual entry from Ledger'
                                                                    }).then(() => {
                                                                        fetchData();
                                                                        addToast('Cash payment recorded!', 'success');
                                                                    });
                                                                }
                                                            }}
                                                            style={{ fontSize: '11px', padding: '5px 10px' }}
                                                        >
                                                            💵 Record Cash
                                                        </button>
                                                        <button 
                                                            className={styles.textBtn}
                                                            onClick={() => handleViewLedger(entry)}
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            Details →
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {khataSummary?.ledger_by_dealer?.length === 0 && (
                                            <tr>
                                                <td colSpan="6" style={{textAlign: 'center'}}>No ledger entries found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'returns' && (
                        <div className={styles.returnsTab}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h2>Return Requests</h2>
                                    <p className={styles.subtitle}>Track and manage your product returns and issues</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        className={styles.secondaryBtn} 
                                        onClick={() => fetchData()}
                                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        🔄 Sync
                                    </button>
                                    <div className={styles.infoBadge}>
                                        <RotateCcw size={14} />
                                        <span>{myReturns.length} Total</span>
                                    </div>
                                </div>
                            </div>

                            
                            {myReturns && myReturns.length > 0 ? (
                                <>
                                    {/* Total Credit Summary Card */}
                                    <div className={styles.statsGrid} style={{ marginBottom: '20px' }}>
                                        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <div style={{ padding: '8px', background: '#fff', borderRadius: '8px', color: '#0369a1' }}>
                                                    <RotateCcw size={20} />
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>Total Return Credits</span>
                                            </div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c4a6e' }}>
                                                ₹{myReturns.filter(r => r.status === 'approved').reduce((acc, curr) => acc + (curr.credit_amount || 0), 0).toLocaleString()}
                                            </div>
                                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                                Approved credits are automatically deducted from your Digital Ledger (Khata).
                                            </p>
                                        </div>
                                    </div>

                                    <div className={styles.returnsList}>
                                        {myReturns.map(ret => (
                                            <div key={ret.id} className={`${styles.returnCard} premium-card`}>
                                                <div className={styles.returnCardHeader}>
                                                    <div className={styles.returnRef}>
                                                        <span className={styles.refLabel}>Order Ref:</span>
                                                        <strong>#{ret.order_number?.substring(0, 8)}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {ret.status === 'approved' && (
                                                            <span style={{ 
                                                                background: '#ecfdf5', 
                                                                color: '#059669', 
                                                                padding: '4px 8px', 
                                                                borderRadius: '6px', 
                                                                fontSize: '12px', 
                                                                fontWeight: 'bold' 
                                                            }}>
                                                                + ₹{ret.credit_amount?.toLocaleString()}
                                                            </span>
                                                        )}
                                                        <span className={`${styles.statusBadge} ${styles['status_' + ret.status?.toLowerCase()]}`}>
                                                            {ret.status === 'pending' && <TrendingDown size={12} />}
                                                            {ret.status === 'approved' && <ShoppingBag size={12} />}
                                                            {ret.status === 'rejected' && <RotateCcw size={12} />}
                                                            {ret.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className={styles.returnCardBody}>
                                                    <div className={styles.returnItemInfo}>
                                                        <h3>{ret.product_name}</h3>
                                                        <p>Quantity: <strong>{ret.quantity} Units</strong></p>
                                                    </div>
                                                    <div className={styles.returnReasonBox}>
                                                        <span className={styles.label}>Reason for Return:</span>
                                                        <p>{ret.reason}</p>
                                                    </div>
                                                </div>

                                            {ret.dealer_notes && (
                                                <div className={styles.dealerFeedback}>
                                                    <div className={styles.feedbackHeader}>
                                                        <strong>Dealer Feedback:</strong>
                                                    </div>
                                                    <p>{ret.dealer_notes}</p>
                                                </div>
                                            )}
                                            
                                            <div className={styles.returnCardFooter}>
                                                <span className={styles.returnDate}>Requested on: {new Date(ret.created_at).toLocaleDateString()}</span>
                                                <button className={styles.textBtn}>
                                                    <span>View Details</span>
                                                    <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>📦</div>
                                    <h3>No Returns Found</h3>
                                    <p>You haven&apos;t raised any return requests yet. You can do this from the <strong>Orders</strong> tab for delivered items.</p>
                                    <button 
                                        className={styles.secondaryBtn}
                                        onClick={() => setActiveTab('orders')}
                                        style={{ marginTop: '1rem' }}
                                    >
                                        Go to Orders
                                    </button>
                                </div>
                            )}
                        </div>
                    )}


                    {activeTab === 'profile' && (
                        <div className={styles.profileTab}>
                            <div className={styles.sectionHeader}>
                                <h2>Business Profile</h2>
                                <button 
                                    className={styles.secondaryBtn}
                                    onClick={() => {
                                        setProfileFormData({
                                            shop_name: shopkeeperProfile?.shop_name || '',
                                            business_type: shopkeeperProfile?.business_type || 'Retail',
                                            monthly_budget: shopkeeperProfile?.monthly_budget || '0',
                                        });
                                        setIsEditingProfile(!isEditingProfile);
                                    }}
                                >
                                    {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                                </button>
                            </div>

                            {isEditingProfile ? (
                                <form className={styles.editForm} onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        // Sanitize data before sending
                                        const sanitizedData = { ...profileFormData };
                                        if (sanitizedData.monthly_budget === '') sanitizedData.monthly_budget = 0;
                                        if (sanitizedData.business_type === '') sanitizedData.business_type = 'Retail';
                                        
                                        const res = await shopkeepersAPI.updateProfile(sanitizedData);
                                        setShopkeeperProfile(res.data);
                                        setIsEditingProfile(false);
                                        addToast('Profile updated successfully!', 'success');
                                        setError('');
                                    } catch (err) {
                                        setError(err.response?.data?.shop_name?.[0] || 'Failed to update profile');
                                    }
                                }}>
                                    <div className={styles.formGroup}>
                                        <label>Shop Name</label>
                                        <input 
                                            type="text" 
                                            name="shop_name"
                                            value={profileFormData.shop_name}
                                            onChange={(e) => setProfileFormData({...profileFormData, shop_name: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Business Type</label>
                                        <input 
                                            type="text" 
                                            name="business_type"
                                            value={profileFormData.business_type}
                                            onChange={(e) => setProfileFormData({...profileFormData, business_type: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Monthly Budget (₹)</label>
                                        <input 
                                            type="number" 
                                            name="monthly_budget"
                                            value={profileFormData.monthly_budget}
                                            onChange={(e) => setProfileFormData({...profileFormData, monthly_budget: e.target.value})}
                                        />
                                    </div>
                                    <button type="submit" className={styles.primaryBtn}>Save Changes</button>
                                </form>
                            ) : (
                                <div className={styles.profileInfo}>
                                    <div className={styles.infoField}>
                                        <label>Account User</label>
                                        <p>{shopkeeperProfile?.user?.username} ({shopkeeperProfile?.user?.email})</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Shop Name</label>
                                        <p>{shopkeeperProfile?.shop_name || 'N/A'}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Business Type</label>
                                        <p>{shopkeeperProfile?.business_type || 'N/A'}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Monthly Budget</label>
                                        <p>₹{Number(shopkeeperProfile?.monthly_budget || 0).toLocaleString()}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Shop Rating</label>
                                        <p>⭐ {shopkeeperProfile?.rating || '0.0'}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Total Spending</label>
                                        <p>₹{Number(shopkeeperProfile?.total_spent || 0).toLocaleString()}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Member Since</label>
                                        <p>{new Date(shopkeeperProfile?.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Notification Toasts */}
            <div className={toastStyles.toastContainer}>
                {toasts.map(toast => (
                    <NotificationToast 
                        key={toast.id} 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => removeToast(toast.id)} 
                    />
                ))}
            </div>

            {/* Ledger Detail Modal */}
            {activeLedger && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ maxWidth: '800px', width: '90%' }}>
                        <div className={styles.modalHeader}>
                            <h2>Ledger History: {activeLedger.business_name}</h2>
                            <button className={styles.closeBtn} onClick={() => setActiveLedger(null)} aria-label="Close modal">&times;</button>
                        </div>
                        {ledgerLoading ? (
                            <p>Loading history...</p>
                        ) : (
                            <div className={styles.ledgerHistory}>
                                <div className={styles.passbookTableContainer}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Reference</th>
                                                <th>Debit (Order)</th>
                                                <th>Credit (Payment)</th>
                                                <th>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ledgerHistory.map((item, idx) => (
                                                <tr key={idx} className={item.type === 'payment' ? styles.paymentRow : ''}>
                                                    <td>{new Date(item.date).toLocaleDateString()}</td>
                                                    <td>
                                                        <strong>{item.reference}</strong>
                                                        {item.status && <span className={styles.statusBadge} style={{ transform: 'scale(0.8)', marginLeft: '5px' }}>{item.status}</span>}
                                                    </td>
                                                    <td style={{ color: '#ef4444' }}>{item.type === 'order' ? `₹${item.amount}` : '-'}</td>
                                                    <td style={{ color: '#10b981' }}>{item.type === 'payment' ? `₹${item.amount}` : '-'}</td>
                                                    <td style={{ fontWeight: 'bold' }}>₹{item.balance_after}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className={styles.ledgerFooter} style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>Current Net Balance:</strong>
                                    <strong style={{ fontSize: '18px', color: activeLedger.balance > 0 ? '#ef4444' : '#10b981' }}>
                                        ₹{activeLedger.balance}
                                    </strong>
                                    <button 
                                        className={styles.primaryBtn} 
                                        onClick={() => {
                                            setMockPaymentData({ dealer: activeLedger, amount: activeLedger.balance });
                                            setShowMockPaymentModal(true);
                                        }}
                                    >
                                        Scan & Pay (Mock)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mock Payment (QR Code) Modal */}
            {showMockPaymentModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} style={{ maxWidth: '450px', background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)' }}>
                        <div className={styles.modalHeader} style={{ borderBottom: 'none' }}>
                            <div style={{ textAlign: 'center', width: '100%' }}>
                                <h2 style={{ color: '#1e3a8a', marginBottom: '5px' }}>Scan & Pay Dealer</h2>
                                <p style={{ fontSize: '14px', color: '#64748b' }}>Securely pay <strong>{mockPaymentData.dealer?.business_name}</strong></p>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setShowMockPaymentModal(false)}>&times;</button>
                        </div>
                        
                        <div className={styles.modalBody} style={{ textAlign: 'center', padding: '0 20px 20px' }}>
                            <div style={{ 
                                background: '#fff', 
                                padding: '25px', 
                                borderRadius: '16px', 
                                boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
                                border: '1px solid #e2e8f0',
                                marginBottom: '20px',
                                display: 'flex',
                                justifyContent: 'center'
                            }}>
                                <div style={{ 
                                    width: '180px', 
                                    height: '180px', 
                                    background: '#000', 
                                    padding: '10px',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gridTemplateRows: 'repeat(4, 1fr)',
                                    gap: '8px',
                                    borderRadius: '8px'
                                }}>
                                    {/* Mock QR Patterns */}
                                    <div style={{ background: '#fff', gridColumn: '1/3', gridRow: '1/3' }}></div>
                                    <div style={{ background: '#000', gridColumn: '1/2', gridRow: '1/2', margin: '4px' }}></div>
                                    <div style={{ background: '#fff', gridColumn: '3/5', gridRow: '1/3' }}></div>
                                    <div style={{ background: '#fff', gridColumn: '1/3', gridRow: '3/5' }}></div>
                                    <div style={{ background: '#fff', gridColumn: '3/5', gridRow: '3/5', display: 'grid', gap: '4px' }}>
                                        <div style={{ background: '#000' }}></div>
                                        <div style={{ background: '#000' }}></div>
                                        <div style={{ background: '#000' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '15px', padding: '10px', background: '#f1f5f9', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Amount to Pay</div>
                                <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>₹{mockPaymentData.amount.toLocaleString()}</div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>Accepted Apps</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', opacity: 0.7 }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6739b7' }}>PhonePe</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4285f4' }}>GPay</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00baf2' }}>Paytm</span>
                                </div>
                            </div>

                            <button 
                                className={styles.primaryBtn}
                                onClick={handleMockPayment}
                                style={{ width: '100%', padding: '14px', fontSize: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
                            >
                                ✅ I have Paid (Confirm)
                            </button>
                            <button 
                                className={styles.textBtn}
                                onClick={() => setShowMockPaymentModal(false)}
                                style={{ marginTop: '10px', width: '100%' }}
                            >
                                Cancel Transaction
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Request Modal */}
            {isReturnModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Report Issue: {returnForm.product_name}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsReturnModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmitReturn} className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label>Quantity to Return</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={returnForm.max_qty}
                                    value={returnForm.quantity}
                                    onChange={(e) => setReturnForm({...returnForm, quantity: e.target.value})}
                                    required
                                />
                                <small>Max allowed: {returnForm.max_qty}</small>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Reason for Return</label>
                                <textarea 
                                    value={returnForm.reason}
                                    onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
                                    placeholder="e.g. Items were crushed or leaked during transit"
                                    required
                                    rows="4"
                                />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button type="submit" className={styles.primaryBtn} style={{ width: '100%' }}>
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
