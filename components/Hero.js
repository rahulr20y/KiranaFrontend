import styles from '../styles/landing.module.css'

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.container}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        Connect <span className={styles.highlight}>Directly</span> with Your Suppliers
                    </h1>

                    <p className={styles.heroSubtitle}>
                        Kirana simplifies the supply chain between product dealers and small shopkeepers.
                        Find the right suppliers, manage orders, and grow your business seamlessly.
                    </p>

                    <div className={styles.heroBenefit}>
                        <span className={styles.checkmark}>✓</span>
                        <span>Direct connection with verified dealers and wholesalers</span>
                    </div>
                    <div className={styles.heroBenefit}>
                        <span className={styles.checkmark}>✓</span>
                        <span>Competitive pricing and flexible payment terms</span>
                    </div>
                    <div className={styles.heroBenefit}>
                        <span className={styles.checkmark}>✓</span>
                        <span>Real-time order tracking and inventory management</span>
                    </div>

                    <div className={styles.ctaButtons}>
                        <button className={styles.primaryBtn}>Get Started Now</button>
                        <button className={styles.secondaryBtn}>Learn More</button>
                    </div>
                </div>
            </div>
        </section>
    )
}
