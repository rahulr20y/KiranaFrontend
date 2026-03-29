import Head from 'next/head'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import UserRoles from '../components/UserRoles'
import CTA from '../components/CTA'
import Footer from '../components/Footer'

export default function Home() {
    return (
        <>
            <Head>
                <title>Kirana - Connect Dealers with Shopkeepers</title>
                <meta name="description" content="Kirana - The platform connecting product dealers with small shopkeepers. Browse, order, and grow your business with ease." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta property="og:title" content="Kirana - Connect Dealers with Shopkeepers" />
                <meta property="og:description" content="Simplify your supply chain with Kirana. Direct connections between dealers and shopkeepers." />
                <meta property="og:type" content="website" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            "name": "Kirana",
                            "url": "https://kirana.ai",
                            "description": "The platform connecting product dealers with small shopkeepers.",
                            "applicationCategory": "BusinessApplication",
                            "operatingSystem": "All"
                        })
                    }}
                />
            </Head>

            <Navbar />
            <Hero />
            <Features />
            <UserRoles />
            <CTA />
            <Footer />
        </>
    )
}
