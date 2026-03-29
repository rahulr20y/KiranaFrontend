import React, { useState } from 'react';
import { useNotifications } from '../lib/notificationContext';
import styles from '../styles/notifications.module.css';

export default function NotificationBell() {
    const { notifications, markAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const toggleDropdown = () => setIsOpen(!isOpen);

    return (
        <div className={styles.bellContainer}>
            <button className={styles.bellButton} onClick={toggleDropdown} aria-label="Notifications">
                <span className={styles.icon}>🔔</span>
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className={styles.markAllRead}>Mark all read</button>
                        )}
                    </div>
                    <div className={styles.list}>
                        {notifications.length === 0 ? (
                            <div className={styles.empty}>No notifications yet</div>
                        ) : (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    className={`${styles.item} ${!notification.is_read ? styles.unread : ''}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className={styles.itemHeader}>
                                        <strong>{notification.title}</strong>
                                        <span className={styles.time}>
                                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p>{notification.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
