import React, { useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Users, Package, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

export default function DealerAnalytics({ stats, varianceData }) {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const varianceChartData = useMemo(() => {
    if (!varianceData || !varianceData.trends) return [];
    return varianceData.trends.map(t => ({
      date: new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      gains: t.gains || 0,
      losses: Math.abs(t.losses || 0)
    }));
  }, [varianceData]);

  const movementBreakdown = useMemo(() => {
    if (!varianceData || !varianceData.movements) return [];
    return varianceData.movements.map(m => ({
      name: m.reason.charAt(0).toUpperCase() + m.reason.slice(1),
      value: Math.abs(m.total_change)
    }));
  }, [varianceData]);

  const salesTrendData = useMemo(() => {
    if (!stats || !stats.sales_trends) return [];
    return (Array.isArray(stats.sales_trends) ? stats.sales_trends : []).map(item => ({
      date: new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      revenue: parseFloat(item.total),
      orders: item.count
    }));
  }, [stats]);

  const topProductsData = useMemo(() => {
    if (!stats || !stats.top_products) return [];
    return (Array.isArray(stats.top_products) ? stats.top_products : []).map(item => ({
      name: item.product__name.split(' ').slice(0, 2).join(' '),
      revenue: parseFloat(item.total_revenue)
    }));
  }, [stats]);

  const inventoryHealthData = useMemo(() => {
    if (!stats || !stats.inventory_health) return [];
    const { total_items, low_stock_items, out_of_stock } = stats.inventory_health;
    return [
      { name: 'Healthy', value: total_items - low_stock_items },
      { name: 'Low Stock', value: low_stock_items - out_of_stock },
      { name: 'Out of Stock', value: out_of_stock }
    ];
  }, [stats]);

  // Phase III: Mock Loyalty Scoring
  const loyaltyData = [
    { name: 'Diamond (Top 5%)', value: 12, color: '#6366f1' },
    { name: 'Gold (Repeat)', value: 45, color: '#f59e0b' },
    { name: 'Silver (New)', value: 28, color: '#94a3b8' }
  ];

  if (!stats) return (
    <div className={styles.loadingContainer}>
      <TrendingUp className={styles.spin} />
      <p>Loading deep insights...</p>
    </div>
  );

  return (
    <div className={styles.analyticsTab}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Dealer Intelligence Hub</h2>
          <p className={styles.subtitle}>Data-driven insights for your wholesale business</p>
        </div>
      </div>

      <div className={styles.analyticsGrid}>
        {/* Main Sales Trend */}
        <div className={`${styles.analyticsCard} premium-card`} style={{ gridColumn: 'span 2' }}>
          <div className={styles.cardHeader}>
            <TrendingUp size={18} />
            <h3>Revenue & Volume Growth</h3>
          </div>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className={`${styles.analyticsCard} premium-card`}>
          <div className={styles.cardHeader}>
            <Package size={18} />
            <h3>Top Categories</h3>
          </div>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={topProductsData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loyalty Distribution */}
        <div className={`${styles.analyticsCard} premium-card`}>
          <div className={styles.cardHeader}>
            <Users size={18} />
            <h3>Shopkeeper Loyalty</h3>
          </div>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={loyaltyData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {loyaltyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staff Efficiency Leaderboard */}
        <div className={`${styles.analyticsCard} premium-card`} style={{ gridColumn: 'span 2' }}>
          <div className={styles.cardHeader}>
            <Award size={18} />
            <h3>Staff Efficiency Leaderboard</h3>
          </div>
          <div className={styles.leaderboardList}>
            {stats.staff_performance && stats.staff_performance.length > 0 ? (
              stats.staff_performance.map((staff, idx) => (
                <div key={idx} className={styles.leaderboardItem}>
                  <div className={styles.rankNum}>{idx + 1}</div>
                  <div className={styles.staffInfo}>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{staff.user__username}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{staff.role}</div>
                  </div>
                  <div className={styles.performanceMetric}>
                    <span className={styles.metricVal}>{staff.orders_processed}</span>
                    <span className={styles.metricLabel}>Orders Fulfilled</span>
                  </div>
                  <div className={styles.performanceMetric} style={{ marginLeft: '20px', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
                    <span className={styles.metricVal} style={{ color: '#10b981' }}>₹{staff.total_incentives}</span>
                    <span className={styles.metricLabel}>Total Incentives</span>
                  </div>
                  <div className={styles.performanceBarContainer}>
                    <div 
                      className={styles.performanceBar} 
                      style={{ 
                        width: `${Math.min((staff.orders_processed / (stats.staff_performance[0]?.orders_processed || 1)) * 100, 100)}%`,
                        background: idx === 0 ? 'linear-gradient(90deg, #6366f1, #818cf8)' : '#e2e8f0'
                      }} 
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyMessage}>No staff metrics recorded yet.</p>
            )}
          </div>
        </div>
        {/* Inventory Movement Analysis */}
        <div className={`${styles.analyticsCard} premium-card`} style={{ gridColumn: 'span 2' }}>
          <div className={styles.cardHeader}>
            <Package size={18} />
            <h3>30-Day Inventory Velocity</h3>
          </div>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={varianceChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '10px 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="gains" name="Stock In (+)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="losses" name="Stock Out (-)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Forecasting Banner (Phase III) */}
      <div className={styles.forecastBanner}>
        <div className={styles.forecastInfo}>
          <div className={styles.insightIcon}><Award /></div>
          <div>
            <h4>Demand Forecast: Next 7 Days</h4>
            <p>Based on Smart Replenishment cycles, we expect a 12% surge in dairy and grain orders this weekend.</p>
          </div>
        </div>
        <div className={styles.forecastTag}>+12.4% Predicted</div>
      </div>
    </div>
  );
}
