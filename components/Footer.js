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
                            <li><a href="#">Pricing</a></li>
                            <li><a href="#">Blog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3>Support</h3>
                        <ul className={styles.footerLinks}>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">Documentation</a></li>
                            <li><a href="#">Status</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3>Legal</h3>
                        <ul className={styles.footerLinks}>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Cookie Policy</a></li>
                            <li><a href="#">Security</a></li>
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
