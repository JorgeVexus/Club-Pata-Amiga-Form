'use client';

import React, { useState, useEffect } from 'react';
import styles from './RequestsTable.module.css';

interface MemberRequest {
    id: string;
    name: string;
    email: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected' | 'appealed' | 'suspended';
    petCount?: number;
    type: 'member' | 'ambassador';
    roles: ('member' | 'ambassador')[]; // New field for display tags
}

interface AppealedPet {
    petId: string;
    petName: string;
    petType: string;
    petStatus: string;
    petBreed: string;
    petPhotoUrl?: string;
    petAdminNotes?: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    appealMessage: string;
    appealedAt: string;
    createdAt: string;
}

interface RequestsTableProps {
    filter: 'all' | 'recents' | 'oldest' | 'approved' | 'rejected' | 'all';
    requestType?: 'all' | 'member' | 'ambassador' | 'wellness-center' | 'solidarity-fund' | 'appeals';
    onViewDetails: (id: string, type?: 'member' | 'ambassador' | 'appeal', extraId?: string) => void;
    onViewRejectionReason?: (id: string) => void;
    onApprove: (id: string, type?: 'member' | 'ambassador') => void;
    onReject: (id: string, type?: 'member' | 'ambassador') => void;
    isSuperAdmin?: boolean;
}

