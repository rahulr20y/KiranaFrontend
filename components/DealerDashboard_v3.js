import { useState, useEffect, useRef, useCallback } from 'react';
import { productsAPI, dealersAPI, notificationsAPI, paymentsAPI, ordersAPI, shopkeepersAPI, returnsAPI } from '../lib/api';
import styles from '../styles/dashboard.module.css';
import toastStyles from '../styles/toast.module.css';
import NotificationToast from './NotificationToast';
import { useNotifications } from '../lib/notificationContext';
import NotificationBell from './NotificationBell';
import DealerAnalytics from './DealerAnalytics';
import { generateInvoicePDF } from '../lib/invoice';

export default function DealerDashboard_v3() {
    const [products, setProducts] = useState([]);
    const [dealerProfile, setDealerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('products');
    const [profileFormData, setProfileFormData] = useState({
        business_name: '',
        business_category: '',
        gst_number: '',
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [broadcasts, setBroadcasts] = useState([]);
    const { notifications, setNotifications, markAsRead } = useNotifications();
    const [shopkeepers, setShopkeepers] = useState([]);
    const [khataSummary, setKhataSummary] = useState(null);
    const [showAddBroadcast, setShowAddBroadcast] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showNewSale, setShowNewSale] = useState(false);
    const [orders, setOrders] = useState([]);
    const [broadcastFormData, setBroadcastFormData] = useState({
        title: '',
        message: '',
        notification_type: 'info',
    });
    const [saleFormData, setSaleFormData] = useState({
        shopkeeper_id: '',
        product_id: '',
        quantity: 1,
        notes: '',
    });
    const [toasts, setToasts] = useState([]);
    const [activeLedger, setActiveLedger] = useState(null);
    const [ledgerHistory, setLedgerHistory] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [returns, setReturns] = useState([]);
    const fileInputRef = useRef(null);
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
            const [productsRes, profileRes, broadcastsRes, notificationsRes, khataRes, shopkeepersRes, ordersRes, statsRes, returnsRes] = await Promise.all([
                productsAPI.myProducts(),
                dealersAPI.myProfile(),
                notificationsAPI.listBroadcasts(),
                notificationsAPI.listPersonal(),
                paymentsAPI.getSummary(),
                shopkeepersAPI.listShopkeepers(),
                ordersAPI.listOrders(),
                ordersAPI.getOrderStats(),
                returnsAPI.listReturns()
            ]);
            setProducts(Array.isArray(productsRes.data.results) ? productsRes.data.results : (Array.isArray(productsRes.data) ? productsRes.data : []));
            setDealerProfile(profileRes.data);
            setBroadcasts(Array.isArray(broadcastsRes.data.results) ? broadcastsRes.data.results : (Array.isArray(broadcastsRes.data) ? broadcastsRes.data : []));
            setNotifications(Array.isArray(notificationsRes.data.results) ? notificationsRes.data.results : (Array.isArray(notificationsRes.data) ? notificationsRes.data : []));
            setKhataSummary(khataRes.data);
            setShopkeepers(Array.isArray(shopkeepersRes.data.results) ? shopkeepersRes.data.results : (Array.isArray(shopkeepersRes.data) ? shopkeepersRes.data : []));
            setOrders(Array.isArray(ordersRes.data.results) ? ordersRes.data.results : (Array.isArray(ordersRes.data) ? ordersRes.data : []));
            setStats(statsRes.data);
            setReturns(Array.isArray(returnsRes.data) ? returnsRes.data : []);
            
            // Auto-toast for low stock if we just fetched
            const productsArr = Array.isArray(productsRes.data.results) ? productsRes.data.results : (Array.isArray(productsRes.data) ? productsRes.data : []);
            const lowStockProducts = productsArr.filter(p => p.stock_quantity <= p.low_stock_threshold);
            if (lowStockProducts.length > 0) {
              addToast(`Alert: ${lowStockProducts.length} items are low on stock!`, 'warning');
            }
            setProfileFormData({
                business_name: profileRes.data.business_name || '',
                business_category: profileRes.data.business_category || '',
                gst_number: profileRes.data.gst_number || '',
            });
            setError('');
        } catch (err) {
            setError('Failed to load dealer information');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [setNotifications, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle real-time notification toasts
    useEffect(() => {
      const latestNotification = notifications[0];
      if (latestNotification && !latestNotification.is_read && latestNotification.id !== lastToastedId.current) {
        // Only show toast if it's "fresh" (within last few seconds) to avoid spam on load
        const createdAt = new Date(latestNotification.created_at);
        const now = new Date();
        if (now - createdAt < 5000) {
          addToast(latestNotification.message, latestNotification.notification_type === 'low_stock' ? 'warning' : 'info');
          lastToastedId.current = latestNotification.id;
          
          // Also optionally refresh the dashboard if it's an order update
          if (latestNotification.notification_type === 'order_update') {
            fetchData();
          }
        }
      }
    }, [notifications, addToast, fetchData]);

    const handleBulkImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            const res = await productsAPI.bulkImport(file);
            addToast(res.data.message, 'success');
            if (res.data.errors && res.data.errors.length > 0) {
              addToast(`Heads up: ${res.data.errors.length} rows had errors.`, 'warning');
              console.warn('Import errors:', res.data.errors);
            }
            fetchData();
        } catch (err) {
            addToast('Failed to import products. Check CSV format.', 'error');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        let otp = null;
        if (newStatus === 'delivered') {
            otp = prompt('Enter Secure OTP from Shopkeeper to finalize delivery:');
            if (!otp) return;
        }

        try {
            setLoading(true);
            await ordersAPI.updateOrderStatus(orderId, { status: newStatus, otp });
            addToast(`Order status updated to ${newStatus}`, 'success');
            fetchData();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to update status', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewLedger = async (shopkeeper) => {
        try {
            setLedgerLoading(true);
            setActiveLedger(shopkeeper);
            const res = await paymentsAPI.detailedLedger(shopkeeper.shopkeeper_id);
            setLedgerHistory(res.data.history);
        } catch (err) {
            addToast('Failed to load ledger history', 'error');
            setActiveLedger(null);
        } finally {
            setLedgerLoading(false);
        }
    };

    const handleAddBroadcast = async (e) => {
        e.preventDefault();
        try {
            await notificationsAPI.createBroadcast(broadcastFormData);
            setBroadcastFormData({
                title: '',
                message: '',
                notification_type: 'info',
            });
            setShowAddBroadcast(false);
            fetchData();
            setSuccess('Broadcast sent to all followers!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to send broadcast');
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        low_stock_threshold: 10,
        category: '',
        price_tiers: []
    });

    const handleCreateSale = async (e) => {
        e.preventDefault();
        try {
            const { ordersAPI } = await import('../lib/api');
            const selectedProduct = products.find(p => p.id === parseInt(saleFormData.product_id));
            if (!selectedProduct) return setError('Please select a product');
            
            const orderData = {
                shopkeeper_id: parseInt(saleFormData.shopkeeper_id),
                items: [{
                    product: selectedProduct.id,
                    product_name: selectedProduct.name,
                    product_price: selectedProduct.price,
                    quantity: parseInt(saleFormData.quantity),
                    unit: selectedProduct.unit || 'unit',
                    subtotal: selectedProduct.price * parseInt(saleFormData.quantity)
                }],
                shipping_address: 'In-person / Dealer Warehouse',
                notes: saleFormData.notes,
                discount: 0
            };
            
            await ordersAPI.createOrder(orderData);
            addToast('Sale recorded successfully!', 'success');
            setShowNewSale(false);
            setSaleFormData({ shopkeeper_id: '', product_id: '', quantity: 1, notes: '' });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to record sale');
        }
    };

    const handleApproveReturn = async (id) => {
        const notes = prompt('Enter notes for approval (optional):', 'Approved and credited.');
        try {
            setLoading(true);
            await returnsAPI.approveReturn(id, { dealer_notes: notes });
            addToast('Return approved and amount credited to Khata!', 'success');
            fetchData();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to approve return', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectReturn = async (id) => {
        const notes = prompt('Reason for rejection (required):');
        if (!notes) return;
        try {
            setLoading(true);
            await returnsAPI.rejectReturn(id, { dealer_notes: notes });
            addToast('Return request rejected.', 'info');
            fetchData();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to reject return', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const submissionData = { ...formData };
            if (!submissionData.category) {
                delete submissionData.category;
            }
            await productsAPI.createProduct(submissionData);
            setFormData({
                name: '',
                description: '',
                price: '',
                stock_quantity: '',
                low_stock_threshold: 10,
                category: '',
            });
            setShowAddProduct(false);
            fetchData();
            setSuccess('Product added successfully!');
        } catch (err) {
            setError('Failed to add product');
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.dashboardHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1>Dealer Dashboard <span style={{ fontSize: '10px', opacity: 0.5 }}>[v1.7 FORCED]</span></h1>
                        <p>Welcome, {dealerProfile?.business_name || 'Dealer'}</p>
                    </div>
                    <NotificationBell />
                </div>
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}
            {success && <div className={styles.successAlert}>{success}</div>}

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>{products.length}</div>
                    <div className={styles.statLabel}>Total Products</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>{dealerProfile?.rating || '0.0'}</div>
                    <div className={styles.statLabel}>Average Rating</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>{dealerProfile?.total_orders || '0'}</div>
                    <div className={styles.statLabel}>Total Orders</div>
                </div>
            </div>

            <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'products' ? styles.active : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        My Products
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
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
                        className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        Notifications {Array.isArray(notifications) && notifications.filter(n => !n.is_read).length > 0 && `(${notifications.filter(n => !n.is_read).length})`}
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        📈 Analytics
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'khata' ? styles.active : ''}`}
                        onClick={() => setActiveTab('khata')}
                    >
                        Khata (Ledger)
                    </button>
                     <button
                        className={`${styles.tab} ${activeTab === 'returns' ? styles.active : ''}`}
                        onClick={() => setActiveTab('returns')}
                    >
                        Returns {Array.isArray(returns) && returns.filter(r => r.status === 'pending').length > 0 && `(${returns.filter(r => r.status === 'pending').length})`}
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'products' && (
                        <div className={styles.productsTab}>
                            <div className={styles.sectionHeader}>
                                <h2>My Products</h2>
                                <div className={styles.sectionActions}>
                                    <button
                                        className={styles.secondaryBtn}
                                        onClick={() => setShowNewSale(!showNewSale)}
                                        style={{ marginRight: '10px' }}
                                    >
                                        {showNewSale ? 'Cancel Sale' : '🤝 New Sale'}
                                    </button>
                                    <button
                                        className={styles.secondaryBtn}
                                        onClick={() => fileInputRef.current.click()}
                                        style={{ marginRight: '10px' }}
                                    >
                                        📥 Bulk Import
                                    </button>
                                    <span style={{ fontSize: '10px', color: '#666', marginRight: '10px' }}>
                                        (CSV: name, price, stock)
                                    </span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleBulkImport} 
                                        style={{ display: 'none' }} 
                                        accept=".csv"
                                    />
                                    <button
                                        className={styles.primaryBtn}
                                        onClick={() => setShowAddProduct(!showAddProduct)}
                                    >
                                        {showAddProduct ? 'Cancel' : '+ Add Product'}
                                    </button>
                                </div>
                            </div>

                            {showNewSale && (
                                <form onSubmit={handleCreateSale} className={styles.formCard}>
                                    <h3>Record New Sale</h3>
                                    <div className={styles.formGrid}>
                                        <div className={styles.formGroup}>
                                            <label>Select Shopkeeper</label>
                                            <select 
                                                name="shopkeeper_id"
                                                value={saleFormData.shopkeeper_id}
                                                onChange={(e) => setSaleFormData({...saleFormData, shopkeeper_id: e.target.value})}
                                                required
                                            >
                                                <option value="">-- Select Shopkeeper --</option>
                                                {shopkeepers.map(sk => (
                                                    <option key={sk.id} value={sk.id}>{sk.shop_name || sk.user.username}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Select Product</label>
                                            <select 
                                                name="product_id"
                                                value={saleFormData.product_id}
                                                onChange={(e) => setSaleFormData({...saleFormData, product_id: e.target.value})}
                                                required
                                            >
                                                <option value="">-- Select Product --</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Quantity</label>
                                            <input 
                                                type="number" 
                                                name="quantity"
                                                value={saleFormData.quantity}
                                                onChange={(e) => setSaleFormData({...saleFormData, quantity: e.target.value})}
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Notes</label>
                                        <input 
                                            type="text" 
                                            value={saleFormData.notes}
                                            onChange={(e) => setSaleFormData({...saleFormData, notes: e.target.value})}
                                            placeholder="e.target.value"
                                        />
                                    </div>
                                    <button type="submit" className={styles.primaryBtn}>Record Sale & Deduct Stock</button>
                                </form>
                            )}

                            {showAddProduct && (
                                <form onSubmit={handleAddProduct} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label>Product Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            placeholder="Enter product name"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleFormChange}
                                            placeholder="Product description"
                                            rows="4"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>Price (₹)</label>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleFormChange}
                                                placeholder="Product price"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Stock Quantity</label>
                                            <input
                                                type="number"
                                                name="stock_quantity"
                                                value={formData.stock_quantity}
                                                onChange={handleFormChange}
                                                placeholder="Available stock"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Low Stock Alert At</label>
                                            <input
                                                type="number"
                                                name="low_stock_threshold"
                                                value={formData.low_stock_threshold}
                                                onChange={handleFormChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.tiersSection} style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h4>💰 Bulk Tiered Pricing (Optional)</h4>
                                            <button 
                                                type="button" 
                                                className={styles.secondaryBtn} 
                                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                                onClick={() => setFormData({...formData, price_tiers: [...formData.price_tiers, { min_quantity: '', price: '' }]})}
                                            >
                                                + Add Tier
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                            Encourage larger orders by offering lower prices for higher quantities. 
                                            (e.g., Min: 50, Price: 90)
                                        </p>
                                        {formData.price_tiers.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {formData.price_tiers.map((tier, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '11px' }}>Min Quantity</label>
                                                            <input 
                                                                type="number" 
                                                                value={tier.min_quantity}
                                                                onChange={(e) => {
                                                                    const newTiers = [...formData.price_tiers];
                                                                    newTiers[idx].min_quantity = e.target.value;
                                                                    setFormData({...formData, price_tiers: newTiers});
                                                                }}
                                                                placeholder="50"
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '11px' }}>Special Price (₹)</label>
                                                            <input 
                                                                type="number" 
                                                                value={tier.price}
                                                                onChange={(e) => {
                                                                    const newTiers = [...formData.price_tiers];
                                                                    newTiers[idx].price = e.target.value;
                                                                    setFormData({...formData, price_tiers: newTiers});
                                                                }}
                                                                placeholder="90"
                                                            />
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                const newTiers = formData.price_tiers.filter((_, i) => i !== idx);
                                                                setFormData({...formData, price_tiers: newTiers});
                                                            }}
                                                            style={{ padding: '8px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button type="submit" className={styles.primaryBtn}>
                                        Add Product
                                    </button>
                                </form>
                            )}

                            {loading ? (
                                <p>Loading products...</p>
                            ) : products.length === 0 ? (
                                <p className={styles.emptyMessage}>No products yet. Add your first product!</p>
                            ) : (
                                <div className={styles.productsTable}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Price</th>
                                                <th>Stock</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((product) => (
                                                <tr key={product.id} className={product.stock_quantity <= product.low_stock_threshold ? styles.lowStockRow : ''}>
                                                    <td>{product.name}</td>
                                                    <td>₹{product.price}</td>
                                                    <td>
                                                        {product.stock_quantity}
                                                        {product.stock_quantity <= product.low_stock_threshold && (
                                                            <span className={styles.lowStockBadge}>LOW STOCK</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button className={styles.btnSmall}>Edit</button>
                                                        <button className={styles.btnSmallDanger}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'khata' && (
                    <div className={styles.khataSection}>
                        <h2>Khata (Digital Ledger)</h2>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <h3>Total Receivable</h3>
                                <p className={styles.amount}>₹{khataSummary?.my_total_receivable || 0}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Total Orders Value</h3>
                                <p>₹{khataSummary?.total_orders_value || 0}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Total Payments Received</h3>
                                <p>₹{khataSummary?.total_payments_received || 0}</p>
                            </div>
                        </div>

                        <div className={styles.ledgerTableContainer}>
                            <h3>Shopkeeper Wise Balances</h3>
                            <table className={styles.ledgerTable}>
                                <thead>
                                    <tr>
                                        <th>Shopkeeper</th>
                                        <th>Business Name</th>
                                        <th>Total Orders</th>
                                        <th>Total Payments</th>
                                        <th>Balance Due</th>
                                        <th>Credit Limit</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {khataSummary?.ledger_by_shopkeeper?.map((entry) => (
                                        <tr key={entry.shopkeeper_id}>
                                            <td>{entry.shopkeeper_name}</td>
                                            <td>{entry.business_name}</td>
                                            <td>₹{entry.total_orders}</td>
                                            <td>₹{entry.total_payments}</td>
                                            <td className={entry.balance > 0 ? styles.due : styles.settled}>
                                                ₹{entry.balance}
                                            </td>
                                            <td style={{ color: entry.balance > entry.credit_limit ? '#ef4444' : '#64748b' }}>
                                                ₹{entry.credit_limit}
                                                {entry.balance > entry.credit_limit && ' ⚠️'}
                                            </td>
                                            <td>
                                                <button 
                                                    className={styles.actionButton}
                                                    onClick={() => {
                                                        const amount = prompt(`Enter amount paid by ${entry.business_name}:`);
                                                        if (amount && !isNaN(amount)) {
                                                            paymentsAPI.createPayment({
                                                                shopkeeper: entry.shopkeeper_id,
                                                                dealer: dealerProfile.user.id,
                                                                amount: parseFloat(amount),
                                                                payment_method: 'cash',
                                                                notes: 'Manual entry from Ledger'
                                                            }).then(() => fetchData());
                                                        }
                                                    }}
                                                >
                                                    Record Payment
                                                </button>
                                                <button 
                                                    className={styles.secondaryBtn}
                                                    style={{ marginLeft: '5px', padding: '4px 8px', fontSize: '11px' }}
                                                    onClick={() => {
                                                        const limit = prompt(`Set Credit Limit for ${entry.business_name}:`, entry.credit_limit);
                                                        if (limit !== null && !isNaN(limit)) {
                                                            paymentsAPI.createCreditLimit({
                                                                shopkeeper: entry.shopkeeper_id,
                                                                limit_amount: parseFloat(limit)
                                                            }).then(() => fetchData())
                                                              .catch(() => {
                                                                  // If already exists, we should probably have an update API or just try to find the ID.
                                                                  // For simplicity in this prompt flow, we'll just log or notify.
                                                                  alert("Limit already exists or failed to update. Use management tool for existing limits.");
                                                              });
                                                        }
                                                    }}
                                                >
                                                    Set Limit
                                                </button>
                                                <button 
                                                    className={styles.textBtn}
                                                    onClick={() => handleViewLedger(entry)}
                                                    style={{ marginLeft: '5px' }}
                                                >
                                                    Details →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {khataSummary?.ledger_by_shopkeeper?.length === 0 && (
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
                                <h2>Manage Returns & Claims</h2>
                                <span className={styles.subtitle}>Handle damaged goods reports from shopkeepers</span>
                            </div>
                            {returns && returns.length > 0 ? (
                                <div className={styles.returnsGrid}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Shopkeeper</th>
                                                <th>Order Reference</th>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Reason</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {returns.map(ret => (
                                                <tr key={ret.id}>
                                                    <td>{ret.shopkeeper_name}</td>
                                                    <td>#{ret.order_number?.substring(0, 8)}</td>
                                                    <td>{ret.product_name}</td>
                                                    <td>{ret.quantity}</td>
                                                    <td title={ret.reason}>{ret.reason?.substring(0, 50)}...</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${styles['status_' + ret.status?.toLowerCase()]}`}>
                                                            {ret.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {ret.status === 'pending' && (
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button 
                                                                    className={styles.btnSmall} 
                                                                    style={{ background: '#10b981', color: '#fff' }}
                                                                    onClick={() => handleApproveReturn(ret.id)}
                                                                >
                                                                    Approve & Credit
                                                                </button>
                                                                <button 
                                                                    className={styles.btnSmallDanger}
                                                                    onClick={() => handleRejectReturn(ret.id)}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {ret.status !== 'pending' && (
                                                            <small style={{ color: '#64748b' }}>Processed</small>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className={styles.emptyMessage}>No return requests to display.</p>
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
                                            business_name: dealerProfile?.business_name || '',
                                            business_category: dealerProfile?.business_category || 'General',
                                            gst_number: dealerProfile?.gst_number || '',
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
                                        if (sanitizedData.business_category === '') sanitizedData.business_category = 'General';
                                        
                                        const res = await dealersAPI.updateProfile(sanitizedData);
                                        setDealerProfile(res.data);
                                        setIsEditingProfile(false);
                                        addToast('Profile updated successfully!', 'success');
                                        setError('');
                                    } catch (err) {
                                        setError(err.response?.data?.business_name?.[0] || 'Failed to update profile');
                                    }
                                }}>
                                    <div className={styles.formGroup}>
                                        <label>Business Name</label>
                                        <input 
                                            type="text" 
                                            name="business_name"
                                            value={profileFormData.business_name}
                                            onChange={(e) => setProfileFormData({...profileFormData, business_name: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Business Category</label>
                                        <input 
                                            type="text" 
                                            name="business_category"
                                            value={profileFormData.business_category}
                                            onChange={(e) => setProfileFormData({...profileFormData, business_category: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>GST Number</label>
                                        <input 
                                            type="text" 
                                            name="gst_number"
                                            value={profileFormData.gst_number}
                                            onChange={(e) => setProfileFormData({...profileFormData, gst_number: e.target.value})}
                                        />
                                    </div>
                                    <button type="submit" className={styles.primaryBtn}>Save Changes</button>
                                </form>
                            ) : (
                                <div className={styles.profileInfo}>
                                    <div className={styles.infoField}>
                                        <label>Account User</label>
                                        <p>{dealerProfile?.user?.username} ({dealerProfile?.user?.email})</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Business Name</label>
                                        <p>{dealerProfile?.business_name || 'N/A'}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Category</label>
                                        <p>{dealerProfile?.business_category || 'N/A'}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>GST Number</label>
                                        <p>{dealerProfile?.gst_number || 'N/A'}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Business Rating</label>
                                        <p>⭐ {dealerProfile?.rating || '0.0'}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Total Orders Received</label>
                                        <p>{dealerProfile?.total_orders || '0'}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>License</label>
                                        <p>{dealerProfile?.business_license || 'N/A'}</p>
                                    </div>
                                    <div className={styles.infoField}>
                                        <label>Member Since</label>
                                        <p>{new Date(dealerProfile?.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className={styles.notificationsTab}>
                            <div className={styles.sectionHeader}>
                                <h2>Notifications</h2>
                                <button 
                                    className={styles.secondaryBtn}
                                    onClick={async () => {
                                        await notificationsAPI.markAllAsRead();
                                        fetchData();
                                    }}
                                >
                                    Mark all as read
                                </button>
                            </div>

                            {notifications.length === 0 ? (
                                <p className={styles.emptyMessage}>No notifications yet.</p>
                            ) : (
                                <div className={styles.notificationList}>
                                    {notifications.map((notification) => (
                                        <div 
                                            key={notification.id} 
                                            className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''} ${styles['type_' + notification.notification_type]}`}
                                            onClick={async () => {
                                                if (!notification.is_read) {
                                                    await notificationsAPI.markAsRead(notification.id);
                                                    fetchData();
                                                }
                                            }}
                                        >
                                            <div className={styles.notificationHeader}>
                                                <strong>{notification.title}</strong>
                                                <span className={styles.date}>{new Date(notification.created_at).toLocaleString()}</span>
                                            </div>
                                            <p>{notification.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'broadcasts' && (
                        <div className={styles.broadcastsTab}>
                            <div className={styles.sectionHeader}>
                                <h2>Sent Broadcasts</h2>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={() => setShowAddBroadcast(!showAddBroadcast)}
                                >
                                    {showAddBroadcast ? 'Cancel' : '📢 Send Broadcast'}
                                </button>
                            </div>

                            {showAddBroadcast && (
                                <form onSubmit={handleAddBroadcast} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label>Broadcast Title</label>
                                        <input
                                            type="text"
                                            value={broadcastFormData.title}
                                            onChange={(e) => setBroadcastFormData({...broadcastFormData, title: e.target.value})}
                                            placeholder="Broadcast Title"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Message</label>
                                        <textarea
                                            value={broadcastFormData.message}
                                            onChange={(e) => setBroadcastFormData({...broadcastFormData, message: e.target.value})}
                                            placeholder="Message to all your followers..."
                                            rows="4"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Urgency Level</label>
                                        <select 
                                            value={broadcastFormData.notification_type}
                                            onChange={(e) => setBroadcastFormData({...broadcastFormData, notification_type: e.target.value})}
                                        >
                                            <option value="info">Information (Blue)</option>
                                            <option value="success">Promotion (Green)</option>
                                            <option value="warning">Important (Orange)</option>
                                            <option value="error">Critical (Red)</option>
                                        </select>
                                    </div>
                                    <button type="submit" className={styles.primaryBtn}>
                                        Broadcast to Followers
                                    </button>
                                </form>
                            )}

                            {loading ? (
                                <p>Loading broadcasts...</p>
                            ) : broadcasts.length === 0 ? (
                                <p className={styles.emptyMessage}>No broadcasts sent yet.</p>
                            ) : (
                                <div className={styles.broadcastList}>
                                    {broadcasts.map((broadcast) => (
                                        <div key={broadcast.id} className={`${styles.broadcastCard} ${styles['type_' + broadcast.notification_type]}`}>
                                            <div className={styles.broadcastHeader}>
                                                <h3>{broadcast.title}</h3>
                                                <span className={styles.broadcastDate}>
                                                    {new Date(broadcast.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p>{broadcast.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className={styles.ordersTab}>
                            <div className={styles.sectionHeader}>
                                <h2>Recent Orders</h2>
                            </div>
                            
                            {orders.length === 0 ? (
                                <div className={styles.emptyMessage}>
                                    No orders yet. Start selling to see orders here!
                                </div>
                            ) : (
                                <div className={styles.ordersGrid}>
                                    {orders.map((order) => (
                                        <div key={order.id} className={styles.orderCard}>
                                            <div className={styles.orderHeader}>
                                                <h3>Order #{order.order_number}</h3>
                                                <span className={`${styles.statusBadge} ${styles['status_' + order.status]}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className={styles.orderDetails}>
                                                <p><strong>Shopkeeper:</strong> {order.shopkeeper_name}</p>
                                                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                                                <p><strong>Items:</strong> {order.items?.length || 0}</p>
                                            </div>
                                            <div className={styles.orderTotal}>
                                                <strong>Total: ₹{order.net_amount || order.total_amount}</strong>
                                            </div>
                                            
                                            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {order.status === 'pending' && (
                                                    <button 
                                                        className={styles.primaryBtn}
                                                        onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                                                        style={{ width: '100%', fontSize: '12px' }}
                                                    >
                                                        ✅ Confirm Order
                                                    </button>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button 
                                                        className={styles.primaryBtn}
                                                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                                        style={{ width: '100%', fontSize: '12px', background: '#f59e0b' }}
                                                    >
                                                        🚚 Mark as Shipped
                                                    </button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button 
                                                        className={styles.primaryBtn}
                                                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                                        style={{ width: '100%', fontSize: '12px', background: '#10b981' }}
                                                    >
                                                        🛡️ Mark Delivered (Verify OTP)
                                                    </button>
                                                )}
                                                <button 
                                                    className={styles.textBtn}
                                                    style={{ fontSize: '12px' }}
                                                    onClick={() => generateInvoicePDF(order)}
                                                >
                                                    📄 Download Invoice
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'analytics' && <DealerAnalytics stats={stats} />}
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
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
