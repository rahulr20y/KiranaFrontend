import { useState, useEffect } from 'react';
import { shopkeepersAPI, dealersAPI, ordersAPI, notificationsAPI, paymentsAPI } from '../lib/api';
import styles from '../styles/dashboard.module.css';
import toastStyles from '../styles/toast.module.css';
import NotificationToast from './NotificationToast';

export default function ShopkeeperDashboard_v3() {
    const [shopkeeperProfile, setShopkeeperProfile] = useState(null);
    const [preferredDealers, setPreferredDealers] = useState([]);
    const [allDealers, setAllDealers] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const [notifications, setNotifications] = useState([]);
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch Profile first to trigger backend lazy creation, preventing 404 on followed dealers
            const profileRes = await shopkeepersAPI.myProfile();
            const [dealersRes, preferredDealersRes, ordersRes, broadcastsRes, notificationsRes, khataRes] = await Promise.all([
                dealersAPI.listDealers(),
                shopkeepersAPI.getPreferredDealers(),
                ordersAPI.myOrders(),
                notificationsAPI.listBroadcasts(),
                notificationsAPI.listPersonal(),
                paymentsAPI.getSummary(),
            ]);
            setShopkeeperProfile(profileRes.data);
            setProfileFormData({
                shop_name: profileRes.data.shop_name || '',
                business_type: profileRes.data.business_type || '',
                monthly_budget: profileRes.data.monthly_budget || '',
            });
            setAllDealers(dealersRes.data.results || dealersRes.data || []);
            setPreferredDealers(preferredDealersRes.data || []);
            setRecentOrders(ordersRes.data || []);
            setBroadcasts(broadcastsRes.data.results || broadcastsRes.data || []);
            setNotifications(notificationsRes.data.results || notificationsRes.data || []);
            setKhataSummary(khataRes.data);
            setError('');
        } catch (err) {
            setError('Failed to load shopkeeper information');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

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

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.dashboardHeader}>
                <h1>Shopkeeper Dashboard</h1>
                <p>Welcome, {shopkeeperProfile?.shop_name || 'Shopkeeper'}</p>
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>{shopkeeperProfile?.total_orders || '0'}</div>
                    <div className={styles.statLabel}>Active Orders</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>{preferredDealers.length || '0'}</div>
                    <div className={styles.statLabel}>Preferred Dealers</div>
                </div>
                <div className={styles.statCard}>
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
                        Overview
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'dealers' ? styles.active : ''}`}
                        onClick={() => setActiveTab('dealers')}
                    >
                        Dealers
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Orders
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'broadcasts' ? styles.active : ''}`}
                        onClick={() => setActiveTab('broadcasts')}
                    >
                        Broadcasts
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'khata' ? styles.active : ''}`}
                        onClick={() => setActiveTab('khata')}
                    >
                        Khata (Ledger)
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'overview' && (
                        <div className={styles.overviewTab}>
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
                                    {allDealers.map((dealer) => (
                                        <div key={dealer.id} className={styles.dealerCard}>
                                            <h3>{dealer.business_name}</h3>
                                            <p className={styles.dealerInfo}>
                                                License: {dealer.license}
                                            </p>
                                            <p className={styles.dealerInfo}>
                                                GST: {dealer.gst_number}
                                            </p>
                                            <button
                                                className={styles.primaryBtn}
                                                onClick={() => handleFollowDealer(dealer.id)}
                                            >
                                                Follow Dealer
                                            </button>
                                        </div>
                                    ))}
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
                                                <p>Dealer: {order.dealer?.business_name || 'N/A'}</p>
                                                <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className={styles.orderTotal}>
                                                <strong>Total: ₹{Number(order.net_amount || order.total_amount).toLocaleString()}</strong>
                                            </div>
                                            {order.status !== 'cancelled' && (
                                                <button 
                                                    className={styles.btnSmallDanger}
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    style={{ marginTop: '10px' }}
                                                >
                                                    Cancel Order
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
                                        const res = await shopkeepersAPI.updateProfile(profileFormData);
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
                            <button className={styles.closeBtn} onClick={() => setActiveLedger(null)}>&times;</button>
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
                                                <th>Debit (Purchase)</th>
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
                                    <strong>Current Net Payable:</strong>
                                    <strong style={{ fontSize: '18px', color: activeLedger.balance > 0 ? '#ef4444' : '#10b981' }}>
                                        ₹{activeLedger.balance}
                                    </strong>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
