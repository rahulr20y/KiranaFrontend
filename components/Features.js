import styles from '../styles/landing.module.css'

const features = [
    {
        title: "Direct Connect",
        description: "Bypass middlemen and connect directly with verified regional distributors and national brands.",
        icon: "🔌"
    },
    {
        title: "Tiered Pricing",
        description: "Unlock better margins with volume-based discounts and bulk ordering capabilities.",
        icon: "📈"
    },
    {
        title: "Real-time Tracking",
        description: "Monitor your supply shipments from the moment they leave the dealer until they arrive at your shop.",
        icon: "🚚"
    },
    {
        title: "Digital Ledger",
        description: "Keep track of all your transactions, invoices, and payments in one secure, digital environment.",
        icon: "💼"
    }
]

export default function Features() {
    return (
        <section id="features" className={styles.features}>
            <div className={styles.container}>
                <h2 className={styles.sectionTitle}>Built for Scale</h2>
                <p className={styles.sectionSubtitle}>
                    Empowering local businesses with enterprise-grade supply chain tools.
                </p>

                <div className={styles.featuresGrid}>
                    {features.map((feature, index) => (
                        <div key={index} className={`${styles.featureCard} premium-card`}>
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
