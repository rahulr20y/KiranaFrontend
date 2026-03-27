import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';
import Navbar from '../components/Navbar';
import DealerDashboard_v3 from '../components/DealerDashboard_v3';
import ShopkeeperDashboard_v3 from '../components/ShopkeeperDashboard_v3';
import styles from '../styles/dashboard.module.css';

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
            {user?.user_type === 'dealer' ? (
                <DealerDashboard_v3 />
            ) : (
                <ShopkeeperDashboard_v3 />
            )}
        </div>
    );
}
