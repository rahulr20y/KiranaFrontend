import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';
import { productsAPI, categoriesAPI, ordersAPI } from '../lib/api';
import Navbar from '../components/Navbar';
import styles from '../styles/products.module.css';

export default function Products() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [orderSuccess, setOrderSuccess] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchData();
    }, [isAuthenticated, searchTerm, selectedCategory]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.category = selectedCategory;

            const [productsRes, categoriesRes] = await Promise.all([
                productsAPI.listProducts(params),
                categoriesAPI.listCategories(),
            ]);

            setProducts(productsRes.data.results || []);
            setCategories(categoriesRes.data.results || []);
            setError('');
        } catch (err) {
            setError('Failed to load products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    const handleSort = (e) => {
        setSortBy(e.target.value);
        // Sort products locally
        let sorted = [...products];
        if (e.target.value === 'price-asc') {
            sorted.sort((a, b) => a.price - b.price);
        } else if (e.target.value === 'price-desc') {
            sorted.sort((a, b) => b.price - a.price);
        } else if (e.target.value === 'name') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        }
        setProducts(sorted);
    };

    const handleOrder = async (productId) => {
        setOrderLoading(true);
        setOrderError('');
        setOrderSuccess('');
        try {
            // Get the product object to find dealer_id
            const product = products.find(p => p.id === productId);
            
            const orderData = {
                items: [{ 
                    product: productId, 
                    quantity: 1,
                    product_name: product?.name,
                    product_price: product?.price,
                    unit: product?.unit || 'kg',
                    subtotal: product?.price
                }],
                dealer_id: product?.dealer,
                shipping_address: user?.address || 'Main Street, City',
                notes: 'Automated order'
            };
            
            await ordersAPI.createOrder(orderData);
            setOrderSuccess('Order placed successfully!');
            fetchData(); // Refresh to show updated stock
        } catch (err) {
            setOrderError('Failed to place order.');
        } finally {
            setOrderLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <Navbar />

            <div className={styles.container}>
                <h1 className={styles.pageTitle}>Browse Products</h1>

                {error && <div className={styles.errorAlert}>{error}</div>}
                {orderError && <div className={styles.errorAlert}>{orderError}</div>}
                {orderSuccess && <div className={styles.successAlert}>{orderSuccess}</div>}

                <div className={styles.controlsSection}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filters}>
                        <select
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            className={styles.select}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.slug} value={cat.slug}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={handleSort}
                            className={styles.select}
                        >
                            <option value="name">Sort: Name</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading products...</div>
                ) : products.length === 0 ? (
                    <div className={styles.noProducts}>
                        <p>No products found</p>
                    </div>
                ) : (
                    <div className={styles.productsGrid}>
                        {products.map((product) => (
                            <div key={product.id} className={styles.productCard}>
                                {product.image && (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className={styles.productImage}
                                    />
                                )}
                                <div className={styles.productContent}>
                                    <h3 className={styles.productName}>{product.name}</h3>
                                    <p className={styles.productDescription}>
                                        {product.description?.substring(0, 100)}...
                                    </p>
                                    <div className={styles.productFooter}>
                                        <div className={styles.priceSection}>
                                            <span className={styles.price}>₹{product.price}</span>
                                            {(product.stock_quantity !== undefined && product.stock_quantity !== null) && (
                                                <span className={styles.stock}>
                                                    Stock: {product.stock_quantity}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            className={styles.addToCartBtn}
                                            onClick={() => handleOrder(product.id)}
                                            disabled={orderLoading}
                                        >
                                            {orderLoading ? 'Ordering...' : 'Order'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
