import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';
import Navbar from '../components/Navbar';
const DealerDashboard_v3 = dynamic(() => import('../components/DealerDashboard_v3'), { ssr: false });
const ShopkeeperDashboard_v3 = dynamic(() => import('../components/ShopkeeperDashboard_v3'), { ssr: false });
import styles from '../styles/dashboard.module.css';

import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import nextI18NextConfig from '../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
    try {
        const translations = await serverSideTranslations(locale, ['common'], nextI18NextConfig);
        return {
            props: {
                ...translations,
            },
        };
    } catch (error) {
        console.error("Error in getServerSideProps:", error);
        // Returning a 500 status code manually if preferred, or just let Next handle it
        throw error;
    }
}

export default function Dashboard() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    return (
        <div className={styles.page}>
            <Navbar />
            {(user?.user_type === 'dealer' || user?.user_type === 'dealer_staff' || user?.user_type === 'staff') ? (
                <DealerDashboard_v3 />
            ) : (
                <ShopkeeperDashboard_v3 />
            )}
        </div>
    );
}
