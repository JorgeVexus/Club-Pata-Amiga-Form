'use client';

import React, { useState, useEffect } from 'react';
import { commService, CommLog } from '@/services/comm.service';
import styles from './CommHistory.module.css';

interface CommHistoryProps {
    adminName: string;
    isSuperAdmin: boolean;
}

export default function CommHistory({ adminName, isSuperAdmin }: CommHistoryProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        loadLogs();
        setHasMounted(true);
    }, [adminName]);

    async function loadLogs() {
        try {
            setIsLoading(true);
            const { data, error } = await commService.getAllLogs();
            if (error) throw error;
            if (data) setLogs(data);
        } catch (err) {
            console.error('Error cargando logs:', err);
        } finally {
            setIsLoading(false);
        }
    }

    const filteredLogs = logs.filter(log => {
        // Filtro de Seguridad: Admin normal solo ve lo suyo
        if (!isSuperAdmin && log.admin_id !== adminName) {
            return false;
        }

        const contentMatch = log.content.toLowerCase().includes(searchTerm.toLowerCase());
        const userMatch = log.user_id.toLowerCase().includes(searchTerm.toLowerCase());
        const adminMatch = (log.admin_id || '').toLowerCase().includes(searchTerm.toLowerCase());

        return contentMatch || userMatch || adminMatch;
    });

    if (isLoading) return <div className={styles.loading}>Cargando historial...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>{isSuperAdmin ? 'Historial Global' : 'Tu Historial de Envío'}</h3>
                <input
                    type="text"
                    placeholder="Buscar por contenido, usuario o admin..."
                    className={styles.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Usuario</th>
                            <th>Admin</th>
                            <th>Estado</th>
                            <th>Contenido</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map((log) => (
                            <tr key={log.id}>
                                <td className={styles.date}>
                                    {new Date(log.created_at).toLocaleString('es-MX', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                                <td>
                                    <span className={`${styles.typeBadge} ${styles[log.type]}`}>
                                        {log.type === 'email' ? '📧 Email' : '💬 WA'}
                                    </span>
                                </td>
                                <td className={styles.userId}>
                                    <code>{log.user_id.substring(0, 8)}...</code>
                                </td>
                                <td className={styles.adminCol}>
                                    {log.admin_id || <span className={styles.system}>SISTEMA</span>}
                                </td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[log.status]}`}>
                                        {log.status === 'sent' ? 'Enviado' : 'Fallido'}
                                    </span>
                                </td>
                                <td className={styles.contentCol}>
                                    <div className={styles.contentPreview}>
                                        {log.content}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLogs.length === 0 && (
                    <div className={styles.empty}>No se encontraron registros.</div>
                )}
            </div>
        </div>
    );
}
