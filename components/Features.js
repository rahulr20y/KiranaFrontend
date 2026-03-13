import styles from '../styles/landing.module.css'

const features = [
    {
        icon: '🔍',
        title: 'Find Suppliers',
        description: 'Browse and discover verified dealers offering the products you need with transparent pricing.'
    },
    {
        icon: '📦',
        title: 'Easy Ordering',
        description: 'Place orders in minutes with flexible quantities. Bulk discounts available for regular orders.'
    },
    {
        icon: '💳',
        title: 'Secure Payments',
        description: 'Multiple payment options with encrypted transactions. Pay on delivery or with credit terms.'
    },
    {
        icon: '🚚',
        title: 'Fast Delivery',
        description: 'Track your orders in real-time. Same-day delivery available in select areas.'
    },
    {
        icon: '📊',
        title: 'Analytics Dashboard',
        description: 'Track your spending, order history, and get personalized recommendations.'
    },
    {
        icon: '🤝',
        title: '24/7 Support',
        description: 'Dedicated customer support to help you with orders, payments, and any issues.'
    }
]

export default function Features() {
    return (
        <section id="features" className={styles.features}>
            <div className={styles.container}>
                <h2 className={styles.sectionTitle}>Why Choose Kirana?</h2>
                <p className={styles.sectionSubtitle}>
                    We provide everything you need to streamline your business operations
                </p>

                <div className={styles.featuresGrid}>
                    {features.map((feature, index) => (
                        <div key={index} className={styles.featureCard}>
                            <div className={styles.featureIcon}>{feature.icon}</div>
                            <h3 className={styles.featureTitle}>{feature.title}</h3>
                            <p className={styles.featureDescription}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
