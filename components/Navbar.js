import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/authContext'
import { useCart } from '../lib/cartContext'
import { LogOut, LayoutDashboard, ShoppingCart, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import styles from '../styles/navbar.module.css'

export default function Navbar() {
    const router = useRouter()
    const { user, isAuthenticated, logout } = useAuth()
    const { cartCount } = useCart()

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <div className={styles.navContent}>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link href="/" className={styles.logo}>
                            <Package className={styles.logoIcon} />
                            <span>Kirana</span>
                        </Link>
                    </motion.div>

                    <ul className={styles.navLinks}>
                        {isAuthenticated ? (
                            <>
                                <li><Link href="/products" className={router.pathname === '/products' ? styles.active : ''}>Products</Link></li>
                                <li><Link href="/dashboard" className={router.pathname === '/dashboard' ? styles.active : ''}>Dashboard</Link></li>
                                {user?.user_type === 'shopkeeper' && (
                                    <li>
                                        <Link href="/cart" className={styles.cartLink}>
                                            <div className={styles.cartIconWrapper}>
                                                <ShoppingCart size={20} />
                                                {cartCount > 0 && (
                                                    <span className={styles.cartBadge}>{cartCount}</span>
                                                )}
                                            </div>
                                            <span>Cart</span>
                                        </Link>
                                    </li>
                                )}
                            </>
                        ) : (
                            <>
                                <li><a href="#features">Features</a></li>
                                <li><a href="#roles">For Partners</a></li>
                            </>
                        )}
                    </ul>

                    <div className={styles.authActions}>
                        {isAuthenticated ? (
                            <div className={styles.userSection}>
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{user?.first_name || user?.username}</span>
                                    <span className={styles.userBadge}>{user?.user_type}</span>
                                </div>
                                <div className={styles.divider} />
                                <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className={styles.guestActions}>
                                <Link href="/login" className={styles.loginBtn}>Login</Link>
                                <Link href="/signup" className={styles.signupBtn}>Get Started</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
