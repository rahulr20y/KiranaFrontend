import '../styles/global.css'
import { AuthProvider } from '../lib/authContext'
import { NotificationProvider } from '../lib/notificationContext'
import Head from 'next/head'
import { useEffect } from 'react'

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                        console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                        console.log('Service Worker registration failed: ', err);
                    }
                );
            });
        }
    }, []);

    return (
        <AuthProvider>
            <NotificationProvider>
                <Head>
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                    <link rel="manifest" href="/manifest.json" />
                    <meta name="theme-color" content="#1e40af" />
                    <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                    <title>Kirana - Smart Dealer Network</title>
                </Head>
                <Component {...pageProps} />
            </NotificationProvider>
        </AuthProvider>
    )
}

export default MyApp
