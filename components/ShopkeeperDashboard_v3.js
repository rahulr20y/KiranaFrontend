import { useState, useEffect } from 'react';
import { shopkeepersAPI, dealersAPI, ordersAPI, notificationsAPI, paymentsAPI } from '../lib/api';
import styles from '../styles/dashboard.module.css';

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

    const handleFollowDealer = async (dealerId) => {
        try {
            await shopkeepersAPI.followDealer(dealerId);
            fetchData();
        } catch (err) {
            setError('Failed to follow dealer');
        }
    };

    const handleUnfollowDealer = async (dealerId) => {
        try {
            await shopkeepersAPI.unfollowDealer(dealerId);
            fetchData();
        } catch (err) {
            setError('Failed to unfollow dealer');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        try {
            await ordersAPI.cancelOrder(orderId);
            fetchData();
            alert('Order cancelled and stock restored!');
        } catch (err) {
            setError('Failed to cancel order');
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
                                                    <button 
                                                        className={styles.actionButton}
                                                        onClick={() => {
                                                            const amount = prompt(`Enter amount paid to ${entry.business_name}:`);
                                                            if (amount && !isNaN(amount)) {
                                                                paymentsAPI.createPayment({
                                                                    shopkeeper: shopkeeperProfile.user.id,
                                                                    dealer: entry.dealer_id,
                                                                    amount: parseFloat(amount),
                                                                    payment_method: 'cash',
                                                                    notes: 'Manual entry from Ledger'
                                                                }).then(() => fetchData());
                                                            }
                                                        }}
                                                    >
                                                        Record Payment
                                                    </button>
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
                                    onClick={() => setIsEditingProfile(!isEditingProfile)}
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
                                        alert('Profile updated successfully!');
                                    } catch (err) {
                                        alert('Failed to update profile');
                                    }
                                }}>
                                    <div className={styles.formGroup}>
                                        <label>Shop Name</label>
                                        <input 
                                            type="text" 
                                            value={profileFormData.shop_name}
                                            onChange={(e) => setProfileFormData({...profileFormData, shop_name: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Business Type</label>
                                        <input 
                                            type="text" 
                                            value={profileFormData.business_type}
                                            onChange={(e) => setProfileFormData({...profileFormData, business_type: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Monthly Budget (₹)</label>
                                        <input 
                                            type="number" 
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
        </div>
    );
}
