'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminsTable.module.css';

interface Admin {
    memberstack_id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'super_admin';
    created_at: string;
}

export default function AdminsTable() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const response = await fetch('/api/admin/admins');
            const data = await response.json();
            if (data.success) {
                setAdmins(data.admins);
            }
        } catch (error) {
            console.error('Error loading admins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className={styles.loading}>Cargando administradores...</div>;
    }

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Fecha de Registro</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map((admin) => (
                        <tr key={admin.memberstack_id}>
                            <td>{admin.full_name || 'Sin nombre'}</td>
                            <td>{admin.email}</td>
                            <td>
                                <span className={admin.role === 'super_admin' ? styles.superAdminBadge : styles.adminBadge}>
                                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                </span>
                            </td>
                            <td>{new Date(admin.created_at).toLocaleDateString('es-MX')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {admins.length === 0 && (
                <div className={styles.empty}>No hay administradores registrados.</div>
            )}
        </div>
    );
}
