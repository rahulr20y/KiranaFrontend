import Link from 'next/link'
import Image from 'next/image'
import styles from '../styles/landing.module.css'
import { useAuth } from '../lib/authContext'

export default function Hero() {
    const { isAuthenticated } = useAuth();
    
    return (
        <section className={`${styles.hero} animate-fade-in-up`}>
            <div className={styles.container}>
                <div className={styles.heroWrapper}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            Connect <span className={styles.highlight}>Directly</span> with Your Suppliers
                        </h1>

                        <p className={styles.heroSubtitle}>
                            Kirana simplifies the supply chain between product dealers and small shopkeepers.
                            Find the right suppliers, manage orders, and grow your business seamlessly.
                        </p>

                        <div className={styles.heroBenefits}>
                            <div className={styles.heroBenefit}>
                                <span className={styles.checkmark}>✓</span>
                                <span>Direct & Verified Dealer Network</span>
                            </div>
                            <div className={styles.heroBenefit}>
                                <span className={styles.checkmark}>✓</span>
                                <span>Competitive Bulk Pricing Models</span>
                            </div>
                            <div className={styles.heroBenefit}>
                                <span className={styles.checkmark}>✓</span>
                                <span>Real-time Inventory & Order Sync</span>
                            </div>
                        </div>

                        <div className={styles.ctaButtons}>
                            <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
                                <button className="btn-premium btn-primary">
                                    {isAuthenticated ? 'Go to Dashboard' : 'Get Started Now'}
                                </button>
                            </Link>
                            <a href="#features">
                                <button className="btn-premium btn-secondary">Learn More</button>
                            </a>
                        </div>
                    </div>

                    <div className={styles.heroImageWrapper}>
                        <div className={styles.imageBackgroundGlow}></div>
                        <Image 
                            src="/images/hero_illustration.png" 
                            alt="Kirana Supply Chain Illustration" 
                            width={600} 
                            height={600} 
                            className={styles.heroImage}
                            priority
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

