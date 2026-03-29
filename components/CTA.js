import Link from 'next/link'
import styles from '../styles/landing.module.css'

export default function CTA() {
    return (
        <section className={styles.cta}>
            <div className={styles.container}>
                <h2 className={styles.ctaTitle}>Ready to Transform Your Business?</h2>
                <p className={styles.ctaSubtitle}>
                    Join thousands of shopkeepers and dealers already using Kirana
                </p>
                <Link href="/signup">
                    <button className={styles.ctaBtn}>Start Free Trial Today</button>
                </Link>
            </div>
        </section>
    )
}
