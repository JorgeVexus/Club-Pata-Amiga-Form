'use client';

import React, { useState, useEffect } from 'react';
import styles from './RequestsTable.module.css';
import { adminFetch } from '@/utils/admin-fetch';
import { WellnessCenter } from '@/types/wellness.types';

interface Props {
    filter: 'pending' | 'approved' | 'rejected' | 'all';
    onViewDetails: (center: WellnessCenter) => void;
}

export default function WellnessCentersTable({ filter, onViewDetails }: Props) {
    const [centers, setCenters] = useState<WellnessCenter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCenters = async () => {
            setIsLoading(true);
            try {
                const query = filter !== 'all' ? `?status=${filter}` : '';
                const response = await adminFetch(`/api/admin/wellness${query}`);
                const data = await response.json();
                if (data.success) {
                    setCenters(data.data);
                }
            } catch (error) {
                console.error('Error fetching wellness centers:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCenters();
    }, [filter]);

    const filteredCenters = centers.filter(c => 
        c.establishment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className={styles.loading}>Cargando aliados...</div>;

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o email..." 
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Establecimiento</th>
                        <th>Servicios</th>
                        <th>Estado</th>
                        <th>Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCenters.map((center) => (
                        <tr key={center.id}>
                            <td>
                                <div className={styles.memberName}>
                                    {center.establishment_name}
                                    <span className={styles.memberEmail}>{center.email}</span>
                                </div>
                            </td>
                            <td>
                                <div className={styles.servicesList}>
                                    {center.services.slice(0, 2).join(', ')}
                                    {center.services.length > 2 && '...'}
                                </div>
                            </td>
                            <td>
                                <span className={`${styles.statusBadge} ${styles[center.status]}`}>
                                    {center.status.toUpperCase()}
                                </span>
                            </td>
                            <td>{new Date(center.created_at).toLocaleDateString()}</td>
                            <td>
                                <button 
                                    className={styles.viewButton}
                                    onClick={() => onViewDetails(center)}
                                >
                                    Ver Detalles
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredCenters.length === 0 && (
                        <tr>
                            <td colSpan={5} className={styles.emptyCell}>
                                No se encontraron centros de bienestar.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
