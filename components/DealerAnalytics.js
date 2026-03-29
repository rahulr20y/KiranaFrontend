import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import styles from '../styles/dashboard.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DealerAnalytics({ stats }) {
  const salesTrendData = useMemo(() => {
    if (!stats || !stats.sales_trends) return null;
    
    return {
      labels: stats.sales_trends.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Daily Revenue (₹)',
          data: stats.sales_trends.map(item => item.total),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [stats]);

  const topProductsData = useMemo(() => {
    if (!stats || !stats.top_products) return null;
    
    return {
      labels: stats.top_products.map(item => item.product__name),
      datasets: [
        {
          label: 'Revenue by Product',
          data: stats.top_products.map(item => item.total_revenue),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
        },
      ],
    };
  }, [stats]);

  const inventoryHealthData = useMemo(() => {
    if (!stats || !stats.inventory_health) return null;
    const { total_items, low_stock_items, out_of_stock } = stats.inventory_health;
    const healthy = Math.max(0, total_items - low_stock_items);

    return {
      labels: ['Healthy', 'Low Stock', 'Out of Stock'],
      datasets: [
        {
          data: [healthy, low_stock_items - out_of_stock, out_of_stock],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
        },
      ],
    };
  }, [stats]);

  if (!stats) return <p>Loading analytics...</p>;

  return (
    <div className={styles.analyticsTab}>
      <div className={styles.sectionHeader}>
        <h2>Business Insights</h2>
      </div>

      <div className={styles.analyticsGrid}>
        {/* Sales Trend */}
        <div className={styles.analyticsCard}>
          <h3>Revenue Trend (Last 30 Days)</h3>
          <div className={styles.chartWrapper}>
            {salesTrendData ? <Line data={salesTrendData} options={{ maintainAspectRatio: false }} /> : <p>No data available</p>}
          </div>
        </div>

        {/* Top Products */}
        <div className={styles.analyticsCard}>
          <h3>Top Selling Products</h3>
          <div className={styles.chartWrapper}>
            {topProductsData ? <Bar data={topProductsData} options={{ 
              indexAxis: 'y',
              maintainAspectRatio: false,
              plugins: { legend: { display: false } }
            }} /> : <p>No data available</p>}
          </div>
        </div>

        {/* Inventory Summary */}
        <div className={styles.analyticsCard}>
          <h3>Inventory Health</h3>
          <div className={styles.chartWrapper} style={{ maxHeight: '250px' }}>
            {inventoryHealthData ? <Doughnut data={inventoryHealthData} options={{ maintainAspectRatio: false }} /> : <p>No data available</p>}
          </div>
        </div>

        {/* Quick Stats */}
        <div className={styles.analyticsCard}>
          <h3>Quick Performance</h3>
          <div className={styles.miniStatsContainer}>
            <div className={styles.miniStat}>
              <span>Avg. Order Value</span>
              <strong>₹{stats.total_orders > 0 ? (stats.total_amount / stats.total_orders).toFixed(2) : '0'}</strong>
            </div>
            <div className={styles.miniStat}>
              <span>Cancelled Rate</span>
              <strong style={{ color: '#ef4444' }}>{stats.total_orders > 0 ? ((stats.cancelled / stats.total_orders) * 100).toFixed(1) : '0'}%</strong>
            </div>
            <div className={styles.miniStat}>
              <span>Out of Stock Items</span>
              <strong style={{ color: stats.inventory_health?.out_of_stock > 0 ? '#ef4444' : '#10b981' }}>{stats.inventory_health?.out_of_stock || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
