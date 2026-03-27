import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/authContext'
import styles from '../styles/landing.module.css'

export default function Navbar() {
    const router = useRouter()
    const { user, isAuthenticated, logout } = useAuth()

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    const handleDashboard = () => {
        router.push('/dashboard')
    }

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <div className={styles.navContent}>
                    <Link href="/">
                        <div className={styles.logo}>🛍️ Kirana</div>
                    </Link>

                    <ul className={styles.navLinks}>
                        {isAuthenticated && (
                            <>
                                <li><Link href="/products">Products</Link></li>
                                <li><Link href="/dashboard">Orders</Link></li>
                            </>
                        )}
                        {!isAuthenticated && (
                            <>
                                <li><a href="#features">Features</a></li>
                                <li><a href="#roles">For Dealers & Shopkeepers</a></li>
                                <li><a href="#contact">Contact</a></li>
                            </>
                        )}
                    </ul>

                    <div className={styles.authButtons}>
                        {isAuthenticated ? (
                            <>
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{user?.first_name || user?.username} [v1.4]</span>
                                    <span className={styles.userType}>({user?.user_type})</span>
                                </div>
                                <button className={styles.dashboardBtn} onClick={handleDashboard}>
                                    Dashboard
                                </button>
                                <button className={styles.logoutBtn} onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <button className={styles.loginBtn}>Login</button>
                                </Link>
                                <Link href="/signup">
                                    <button className={styles.signupBtn}>Sign Up</button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
