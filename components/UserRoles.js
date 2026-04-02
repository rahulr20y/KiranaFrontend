import styles from '../styles/landing.module.css'
import Link from 'next/link'

export default function UserRoles() {
    return (
        <section id="roles" className={styles.roles}>
            <div className={styles.container}>
                <h2 className={styles.sectionTitle}>Choose Your Path</h2>
                <div className={styles.rolesGrid}>
                    <div className={`${styles.roleCard} glass-panel`}>
                        <div className={styles.roleEmoji}>🏪</div>
                        <h3 className={styles.roleTitle}>For Shopkeepers</h3>
                        <p className={styles.roleDescription}>
                            Modernize your inventory procurement and get the best prices from multiple dealers.
                        </p>
                        <ul className={styles.roleBenefits}>
                            <li className={styles.roleBenefit}>✓ Unified Order Management</li>
                            <li className={styles.roleBenefit}>✓ Discover New Local Suppliers</li>
                            <li className={styles.roleBenefit}>✓ Automated Restock Reminders</li>
                        </ul>
                    </div>

                    <div className={`${styles.roleCard} glass-panel`}>
                        <div className={styles.roleEmoji}>🏢</div>
                        <h3 className={styles.roleTitle}>For Dealers</h3>
                        <p className={styles.roleDescription}>
                            Expand your reach and manage your wholesale distribution with ease.
                        </p>
                        <ul className={styles.roleBenefits}>
                            <li className={styles.roleBenefit}>✓ Digital Product Showcase</li>
                            <li className={styles.roleBenefit}>✓ Advanced Buyer Analytics</li>
                            <li className={styles.roleBenefit}>✓ Broadcast Offers to Thousands</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}
