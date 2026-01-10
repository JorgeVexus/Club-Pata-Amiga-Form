'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import styles from './AdminNotifications.module.css';

// Cliente de Supabase para el cliente (usando la URL pública)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

interface AdminNotificationsProps {
    onNotificationClick?: (notification: AdminNotification) => void;
}

export default function AdminNotifications({ onNotificationClick }: AdminNotificationsProps) {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Cargar notificaciones iniciales
    const loadNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/notifications');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error loading admin notifications:', error);
        }
    }, []);

    // Configurar Supabase Realtime
    useEffect(() => {
        // Carga inicial
        loadNotifications();

        // 🆕 Suscribirse a cambios en tiempo real
        const channel = supabase
            .channel('admin-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: 'user_id=eq.admin'
                },
                (payload) => {
                    console.log('🔔 Nueva notificación en tiempo real:', payload);
                    const newNotification = payload.new as AdminNotification;

                    // Añadir al inicio de la lista
                    setNotifications(prev => [newNotification, ...prev]);

                    // Mostrar toast
                    setToastMessage(newNotification.title || 'Nueva notificación');
                    setShowToast(true);

                    // Reproducir sonido (opcional)
                    playNotificationSound();

                    // Ocultar toast después de 4 segundos
                    setTimeout(() => setShowToast(false), 4000);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: 'user_id=eq.admin'
                },
                (payload) => {
                    // Actualizar notificación existente
                    const updated = payload.new as AdminNotification;
                    setNotifications(prev =>
                        prev.map(n => n.id === updated.id ? updated : n)
                    );
                }
            )
            .subscribe((status) => {
                console.log('📡 Estado de suscripción Realtime:', status);
            });

        channelRef.current = channel;

        // Cleanup al desmontar
        return () => {
            console.log('🔌 Desconectando Realtime...');
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [loadNotifications]);

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

    function playNotificationSound() {
        try {
            // Crear un sonido simple con Web Audio API
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Ignorar si no hay soporte de audio
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

    function handleNotificationClick(notif: AdminNotification) {
        markAsRead(notif.id);
        setIsOpen(false);

        if (onNotificationClick) {
            onNotificationClick(notif);
        }
    }

    return (
        <>
            {/* Toast de nueva notificación */}
            {showToast && (
                <div className={styles.toast}>
                    <span className={styles.toastIcon}>🔔</span>
                    <span className={styles.toastText}>{toastMessage}</span>
                </div>
            )}

            <div className={styles.container} ref={dropdownRef}>
                <button
                    className={`${styles.bellButton} ${unreadCount > 0 ? styles.hasNew : ''}`}
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
                                        onClick={() => handleNotificationClick(notif)}
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
        </>
    );
}
