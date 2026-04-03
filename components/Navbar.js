import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/authContext'
import { useCart } from '../lib/cartContext'
import { LogOut, LayoutDashboard, ShoppingCart, Package, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'next-i18next/pages'
import styles from '../styles/navbar.module.css'

export default function Navbar() {
    const router = useRouter()
    const { user, isAuthenticated, logout } = useAuth()
    const { cartCount } = useCart()
    const { t, i18n } = useTranslation('common')

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    const toggleLanguage = () => {
        const nextLocale = i18n.language === 'en' ? 'hi' : 'en'
        const { pathname, asPath, query } = router
        router.push({ pathname, query }, asPath, { locale: nextLocale })
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
                        <Link 
                            href={isAuthenticated ? "/dashboard" : "/"} 
                            className={styles.logo}
                        >
                            <Package className={styles.logoIcon} />
                            <span>Kirana</span>
                        </Link>
                    </motion.div>

                    <ul className={styles.navLinks}>
                        {isAuthenticated ? (
                            <>
                                <li>
                                    <Link 
                                        href="/dashboard" 
                                        className={router.pathname === '/dashboard' ? styles.active : ''}
                                    >
                                        {t('dashboard.title')}
                                    </Link>
                                </li>
                                {user?.user_type === 'shopkeeper' && (
                                    <>
                                        <li>
                                            <Link 
                                                href="/products" 
                                                className={router.pathname === '/products' ? styles.active : ''}
                                            >
                                                {t('dashboard.products')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/cart" className={styles.cartLink}>
                                                <div className={styles.cartIconWrapper}>
                                                    <ShoppingCart size={20} />
                                                    {cartCount > 0 && (
                                                        <span className={styles.cartBadge}>{cartCount}</span>
                                                    )}
                                                </div>
                                                <span>{t('dashboard.cart')}</span>
                                            </Link>
                                        </li>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <li><Link href="/#features">{t('navbar.features')}</Link></li>
                                <li><Link href="/#roles">{t('navbar.partners')}</Link></li>
                            </>
                        )}
                    </ul>

                    <div className={styles.authActions}>
                        <button className={styles.langToggle} onClick={toggleLanguage} title={t('navbar.change_language')}>
                            <Globe size={18} />
                            <span>{i18n.language === 'en' ? 'हिन्दी' : 'EN'}</span>
                        </button>
                        <div className={styles.divider} />
                        {isAuthenticated ? (
                            <div className={styles.userSection}>
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{user?.first_name || user?.username}</span>
                                    <span className={styles.userBadge}>{user?.user_type}</span>
                                </div>
                                <div className={styles.divider} />
                                <button className={styles.logoutBtn} onClick={handleLogout} title={t('auth.logout')}>
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className={styles.guestActions}>
                                <Link href="/login" className={styles.loginBtn}>{t('auth.login')}</Link>
                                <Link href="/signup" className={styles.signupBtn}>{t('auth.signup')}</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
