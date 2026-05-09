'use client';

import React, { useState, useEffect } from 'react';
import styles from './SolidarityDashboard.module.css';
import { adminFetch } from '@/utils/admin-fetch';

interface SolidarityRequest {
    id: string;
    user_id: string;
    pet_id: string;
    benefit_type: 'medical_emergency' | 'annual_vaccination' | 'death';
    type: 'direct_payment' | 'reimbursement';
    status: 'new' | 'in_review' | 'needs_info' | 'approved' | 'rejected' | 'paid' | 'completed';
    requested_amount: number;
    clinic_name?: string;
    case_title: string;
    created_at: string;
    user_name?: string;
    user_email?: string;
    pet_name?: string;
}

interface SolidarityDashboardProps {
    onViewDetail: (id: string) => void;
}

export default function SolidarityDashboard({ onViewDetail }: SolidarityDashboardProps) {
    const [requests, setRequests] = useState<SolidarityRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadRequests();
    }, [filter]);

    async function loadRequests() {
        setLoading(true);
        try {
            const response = await adminFetch(`/api/admin/solidarity/list?status=${filter}`);
            const data = await response.json();
            if (data.success) {
                setRequests(data.data);
            }
        } catch (error) {
            console.error('Error loading solidarity requests:', error);
        } finally {
            setLoading(false);
        }
    }

    const getStatusBadge = (status: string) => {
        const styles_map: any = {
            new: { bg: '#E5E7EB', color: '#374151', label: 'Nuevo' },
            in_review: { bg: '#FEF3C7', color: '#92400E', label: 'En Revisión' },
            needs_info: { bg: '#FEE2E2', color: '#991B1B', label: 'Acción Req.' },
            approved: { bg: '#D1FAE5', color: '#065F46', label: 'Aprobado' },
            rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rechazado' },
            paid: { bg: '#DBEAFE', color: '#1E40AF', label: 'Pagado' },
            completed: { bg: '#DEF7EC', color: '#03543F', label: 'Completado' }
        };
        const s = styles_map[status] || styles_map.new;
        return (
            <span style={{ 
                backgroundColor: s.bg, 
                color: s.color, 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: 'bold' 
            }}>
                {s.label}
            </span>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Fondo Solidario</h2>
                <div className={styles.filters}>
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className={styles.select}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="new">Nuevos</option>
                        <option value="in_review">En Revisión</option>
                        <option value="needs_info">Acción Requerida</option>
                        <option value="approved">Aprobados</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Cargando solicitudes...</div>
            ) : requests.length === 0 ? (
                <div className={styles.empty}>No hay solicitudes que mostrar.</div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Usuario</th>
                                <th>Mascota</th>
                                <th>Tipo</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className={styles.userName}>{req.user_name}</div>
                                        <div className={styles.userEmail}>{req.user_email}</div>
                                    </td>
                                    <td>{req.pet_name}</td>
                                    <td>
                                        <span className={styles.benefitType}>
                                            {req.benefit_type === 'medical_emergency' ? '🏥 Emergencia' : '💉 Vacuna'}
                                        </span>
                                    </td>
                                    <td className={styles.amount}>${req.requested_amount}</td>
                                    <td>{getStatusBadge(req.status)}</td>
                                    <td>
                                        <button 
                                            onClick={() => onViewDetail(req.id)}
                                            className={styles.viewBtn}
                                        >
                                            Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