export default function RequestsTable({ filter, requestType = 'all', onViewDetails, onViewRejectionReason, onApprove, onReject, isSuperAdmin = false }: RequestsTableProps) {

    const [requests, setRequests] = useState<MemberRequest[]>([]);
    const [appealedPets, setAppealedPets] = useState<AppealedPet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [sortFilter, setSortFilter] = useState<'recents' | 'oldest' | 'approved' | 'rejected' | 'all'>('all');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [appealDateFilter, setAppealDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    useEffect(() => {
        loadRequests();
    }, [sortFilter, requestType]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (!target.closest(`.${styles.filterDropdown}`)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isDropdownOpen]);

    async function loadRequests() {
        try {
            setLoading(true);

            if (requestType === 'appeals') {
                const response = await fetch('/api/admin/pets/appealed');
                const data = await response.json();
                if (data.success && data.pets) {
                    setAppealedPets(data.pets);
                    setRequests([]);
                }
                setLoading(false);
                return;
            }

            // --- Lógica combinada para Miembros y Embajadores ---

            let statusParam = 'pending';
            if (sortFilter === 'approved') statusParam = 'approved';
            if (sortFilter === 'rejected') statusParam = 'rejected';
            if (sortFilter === 'all') statusParam = 'all';

            const promises = [];

            if (requestType === 'all' || requestType === 'member') {
                promises.push(
                    fetch(`/api/admin/members?status=${statusParam}`)
                        .then(res => res.json())
                        .then(data => ({ type: 'member', data }))
                );
            }

            if (requestType === 'all' || requestType === 'ambassador') {
                promises.push(
                    fetch(`/api/ambassadors?status=${statusParam}&limit=100`)
                        .then(res => res.json())
                        .then(data => ({ type: 'ambassador', data }))
                );
            }

            const results = await Promise.all(promises);
            let combinedRequests: MemberRequest[] = [];
            const ambassadorEmails = new Set<string>();
            const memberPetCounts = new Map<string, number>();

            const ambassadorResult = results.find(r => r.type === 'ambassador');
            const ambassadorData = ambassadorResult?.data?.data || [];

            const memberResult = results.find(r => r.type === 'member');
            const memberData = memberResult?.data?.members || [];

            // Populate Sets for cross-referencing
            ambassadorData.forEach((a: any) => { if (a.email) ambassadorEmails.add(a.email.toLowerCase()); });

            const allowedMembers = isSuperAdmin
                ? memberData
                : memberData.filter((m: any) => m.customFields?.['approval-status'] !== 'appealed');

            // Populate memberPetCounts
            allowedMembers.forEach((m: any) => {
                if (m.auth?.email) {
                    const email = m.auth.email.toLowerCase();
                    let count = 0;
                    for (let i = 1; i <= 3; i++) {
                        if (m.customFields?.[`pet-${i}-name`]) count++;
                    }
                    memberPetCounts.set(email, count);
                }
            });

            // 1. Process Ambassadors
            ambassadorData.forEach((amb: any) => {
                const email = amb.email?.toLowerCase();
                const roles: ('member' | 'ambassador')[] = ['ambassador'];

                // Check pet count for member role
                const petCount = memberPetCounts.get(email) || 0;
                if (email && petCount > 0) roles.push('member');

                combinedRequests.push({
                    id: amb.id,
                    name: `${amb.first_name} ${amb.paternal_surname}`,
                    email: amb.email,
                    submittedAt: amb.created_at,
                    status: amb.status,
                    petCount: 0,
                    type: 'ambassador',
                    roles: roles
                });
            });

            // 2. Process Members
            allowedMembers.forEach((member: any) => {
                const email = member.auth?.email?.toLowerCase();
                const name = `${member.customFields?.['first-name'] || ''} ${member.customFields?.['paternal-last-name'] || ''}`.trim();
                const isNameless = !name;

                // Deduplicate Shell Users
                if (email && ambassadorEmails.has(email) && isNameless) {
                    return;
                }

                // Calculate pet count locally (or fetch from map)
                const petCount = memberPetCounts.get(email!) || 0;

                const roles: ('member' | 'ambassador')[] = [];
                if (petCount > 0) roles.push('member'); // Only if has pets
                if (email && ambassadorEmails.has(email)) roles.push('ambassador');

                combinedRequests.push({
                    id: member.id,
                    name: name || 'Sin nombre',
                    email: member.auth?.email || 'Sin email',
                    submittedAt: member.customFields?.['submitted-at'] || member.createdAt || new Date().toISOString(),
                    status: member.customFields?.['approval-status'] || 'pending',
                    petCount: petCount,
                    type: 'member',
                    roles: roles
                });
            });

            // Sort
            combinedRequests.sort((a, b) => {
                const dateA = new Date(a.submittedAt).getTime();
                const dateB = new Date(b.submittedAt).getTime();
                return sortFilter === 'oldest' ? dateA - dateB : dateB - dateA;
            });

            setRequests(combinedRequests);

        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredRequests = requests
        .filter(req => {
            if (requestType === 'appeals') return req.status === 'appealed';
            return true;
        })
        .filter(req => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    req.name.toLowerCase().includes(query) ||
                    req.email.toLowerCase().includes(query) ||
                    req.id.toLowerCase().includes(query)
                );
            }
            return true;
        })
        .filter(req => {
            if (sortFilter === 'approved') return req.status === 'approved';
            if (sortFilter === 'rejected') return req.status === 'rejected';
            if (sortFilter === 'recents' || sortFilter === 'oldest') return req.status === 'pending';
            return true;
        });

    function getInitials(name: string): string {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            pending: 'Pendiente',
            approved: 'Aprobado',
            rejected: 'Rechazado',
            appealed: 'Apelado',
            suspended: 'Suspendido'
        };
        return labels[status] || status;
    }

    function getFilterLabel(filter: string): string {
        const labels: Record<string, string> = {
            recents: 'Pendientes (Recientes)',
            oldest: 'Pendientes (Antiguos)',
            approved: 'Aprobados',
            rejected: 'Rechazados',
            all: 'Todas'
        };
        return labels[filter] || filter;
    }

    const renderRoleBadges = (roles: ('member' | 'ambassador')[]) => {
        return (
            <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '8px', verticalAlign: 'middle' }}>
                {roles.includes('member') && (
                    <span style={{
                        fontSize: '0.65em',
                        background: '#F3E5F5',
                        color: '#7B1FA2',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: 600
                    }}>
                        MIEMBRO
                    </span>
                )}
                {roles.includes('ambassador') && (
                    <span style={{
                        fontSize: '0.65em',
                        background: '#E0F7FA',
                        color: '#006064',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: 600
                    }}>
                        EMBAJADOR
                    </span>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.requestsSection}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>⏳</div>
                    <div className={styles.emptyText}>Cargando solicitudes...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.requestsSection}>
            <div className={styles.requestsHeader}>
                <h2 className={styles.requestsTitle}>Solicitudes</h2>

                <div className={styles.requestsControls}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Buscar por nombre, email o ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className={styles.filterDropdown}>
                        <button
                            className={`${styles.dropdownButton} ${isDropdownOpen ? styles.open : ''}`}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <span>
                                <span className={styles.filterLabel}>Filtrar por:</span>
                                {getFilterLabel(sortFilter)}
                            </span>
                            <span className={styles.dropdownArrow}>▼</span>
                        </button>

                        <div className={`${styles.dropdownMenu} ${isDropdownOpen ? styles.open : ''}`}>
                            <button className={`${styles.dropdownOption} ${sortFilter === 'all' ? styles.selected : ''}`} onClick={() => { setSortFilter('all'); setIsDropdownOpen(false); }}>📋 Todas</button>
                            <button className={`${styles.dropdownOption} ${sortFilter === 'recents' ? styles.selected : ''}`} onClick={() => { setSortFilter('recents'); setIsDropdownOpen(false); }}>Recientes</button>
                            <button className={`${styles.dropdownOption} ${sortFilter === 'oldest' ? styles.selected : ''}`} onClick={() => { setSortFilter('oldest'); setIsDropdownOpen(false); }}>Antiguos</button>
                            <button className={`${styles.dropdownOption} ${sortFilter === 'approved' ? styles.selected : ''}`} onClick={() => { setSortFilter('approved'); setIsDropdownOpen(false); }}>Aprobados</button>
                            <button className={`${styles.dropdownOption} ${sortFilter === 'rejected' ? styles.selected : ''}`} onClick={() => { setSortFilter('rejected'); setIsDropdownOpen(false); }}>Rechazados</button>
                        </div>
                    </div>
                </div>
            </div>

            {requestType === 'appeals' ? (
                <>
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: '#666', alignSelf: 'center' }}>Filtrar por:</span>
                        {(['all', 'today', 'week', 'month'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setAppealDateFilter(filter)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: appealDateFilter === filter ? '2px solid #7B1FA2' : '1px solid #ddd',
                                    background: appealDateFilter === filter ? '#F3E5F5' : '#fff',
                                    color: appealDateFilter === filter ? '#7B1FA2' : '#666',
                                    fontSize: '12px',
                                    fontWeight: appealDateFilter === filter ? 600 : 400,
                                    cursor: 'pointer',
                                    transition: '0.2s'
                                }}
                            >
                                {filter === 'all' && 'Todos'}
                                {filter === 'today' && 'Hoy'}
                                {filter === 'week' && 'Esta semana'}
                                {filter === 'month' && 'Este mes'}
                            </button>
                        ))}
                    </div>

                    {appealedPets.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📋</div>
                            <div className={styles.emptyText}>No hay apelaciones pendientes</div>
                            <div className={styles.emptySubtext}>Las nuevas apelaciones aparecerán aquí</div>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th>Mascota</th>
                                    <th>Dueño</th>
                                    <th>Mensaje de Apelación</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                                {appealedPets.map((pet) => (
                                    <tr key={pet.petId}>
                                        <td data-label="Mascota">
                                            <div className={styles.memberInfo}>
                                                <div className={styles.memberAvatar} style={{ background: pet.petType === 'Gato' ? '#F3E5F5' : '#E3F2FD' }}>
                                                    {pet.petType === 'Gato' ? '🐱' : '🐕'}
                                                </div>
                                                <div className={styles.memberDetails}>
                                                    <div className={styles.memberName}>{pet.petName}</div>
                                                    <div className={styles.memberEmail}>{pet.petBreed || pet.petType}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Dueño">
                                            <div className={styles.memberDetails}>
                                                <div className={styles.memberName}>{pet.ownerName}</div>
                                                <div className={styles.memberEmail}>{pet.ownerEmail}</div>
                                            </div>
                                        </td>
                                        <td data-label="Mensaje" style={{ maxWidth: '200px' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                                                "{pet.appealMessage?.substring(0, 50) || 'Sin mensaje'}{pet.appealMessage?.length > 50 ? '...' : ''}"
                                            </span>
                                        </td>
                                        <td data-label="Fecha">
                                            {pet.appealedAt ? new Date(pet.appealedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td data-label="Acciones">
                                            <div className={styles.actionButtons}>
                                                <button
                                                    className={styles.viewButton}
                                                    onClick={() => onViewDetails(pet.ownerId, 'appeal', pet.petId)}
                                                >
                                                    Ver Detalles
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            ) : filteredRequests.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📋</div>
                    <div className={styles.emptyText}>No hay solicitudes</div>
                    <div className={styles.emptySubtext}>
                        {searchQuery ? 'Intenta con otro término de búsqueda' : 'Las nuevas solicitudes aparecerán aquí'}
                    </div>
                </div>
            ) : (
                <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                        <tr>
                            <th>Usuario / Rol</th>
                            <th>Fecha de Solicitud</th>
                            <th>Info Extra</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                        {filteredRequests.map((request) => (
                            <tr key={request.id}>
                                <td data-label="Usuario">
                                    <div className={styles.memberInfo}>
                                        <div className={styles.memberAvatar} style={{
                                            background: request.type === 'ambassador' ? '#E0F7FA' : '#F3E5F5',
                                            color: request.type === 'ambassador' ? '#006064' : '#7B1FA2'
                                        }}>
                                            {request.type === 'ambassador' ? '🎯' : getInitials(request.name)}
                                        </div>
                                        <div className={styles.memberDetails}>
                                            <div className={styles.memberName}>
                                                {request.name}
                                                {renderRoleBadges(request.roles)}
                                            </div>
                                            <div className={styles.memberEmail}>{request.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Fecha">{formatDate(request.submittedAt)}</td>
                                <td data-label="Info Extra">
                                    {request.type === 'member' ? (
                                        <span>🐶 {request.petCount || 0} Mascotas</span>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </td>
                                <td data-label="Estado">
                                    <span className={`${styles.statusBadge} ${styles[request.status]}`}>
                                        <span className={styles.statusDot}></span>
                                        {getStatusLabel(request.status)}
                                    </span>
                                </td>
                                <td data-label="Acciones">
                                    <div className={styles.actionButtons}>
                                        {request.status === 'rejected' ? (
                                            <button
                                                className={styles.rejectButton}
                                                onClick={() => onViewRejectionReason?.(request.id)}
                                                style={{ width: '50%', borderRadius: '50px' }}
                                            >
                                                Ver Motivo
                                            </button>
                                        ) : (
                                            <button
                                                className={styles.viewButton}
                                                onClick={() => onViewDetails(request.id, request.type)}
                                            >
                                                Ver Detalles
                                            </button>
                                        )}
                                        {request.status === 'pending' && (
                                            <>
                                                <button
                                                    className={styles.approveButton}
                                                    onClick={() => onApprove(request.id, request.type)}
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    className={styles.rejectButton}
                                                    onClick={() => onReject(request.id, request.type)}
                                                >
                                                    Rechazar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
