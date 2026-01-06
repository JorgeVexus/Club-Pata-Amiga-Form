'use client';

import React, { useState, useEffect } from 'react';
import { commService, CommLog } from '@/services/comm.service';
import styles from './CommHistory.module.css';

export default function CommHistory() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadLogs();
    }, []);

    async function loadLogs() {
        setIsLoading(true);
        // Usaremos una consulta general para el admin dashboard. 
        // Por ahora cargamos todos los logs recientes.
        const { data, error } = await (commService as any).getAllLogs(); // Necesito añadir este método al service
        if (data) setLogs(data);
        setIsLoading(false);
    }

    const filteredLogs = logs.filter(log => {
        const contentMatch = log.content.toLowerCase().includes(searchTerm.toLowerCase());
        const userMatch = log.user_id.toLowerCase().includes(searchTerm.toLowerCase());
        return contentMatch || userMatch;
    });

    if (isLoading) return <div className={styles.loading}>Cargando historial...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Historial de Comunicaciones</h3>
                <input
                    type="text"
                    placeholder="Buscar por contenido o ID de usuario..."
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
                                    <code>{log.user_id.substring(0, 10)}...</code>
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
