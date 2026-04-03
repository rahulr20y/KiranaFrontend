import '../styles/global.css'
import '../styles/modern-globals.css'
import { AuthProvider } from '../lib/authContext'
import { NotificationProvider } from '../lib/notificationContext'
import { CartProvider } from '../lib/cartContext'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { appWithTranslation } from 'next-i18next'

const queryClient = new QueryClient()

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
            <QueryClientProvider client={queryClient}>
                <CartProvider>
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
                </CartProvider>
            </QueryClientProvider>
        </AuthProvider>
    )
}

export default appWithTranslation(MyApp)
