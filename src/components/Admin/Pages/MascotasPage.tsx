'use client';

import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/utils/admin-fetch';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import FilterChips from '../ui/FilterChips';
import DataGrid from '../ui/DataGrid';
import PillButton from '../ui/PillButton';
import StatusChip from '../ui/StatusChip';
import PetUnsubscriptionsTable from '../PetUnsubscriptionsTable';
import styles from './MascotasPage.module.css';

interface PendingPet {
    id: string;
    name: string;
    breed: string | null;
    petType: string | null;
    status: string;
    isSenior: boolean;
    hasVetCertificate: boolean;
    createdAt: string;
    owner: { memberstackId: string | null; name: string; email: string };
}

const FILTERS = [
    { id: 'pending', label: 'Pendientes' },
    { id: 'approved', label: 'Aprobadas' },
    { id: 'rejected', label: 'Rechazadas' },
    { id: 'bajas', label: 'Bajas' },
];

const STATUS_TONE: Record<string, 'success' | 'error' | 'warning'> = {
    approved: 'success',
    rejected: 'error',
    pending: 'warning',
};

export default function MascotasPage() {
    const [activeFilter, setActiveFilter] = useState('pending');
    const [pets, setPets] = useState<PendingPet[]>([]);
    const [loading, setLoading] = useState(true);
    const [workingId, setWorkingId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (activeFilter === 'bajas') return;

        let cancelled = false;
        setLoading(true);
        adminFetch(`/api/admin/pets/pending?status=${activeFilter}`)
            .then((res) => res.json())
            .then((data) => {
                if (!cancelled && data.success) setPets(data.pets || []);
            })
            .catch((err) => console.error('❌ Error cargando mascotas:', err))
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [activeFilter, refreshKey]);

    async function reviewPet(pet: PendingPet, status: 'approved' | 'rejected') {
        if (!pet.owner.memberstackId) {
            alert('No se encontró al dueño de esta mascota.');
            return;
        }
        let adminNotes = '';
        if (status === 'rejected') {
            adminNotes = prompt('Motivo del rechazo:') || '';
            if (!adminNotes.trim()) return;
        }
        if (!confirm(status === 'approved' ? '¿Aprobar esta mascota?' : '¿Rechazar esta mascota?')) return;

        setWorkingId(pet.id);
        try {
            const res = await adminFetch(`/api/admin/members/${pet.owner.memberstackId}/pets/${pet.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNotes }),
            });
            if (res.ok) {
                setRefreshKey((k) => k + 1);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || 'No se pudo actualizar la mascota.');
            }
        } catch (error) {
            console.error('❌ Error actualizando mascota:', error);
        } finally {
            setWorkingId(null);
        }
    }

    return (
        <PageContainer>
            <PageHeader title="Mascotas" />
            <FilterChips options={FILTERS} activeId={activeFilter} onChange={setActiveFilter} />

            {activeFilter === 'bajas' ? (
                <PetUnsubscriptionsTable refreshKey={refreshKey} />
            ) : (
                <Card>
                    <DataGrid
                        columns={[
                            { label: 'Mascota', width: '2fr' },
                            { label: 'Dueño', width: '2fr' },
                            { label: 'Estado', width: '1fr' },
                            { label: '', width: '1.5fr' },
                        ]}
                        rows={pets}
                        rowKey={(p) => p.id}
                        emptyMessage={loading ? 'Cargando…' : 'Sin mascotas en esta categoría.'}
                        renderRow={(pet) => (
                            <>
                                <span className={styles.row}>
                                    <span className={styles.petIcon}>
                                        {pet.petType === 'gato' ? '🐈' : '🐕'}
                                    </span>
                                    {pet.name}
                                    {pet.breed ? ` · ${pet.breed}` : ''}
                                </span>
                                <span>{pet.owner.name}</span>
                                <StatusChip tone={STATUS_TONE[pet.status] ?? 'neutral'}>
                                    {pet.status}
                                </StatusChip>
                                {pet.status === 'pending' ? (
                                    <span className={styles.actions}>
                                        <PillButton
                                            small
                                            variant="outline"
                                            disabled={workingId === pet.id}
                                            onClick={() => reviewPet(pet, 'rejected')}
                                        >
                                            Rechazar
                                        </PillButton>
                                        <PillButton
                                            small
                                            variant="primary"
                                            disabled={workingId === pet.id}
                                            onClick={() => reviewPet(pet, 'approved')}
                                        >
                                            Aprobar
                                        </PillButton>
                                    </span>
                                ) : (
                                    <span />
                                )}
                            </>
                        )}
                    />
                </Card>
            )}
        </PageContainer>
    );
}
