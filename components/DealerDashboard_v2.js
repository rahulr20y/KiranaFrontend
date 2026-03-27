import { useState, useEffect } from 'react';
import { productsAPI, dealersAPI } from '../lib/api';
import styles from '../styles/dashboard.module.css';

export default function DealerDashboard_v2() {
    const [products, setProducts] = useState([]);
    const [dealerProfile, setDealerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('products');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileFormData, setProfileFormData] = useState({
        business_name: '',
        business_category: '',
        gst_number: '',
    });
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, profileRes] = await Promise.all([
                productsAPI.myProducts(),
                dealersAPI.myProfile(),
            ]);
            setProducts(productsRes.data.results || productsRes.data || []);
            setDealerProfile(profileRes.data);
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
            // Remove empty optional fields to satisfy backend validation
            if (!submissionData.category) {
                delete submissionData.category;
            }
            await productsAPI.createProduct(submissionData);
            setFormData({
                name: '',
                description: '',
                price: '',
                stock_quantity: '',
                category: '',
            });
            setShowAddProduct(false);
            fetchData();
        } catch (err) {
            setError('Failed to add product');
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.dashboardHeader}>
                <h1>Dealer Dashboard</h1>
                <p>Welcome, {dealerProfile?.business_name || 'Dealer'}</p>
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}

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
                        📦 My Products
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        👤 Profile
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        📋 Orders
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'products' && (
                        <div className={styles.productsTab}>
                            <div className={styles.sectionHeader}>
                                <h2>My Products</h2>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={() => setShowAddProduct(!showAddProduct)}
                                >
                                    {showAddProduct ? 'Cancel' : '+ Add Product'}
                                </button>
                            </div>

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
                                                <tr key={product.id}>
                                                    <td>{product.name}</td>
                                                    <td>₹{product.price}</td>
                                                    <td>{product.stock_quantity}</td>
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
                                        const res = await dealersAPI.updateProfile(profileFormData);
                                        setDealerProfile(res.data);
                                        setIsEditingProfile(false);
                                        alert('Profile updated successfully!');
                                    } catch (err) {
                                        alert('Failed to update profile');
                                    }
                                }}>
                                    <div className={styles.formGroup}>
                                        <label>Business Name</label>
                                        <input 
                                            type="text" 
                                            value={profileFormData.business_name}
                                            onChange={(e) => setProfileFormData({...profileFormData, business_name: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Business Category</label>
                                        <input 
                                            type="text" 
                                            value={profileFormData.business_category}
                                            onChange={(e) => setProfileFormData({...profileFormData, business_category: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>GST Number</label>
                                        <input 
                                            type="text" 
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

                    {activeTab === 'orders' && (
                        <div className={styles.ordersTab}>
                            <h2>Recent Orders</h2>
                            <div className={styles.emptyMessage}>
                                No orders yet. Start selling to see orders here!
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
