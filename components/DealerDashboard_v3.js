import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
    Users, 
    Package, 
    ShoppingCart, 
    Bell, 
    TrendingUp, 
    CreditCard, 
    RotateCcw, 
    ChevronRight, 
    CheckCircle, 
    XCircle, 
    Clock, 
    FileText,
    ArrowRight,
    MapPin,
    Truck,
    Map
} from 'lucide-react';
import { productsAPI, dealersAPI, notificationsAPI, paymentsAPI, ordersAPI, shopkeepersAPI, returnsAPI } from '../lib/api';

import styles from '../styles/dashboard.module.css';
import toastStyles from '../styles/toast.module.css';
import NotificationToast from './NotificationToast';
import { useNotifications } from '../lib/notificationContext';
import NotificationBell from './NotificationBell';
import DealerAnalytics from './DealerAnalytics';
import { generateInvoicePDF } from '../lib/invoice';
import { useAuth } from '../lib/authContext';

export default function DealerDashboard_v3() {
    const { user } = useAuth();
    const isStaff = user?.user_type === 'dealer_staff';
    const [staff, setStaff] = useState([]);
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [staffFormData, setStaffFormData] = useState({
        username: '',
        email: '',
        role: 'Delivery Manager',
        can_manage_orders: true,
        can_manage_inventory: false,
        can_view_analytics: false
    });
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
    const [routePlan, setRoutePlan] = useState(null);
    const [showEditProduct, setShowEditProduct] = useState(false);
    const [editProductData, setEditProductData] = useState({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        low_stock_threshold: 10,
    });
    const fileInputRef = useRef(null);
    const lastToastedId = useRef(null);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [activeAuditLogs, setActiveAuditLogs] = useState([]);
    const [activeAuditProduct, setActiveAuditProduct] = useState(null);

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
            setReturns(Array.isArray(returnsRes.data.results) ? returnsRes.data.results : (Array.isArray(returnsRes.data) ? returnsRes.data : []));
            
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

            // Fetch Route Plan
            try {
                const routeRes = await ordersAPI.getRoutePlan();
                setRoutePlan(routeRes.data);
            } catch (rErr) {
                console.warn("Failed to fetch route plan", rErr);
            }

            // Fetch Staff if Dealer
            if (!isStaff) {
                try {
                    const staffRes = await dealersAPI.getStaff();
                    setStaff(staffRes.data);
                } catch (sErr) {
                    console.warn("Failed to fetch staff", sErr);
                }
            }

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

    const handleViewAuditLogs = async (product) => {
        try {
            setLoading(true);
            setActiveAuditProduct(product);
            const res = await productsAPI.getAuditLogs(product.id);
            setActiveAuditLogs(res.data);
            setShowAuditModal(true);
        } catch (err) {
            addToast('Failed to load inventory audit logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStockUpdate = async (product) => {
        const amount = prompt(`Update stock for ${product.name}. Current: ${product.stock_quantity}. Enter change (e.g., +50 or -10):`);
        if (!amount || isNaN(amount)) return;
        
        const reason = prompt('Reason for change (restock, sale, return, correction):', 'restock');
        if (!reason) return;
        
        const notes = prompt('Additional notes (optional):');
        
        try {
            setLoading(true);
            await productsAPI.updateStock(product.id, { 
                amount: parseInt(amount), 
                reason, 
                notes 
            });
            addToast('Stock updated successfully', 'success');
            fetchData();
        } catch (err) {
            addToast('Failed to update stock', 'error');
        } finally {
            setLoading(false);
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

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            setLoading(true);
            await productsAPI.deleteProduct(id);
            addToast('Product deleted successfully!', 'success');
            fetchData();
        } catch (err) {
            addToast('Failed to delete product', 'error');
        } finally {
            setLoading(true);
        }
    };

    const handleEditProductClick = (product) => {
        setEditProductData(product);
        setShowEditProduct(true);
    };

    const handleEditProductSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await productsAPI.updateProduct(editProductData.id, editProductData);
            addToast('Product updated successfully!', 'success');
            setShowEditProduct(false);
            fetchData();
        } catch (err) {
            addToast('Failed to update product', 'error');
        } finally {
            setLoading(false);
        }
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
                        <h1>Dealer Dashboard</h1>
                        <p>Welcome, {dealerProfile?.business_name || 'Dealer'}</p>
                    </div>
                    <NotificationBell />
                </div>
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}
            {success && <div className={styles.successAlert}>{success}</div>}

            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} premium-card`}>
                    <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                        <Package size={24} />
                    </div>
                    <div>
                        <div className={styles.statNumber}>{products.length}</div>
                        <div className={styles.statLabel}>Live Products</div>
                    </div>
                </div>
                <div className={`${styles.statCard} premium-card`}>
                    <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <div className={styles.statNumber}>{stats?.total_orders || '0'}</div>
                        <div className={styles.statLabel}>Total Sales</div>
                    </div>
                </div>
                <div className={`${styles.statCard} premium-card`}>
                    <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <div className={styles.statNumber}>₹{stats?.total_amount || '0'}</div>
                        <div className={styles.statLabel}>Revenue</div>
                    </div>
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
                        className={`${styles.tab} ${activeTab === 'route' ? styles.active : ''}`}
                        onClick={() => setActiveTab('route')}
                    >
                        <Truck size={18} />
                        <span>Route</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'broadcasts' ? styles.active : ''}`}
                        onClick={() => setActiveTab('broadcasts')}
                    >
                        Broadcasts
                    </button>
                    {!isStaff && (
                        <button
                            className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            📈 Analytics
                        </button>
                    )}
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
                        <RotateCcw size={18} />
                        <span>Returns</span>
                        {returns.filter(r => r.status === 'pending').length > 0 && (
                            <span className={styles.tabBadge}>{returns.filter(r => r.status === 'pending').length}</span>
                        )}
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
                                            placeholder="Enter notes for this sale"
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
                                                        <div className={styles.stockActions}>
                                                            <button 
                                                                className={styles.auditIconBtn}
                                                                onClick={() => handleViewAuditLogs(product)}
                                                                title="View Inventory Audit History"
                                                            >
                                                                📊
                                                            </button>
                                                            <button 
                                                                className={styles.auditIconBtn}
                                                                onClick={() => handleQuickStockUpdate(product)}
                                                                title="Quick Stock Update"
                                                            >
                                                                ✏️
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className={styles.btnSmall}
                                                            onClick={() => handleEditProductClick(product)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className={styles.btnSmallDanger}
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'route' && (
                        <div className={styles.routeTab}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h2>Delivery Manifest</h2>
                                    <p className={styles.subtitle}>Optimized multi-stop route for today's deliveries</p>
                                </div>
                                <div className={styles.routeStats}>
                                    <div className={styles.infoBadge}>
                                        <MapPin size={14} />
                                        <span>{routePlan?.total_stops || 0} Stops</span>
                                    </div>
                                </div>
                            </div>

                            {routePlan?.clusters ? (
                                <div className={styles.manifestContainer}>
                                    {Object.entries(routePlan.clusters).map(([pincode, stops]) => (
                                        <div key={pincode} className={styles.pincodeCluster}>
                                            <div className={styles.clusterHeader}>
                                                <Map size={18} />
                                                <h3>Neighborhood: {pincode}</h3>
                                                <span className={styles.stopCount}>{stops.length} stops</span>
                                            </div>
                                            <div className={styles.stopList}>
                                                {stops.map((stop) => (
                                                    <div key={stop.order_id} className={styles.stopCard}>
                                                        <div className={styles.stopSequence}>{stop.sequence}</div>
                                                        <div className={styles.stopDetails}>
                                                            <div className={styles.stopName}>{stop.shop_name}</div>
                                                            <div className={styles.stopAddress}>{stop.address}</div>
                                                            <div className={styles.stopMeta}>
                                                                <span className={styles.orderLabel}>Order #{stop.order_number}</span>
                                                                <span className={styles.etaLabel}>ETA: {new Date(stop.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            className={styles.secondaryBtn}
                                                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                                            onClick={() => alert(`Starting Navigation to ${stop.shop_name}`)}
                                                        >
                                                            <MapPin size={14} style={{ marginRight: '4px' }} />
                                                            Navigate
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <Truck size={48} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                                    <p>No stops assigned for today. Move orders to "Shipped" to see them here.</p>
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
                                <div>
                                    <h2>Return Claims</h2>
                                    <p className={styles.subtitle}>Process damaged goods and refund requests</p>
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
                                        <span>{returns.filter(r => r.status === 'pending').length} Actions Required</span>
                                    </div>
                                </div>
                            </div>

                            
                            {returns && returns.length > 0 ? (
                                <div className={styles.returnsList}>
                                    {returns.map(ret => (
                                        <div key={ret.id} className={`${styles.returnCard} premium-card`}>
                                            <div className={styles.returnCardHeader}>
                                                <div className={styles.returnShopkeeper}>
                                                    <Users size={16} />
                                                    <strong>{ret.shopkeeper_name}</strong>
                                                </div>
                                                <div className={styles.returnMeta}>
                                                    <span className={styles.refLabel}>Order: <strong>#{ret.order_number?.substring(0, 8)}</strong></span>
                                                    <span className={`${styles.statusBadge} ${styles['status_' + ret.status?.toLowerCase()]}`}>
                                                        {ret.status === 'pending' && <Clock size={12} />}
                                                        {ret.status === 'approved' && <CheckCircle size={12} />}
                                                        {ret.status === 'rejected' && <XCircle size={12} />}
                                                        {ret.status}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className={styles.returnCardBody}>
                                                <div className={styles.returnItemInfo}>
                                                    <h3>{ret.product_name}</h3>
                                                    <p>Requested Qty: <strong>{ret.quantity} Units</strong></p>
                                                    <div className={styles.returnReasonBox}>
                                                        <span className={styles.label}>Claim Reason:</span>
                                                        <p>{ret.reason}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.returnActions}>
                                                    {ret.status === 'pending' ? (
                                                        <>
                                                            <button 
                                                                className={styles.primaryBtn}
                                                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                                                                onClick={() => handleApproveReturn(ret.id)}
                                                            >
                                                                <CheckCircle size={16} />
                                                                <span>Approve & Credit</span>
                                                            </button>
                                                            <button 
                                                                className={styles.secondaryBtn}
                                                                style={{ color: '#ef4444', borderColor: '#fecdd3' }}
                                                                onClick={() => handleRejectReturn(ret.id)}
                                                            >
                                                                <XCircle size={16} />
                                                                <span>Reject Claim</span>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className={styles.processedBadge}>
                                                            <FileText size={16} />
                                                            <span>Request Processed</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {ret.dealer_notes && (
                                                <div className={styles.dealerFeedback}>
                                                    <strong>Your Notes:</strong>
                                                    <p>{ret.dealer_notes}</p>
                                                </div>
                                            )}
                                            
                                            <div className={styles.returnCardFooter}>
                                                <span className={styles.returnDate}>Request Date: {new Date(ret.created_at).toLocaleDateString()}</span>
                                                <div className={styles.creditAmount}>
                                                    Value: <strong>₹{(ret.quantity * 100).toLocaleString()}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>✨</div>
                                    <h3>Zero Claims!</h3>
                                    <p>Your shopkeepers haven&apos;t raised any return requests. Your supply chain is holding up great!</p>
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

                            {!isStaff && (
                                <div className={styles.staffSection} style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '30px', paddingBottom: '20px' }}>
                                    <div className={styles.sectionHeader} style={{ marginBottom: '20px' }}>
                                        <h3>👥 Staff Management</h3>
                                        <button 
                                            className={styles.secondaryBtn}
                                            onClick={() => setShowStaffForm(!showStaffForm)}
                                        >
                                            {showStaffForm ? 'Close' : '+ Add Staff Member'}
                                        </button>
                                    </div>

                                    {showStaffForm && (
                                        <form className={styles.staffForm} style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' }} onSubmit={async (e) => {
                                            e.preventDefault();
                                            try {
                                                const res = await dealersAPI.addStaff(staffFormData);
                                                setStaff(prev => [...prev, res.data]);
                                                setStaffFormData({ 
                                                    username: '', 
                                                    email: '', 
                                                    role: 'Delivery Manager',
                                                    can_manage_orders: true,
                                                    can_manage_inventory: false,
                                                    can_view_analytics: false
                                                });
                                                setShowStaffForm(false);
                                                addToast('Staff member added!', 'success');
                                            } catch (err) {
                                                setError(err.response?.data?.error || 'Failed to add staff');
                                            }
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                                                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Username</label>
                                                    <input 
                                                        placeholder="e.g. rahul_staff"
                                                        value={staffFormData.username}
                                                        onChange={e => setStaffFormData({...staffFormData, username: e.target.value})}
                                                        required
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                                    />
                                                </div>
                                                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Email</label>
                                                    <input 
                                                        placeholder="staff@email.com"
                                                        type="email"
                                                        value={staffFormData.email}
                                                        onChange={e => setStaffFormData({...staffFormData, email: e.target.value})}
                                                        required
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                                    />
                                                </div>
                                                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Operational Role</label>
                                                    <select 
                                                        value={staffFormData.role}
                                                        onChange={e => setStaffFormData({...staffFormData, role: e.target.value})}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                                                    >
                                                        <option>Delivery Manager</option>
                                                        <option>Inventory Clerk</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '20px', marginTop: '15px', background: 'white', padding: '15px', borderRadius: '10px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={staffFormData.can_manage_orders} 
                                                        onChange={e => setStaffFormData({...staffFormData, can_manage_orders: e.target.checked})}
                                                    /> Orders
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={staffFormData.can_manage_inventory} 
                                                        onChange={e => setStaffFormData({...staffFormData, can_manage_inventory: e.target.checked})}
                                                    /> Inventory
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={staffFormData.can_view_analytics} 
                                                        onChange={e => setStaffFormData({...staffFormData, can_view_analytics: e.target.checked})}
                                                    /> Analytics
                                                </label>
                                            </div>
                                            
                                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                                <button type="submit" className={styles.primaryBtn} style={{ padding: '11px 30px' }}>Onboard Staff Member</button>
                                            </div>
                                        </form>
                                    )}

                                    <div className={styles.staffList} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                        {staff.length === 0 ? (
                                            <p style={{ color: '#64748b', fontStyle: 'italic', gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
                                                No operational staff added yet. Delegate tasks to scale faster.
                                            </p>
                                        ) : (
                                            staff.map((member, idx) => (
                                                <div key={member.id || idx} style={{ display: 'flex', alignItems: 'center', padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px' }}>
                                                        {member.username?.[0]?.toUpperCase() || 'S'}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{member.username}</div>
                                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{member.role}</div>
                                                    </div>
                                                    <div style={{ fontSize: '10px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
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
            {showEditProduct && (
                <div className={styles.modalOverlay}>
                    <div className={styles.formCard} style={{ width: '500px' }}>
                        <h3>Edit Product</h3>
                        <form onSubmit={handleEditProductSubmit}>
                            <div className={styles.formGroup}>
                                <label>Product Name</label>
                                <input
                                    type="text"
                                    value={editProductData.name}
                                    onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={editProductData.description}
                                    onChange={(e) => setEditProductData({ ...editProductData, description: e.target.value })}
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Price (₹)</label>
                                    <input
                                        type="number"
                                        value={editProductData.price}
                                        onChange={(e) => setEditProductData({ ...editProductData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Stock</label>
                                    <input
                                        type="number"
                                        value={editProductData.stock_quantity}
                                        onChange={(e) => setEditProductData({ ...editProductData, stock_quantity: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" className={styles.primaryBtn} style={{ flex: 1 }}>Save Changes</button>
                                <button type="button" className={styles.secondaryBtn} onClick={() => setShowEditProduct(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showAuditModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ width: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className={styles.modalHeader}>
                            <h3>📦 Stock Audit Log: {activeAuditProduct?.name}</h3>
                            <button onClick={() => setShowAuditModal(false)} className={styles.closeBtn}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.auditStats} style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div className={styles.miniStat}>
                                    <label>Current Stock</label>
                                    <p>{activeAuditProduct?.stock_quantity}</p>
                                </div>
                                <div className={styles.miniStat}>
                                    <label>Total Logs</label>
                                    <p>{activeAuditLogs.length}</p>
                                </div>
                            </div>
                            <table className={styles.auditTable}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Modified By</th>
                                        <th>Change</th>
                                        <th>Status</th>
                                        <th>Reason/Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeAuditLogs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                {new Date(log.date).toLocaleString()}
                                            </td>
                                            <td style={{ fontWeight: '600' }}>{log.user}</td>
                                            <td style={{ color: log.change > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                                {log.change > 0 ? `+${log.change}` : log.change}
                                            </td>
                                            <td><strong>{log.new_stock}</strong></td>
                                            <td>
                                                <span className={styles.reasonBadge} style={{ textTransform: 'capitalize' }}>{log.reason}</span>
                                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>{log.notes || '-'}</p>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeAuditLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No audit history found for this product.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
