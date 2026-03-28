import styles from '../styles/landing.module.css'

const roles = [
    {
        emoji: '🏪',
        role: 'Small Shopkeeper',
        title: 'Grow Your Store',
        description: 'Access a wide network of dealers and wholesalers to stock your shop with quality products at competitive prices.',
        benefits: [
            '✓ Find multiple suppliers for each product category',
            '✓ Compare prices and quality instantly',
            '✓ Manage multiple orders from one dashboard',
            '✓ Flexible payment terms for regular buyers'
        ]
    },
    {
        emoji: '🏭',
        role: 'Product Dealer / Wholesaler',
        title: 'Expand Your Market',
        description: 'Connect directly with shopkeepers and retailers to scale your business without intermediaries.',
        benefits: [
            '✓ Reach hundreds of verified shopkeepers',
            '✓ Manage inventory and stock levels easily',
            '✓ Automated order processing and invoicing',
            '✓ Build long-term business relationships'
        ]
    }
]

export default function UserRoles() {
    return (
        <section id="roles" className={styles.roles}>
            <div className={styles.container}>
                <h2 className={styles.sectionTitle}>For Everyone</h2>
                <p className={styles.sectionSubtitle}>
                    Whether you&apos;re a shopkeeper or dealer, Kirana has a solution for you
                </p>

                <div className={styles.rolesGrid}>
                    {roles.map((item, index) => (
                        <div key={index} className={styles.roleCard}>
                            <div className={styles.roleEmoji}>{item.emoji}</div>
                            <div style={{ fontSize: '0.85rem', color: '#667eea', fontWeight: 600, marginBottom: '0.5rem' }}>
                                {item.role}
                            </div>
                            <h3 className={styles.roleTitle}>{item.title}</h3>
                            <p className={styles.roleDescription}>{item.description}</p>
                            <div className={styles.roleBenefits}>
                                {item.benefits.map((benefit, idx) => (
                                    <div key={idx} className={styles.roleBenefit}>{benefit}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
