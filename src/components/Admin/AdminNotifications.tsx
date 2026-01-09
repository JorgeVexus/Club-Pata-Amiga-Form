'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './AdminNotifications.module.css';

interface AdminNotification {
    id: string;
    title: string;
    message: string;
    icon: string;
    link?: string;
    is_read: boolean;
    created_at: string;
    metadata?: any;
}

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        loadNotifications();

        // Polling cada 30 segundos para nuevas notificaciones
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function loadNotifications() {
        try {
            const res = await fetch('/api/admin/notifications');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error loading admin notifications:', error);
        }
    }

    async function markAsRead(id: string) {
        try {
            await fetch(`/api/admin/notifications/${id}/read`, { method: 'POST' });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async function markAllAsRead() {
        try {
            await fetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    function formatTime(dateStr: string) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins}m`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Hace ${diffHours}h`;

        const diffDays = Math.floor(diffHours / 24);
        return `Hace ${diffDays}d`;
    }

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button
                className={styles.bellButton}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.bellIcon}>🔔</span>
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h3>Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                className={styles.markAllBtn}
                                onClick={markAllAsRead}
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <div className={styles.list}>
                        {notifications.length === 0 ? (
                            <div className={styles.empty}>
                                <span>📭</span>
                                <p>No hay notificaciones</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map(notif => (
                                <div
                                    key={notif.id}
                                    className={`${styles.item} ${!notif.is_read ? styles.unread : ''}`}
                                    onClick={() => {
                                        markAsRead(notif.id);
                                        if (notif.link) {
                                            window.location.href = notif.link;
                                        }
                                    }}
                                >
                                    <span className={styles.itemIcon}>{notif.icon || '📢'}</span>
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemTitle}>{notif.title}</div>
                                        <div className={styles.itemMessage}>{notif.message}</div>
                                        <div className={styles.itemTime}>{formatTime(notif.created_at)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
