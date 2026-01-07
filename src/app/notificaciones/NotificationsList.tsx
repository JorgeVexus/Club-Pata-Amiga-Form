'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './notifications.module.css';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

interface NotificationsListProps {
    userId: string;
}

export default function NotificationsList({ userId }: NotificationsListProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [isLoading, setIsLoading] = useState(true);

    const loadNotifications = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/notifications?userId=${userId}&limit=50`);
            const data = await response.json();
            if (data.success) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadNotifications();

        const channel = supabase
            .channel(`notifications-page-${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                () => loadNotifications()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, loadNotifications]);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marcando como leída:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    };

    const filteredNotifications = notifications.filter(n =>
        filter === 'all' ? true : !n.is_read
    );

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) return <div className={styles.loading}>Cargando tus mensajes...</div>;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Buzón de Notificaciones</h1>
                <div className={styles.controls}>
                    <select
                        className={styles.filterSelect}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                    >
                        <option value="all">Todas</option>
                        <option value="unread">No leídas</option>
                    </select>
                    {notifications.some(n => !n.is_read) && (
                        <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                            Marcar todas como leídas
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.notificationList}>
                {filteredNotifications.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📭</span>
                        <p className={styles.emptyText}>
                            {filter === 'unread' ? 'No tienes mensajes sin leer' : 'Aún no tienes notificaciones'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
                            onClick={() => handleMarkAsRead(notification.id, notification.is_read)}
                        >
                            <div className={styles.iconWrapper}>
                                {notification.icon}
                            </div>
                            <div className={styles.content}>
                                <div className={styles.itemHeader}>
                                    <h3 className={styles.itemTitle}>{notification.title}</h3>
                                    <span className={styles.time}>{formatTime(notification.created_at)}</span>
                                </div>
                                <p className={styles.message}>{notification.message}</p>
                                {notification.link && (
                                    <a href={notification.link} className="btn-link" style={{ fontSize: '0.85rem' }}>
                                        Ver más →
                                    </a>
                                )}
                            </div>
                            {!notification.is_read && <div className={styles.unreadDot} />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
