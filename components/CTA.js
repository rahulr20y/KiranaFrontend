import Link from 'next/link'
import styles from '../styles/landing.module.css'
import { useAuth } from '../lib/authContext'

export default function CTA() {
    const { isAuthenticated } = useAuth();
    
    return (
        <section className={styles.cta}>
            <div className={styles.container}>
                <h2 className={styles.ctaTitle}>Ready to Transform Your Business?</h2>
                <p className={styles.ctaSubtitle}>
                    Join thousands of shopkeepers and dealers already using Kirana
                </p>
                <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
                    <button className={styles.ctaBtn}>
                        {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial Today'}
                    </button>
                </Link>
            </div>
        </section>
    )
}
