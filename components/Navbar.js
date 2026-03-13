import Link from 'next/link'
import styles from '../styles/landing.module.css'

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <div className={styles.navContent}>
                    <div className={styles.logo}>🛍️ Kirana</div>

                    <ul className={styles.navLinks}>
                        <li><a href="#features">Features</a></li>
                        <li><a href="#roles">For Dealers & Shopkeepers</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>

                    <div className={styles.authButtons}>
                        <button className={styles.loginBtn}>Login</button>
                        <button className={styles.signupBtn}>Sign Up</button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
