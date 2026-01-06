/**
 * NotificationBell Component
 * Campanita de notificaciones con badge de contador y dropdown
 * 
 * Uso:
 * <NotificationBell userId="mem_abc123" />
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './NotificationBell.module.css';

// Tipos
interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    link: string | null;
    is_read: boolean;
    read_at: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    expires_at: string | null;
}

interface NotificationBellProps {
    userId: string;
    maxNotifications?: number;
    onNotificationClick?: (notification: Notification) => void;
}

// Función helper para formatear tiempo relativo
function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short'
    });
}

export default function NotificationBell({
    userId,
    maxNotifications = 10,
    onNotificationClick
}: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cargar notificaciones
    const loadNotifications = useCallback(async () => {
        if (!userId) {
            console.warn('🔔 NotificationBell: userId is missing, skipping fetch');
            return;
        }

        try {
            console.log('🔔 NotificationBell: Fetching notifications for:', userId);
            const response = await fetch(
                `/api/notifications?userId=${userId}&limit=${maxNotifications}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('🔔 NotificationBell: Fetch error:', response.status, errorData);
                return;
            }

            const data = await response.json();

            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length);
                console.log('🔔 NotificationBell: Loaded', data.notifications.length, 'notifications');
            } else {
                console.error('🔔 NotificationBell: API returned failure:', data.error);
            }
        } catch (error) {
            console.error('🔔 NotificationBell: Unexpected error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, maxNotifications]);

    // Cargar al montar y suscribirse a Realtime
    useEffect(() => {
        loadNotifications();

        // Suscribirse a cambios en tiempo real
        const channel = supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('🔔 Notification change:', payload);
                    loadNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, loadNotifications]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Marcar como leída
    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId
                        ? { ...n, is_read: true, read_at: new Date().toISOString() }
                        : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Marcar todas como leídas
    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Manejar clic en notificación
    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        if (onNotificationClick) {
            onNotificationClick(notification);
        } else if (notification.link) {
            window.location.href = notification.link;
        }

        setIsOpen(false);
    };

    return (
        <div className={styles.container} ref={dropdownRef}>
            {/* Botón de campanita */}
            <button
                className={styles.bellButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
                aria-expanded={isOpen}
            >
                <span className={styles.bellIcon}>🔔</span>
                {unreadCount > 0 && (
                    <span className={styles.badge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={styles.dropdown}>
                    {/* Header */}
                    <div className={styles.header}>
                        <h3 className={styles.headerTitle}>Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                className={styles.markAllButton}
                                onClick={markAllAsRead}
                            >
                                ✓ Marcar todas
                            </button>
                        )}
                    </div>

                    {/* Lista de notificaciones */}
                    <div className={styles.notificationList}>
                        {isLoading ? (
                            <div className={styles.loadingState}>
                                <span className={styles.spinner}></span>
                                Cargando...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📭</span>
                                <p>No tienes notificaciones</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className={styles.notificationIcon}>
                                        {notification.icon}
                                    </div>
                                    <div className={styles.notificationContent}>
                                        <h4 className={styles.notificationTitle}>
                                            {notification.title}
                                        </h4>
                                        <p className={styles.notificationMessage}>
                                            {notification.message}
                                        </p>
                                        <span className={styles.notificationTime}>
                                            {formatTimeAgo(notification.created_at)}
                                        </span>
                                    </div>
                                    {!notification.is_read && (
                                        <div className={styles.unreadDot}></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <a href="/notifications" className={styles.viewAllLink}>
                            Ver todas las notificaciones →
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
