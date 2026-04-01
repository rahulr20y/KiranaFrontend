import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './authContext';
import { notificationsAPI } from './api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        if (user && token) {
            // Request notification permission
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }
            
            // Use the correct API URL and switch protocol
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
            const wsBase = apiUrl.replace('http://', '').replace('https://', '').split('/api')[0];
            const wsUrl = `${wsProtocol}://${wsBase}/ws/notifications/?token=${token}`;

            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('Connected to notifications WebSocket');
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'notification') {
                    setNotifications(prev => [data.data, ...prev]);
                    
                    // Native browser notification
                    if (Notification.permission === "granted") {
                        new Notification(data.data.title, {
                            body: data.data.message,
                            icon: '/favicon.ico'
                        });
                    }
                }
            };

            socket.onclose = () => {
                console.log('Disconnected from notifications WebSocket');
            };

            setWs(socket);

            return () => {
                socket.close();
            };
        }
    }, [user, token]);

    const markAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, setNotifications, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
