import Link from 'next/link'
import styles from '../styles/landing.module.css'

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.footerContent}>
                    <div>
                        <h3>About Kirana</h3>
                        <p>Connecting product dealers with small shopkeepers to build a stronger supply chain.</p>
                    </div>

                    <div>
                        <h3>Quick Links</h3>
                        <ul className={styles.footerLinks}>
                            <li><a href="#features">Features</a></li>
                            <li><a href="#roles">For Dealers & Shopkeepers</a></li>
                            <li><a href="#features">Pricing</a></li>
                            <li><Link href="/">Blog</Link></li>
                        </ul>
                    </div>

                    <div id="contact">
                        <h3>Support</h3>
                        <ul className={styles.footerLinks}>
                            <li><Link href="/">Help Center</Link></li>
                            <li><a href="mailto:support@kirana.example.com">Contact Us</a></li>
                            <li><Link href="/">Documentation</Link></li>
                            <li><Link href="/">Status</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3>Legal</h3>
                        <ul className={styles.footerLinks}>
                            <li><Link href="/">Privacy Policy</Link></li>
                            <li><Link href="/">Terms of Service</Link></li>
                            <li><Link href="/">Cookie Policy</Link></li>
                            <li><Link href="/">Security</Link></li>
                        </ul>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p>&copy; 2026 Kirana. All rights reserved. | Made with ❤️ for small businesses</p>
                </div>
            </div>
        </footer>
    )
}
