'use client';

import React, { useState, useEffect } from 'react';
import styles from './RequestsTable.module.css';

interface MemberRequest {
    id: string;
    name: string;
    email: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected' | 'appealed';
    petCount?: number;
}

// Interface para mascotas apeladas
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
    onViewDetails: (memberId: string, petId?: string) => void; // petId opcional para apelaciones
    onViewRejectionReason?: (memberId: string) => void;
    onApprove: (memberId: string) => void;
    onReject: (memberId: string) => void;
}

export default function RequestsTable({ filter, requestType = 'all', onViewDetails, onViewRejectionReason, onApprove, onReject }: RequestsTableProps) {

    const [requests, setRequests] = useState<MemberRequest[]>([]);
    const [appealedPets, setAppealedPets] = useState<AppealedPet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [sortFilter, setSortFilter] = useState<'recents' | 'oldest' | 'approved' | 'rejected' | 'all'>('all');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        loadRequests();
    }, [sortFilter]); // Reload when internal filter changes

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

            // Si es vista de apelaciones, usar la API de mascotas apeladas
            if (requestType === 'appeals') {
                const response = await fetch('/api/admin/pets/appealed');
                const data = await response.json();
                if (data.success && data.pets) {
                    setAppealedPets(data.pets);
                    setRequests([]); // Limpiar requests normales
                }
                return;
            }

            // Lógica normal para otros tipos
            let statusParam = 'pending';
            if (sortFilter === 'approved') statusParam = 'approved';
            if (sortFilter === 'rejected') statusParam = 'rejected';
            if (sortFilter === 'all') statusParam = 'all';

            const response = await fetch(`/api/admin/members?status=${statusParam}`);
            const data = await response.json();

            if (data.success && data.members) {
                let formattedRequests: MemberRequest[] = data.members.map((member: any) => {
                    // Count pets by checking pet-x-name fields
                    let petCount = 0;
                    for (let i = 1; i <= 3; i++) {
                        if (member.customFields?.[`pet-${i}-name`]) petCount++;
                    }

                    return {
                        id: member.id,
                        name: `${member.customFields?.['first-name'] || ''} ${member.customFields?.['paternal-last-name'] || ''}`.trim() || 'Sin nombre',
                        email: member.auth?.email || 'Sin email',
                        submittedAt: member.customFields?.['submitted-at'] || member.createdAt || new Date().toISOString(),
                        status: member.customFields?.['approval-status'] || 'pending',
                        petCount: petCount
                    };
                });

                // Apply sorting
                formattedRequests.sort((a, b) => {
                    const dateA = new Date(a.submittedAt).getTime();
                    const dateB = new Date(b.submittedAt).getTime();
                    return sortFilter === 'oldest' ? dateA - dateB : dateB - dateA;
                });

                setRequests(formattedRequests);
            } else {
                console.log('No data or not successful');
            }
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    }

    // Filter and sort requests
    const filteredRequests = requests
        .filter(req => {
            // Type Filter Logic
            // Currently all users are members by default.
            // If requestType is 'all' or 'member', show everything.
            // If requestType is 'ambassador' or others, show nothing (until we implement types).

            if (requestType === 'all') return true;
            if (requestType === 'member') return true;
            if (requestType === 'appeals') return req.status === 'appealed';

            return false;
        })
        .filter(req => {
            // Search filter
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
            // Client-side filtering (extra safety or for mixed lists)
            if (sortFilter === 'approved') return req.status === 'approved';
            if (sortFilter === 'rejected') return req.status === 'rejected';
            if (sortFilter === 'recents' || sortFilter === 'oldest') return req.status === 'pending';
            return true; // 'all' shows everything
        })
        .sort((a, b) => {
            // Sort by date
            const dateA = new Date(a.submittedAt).getTime();
            const dateB = new Date(b.submittedAt).getTime();

            if (sortFilter === 'recents') {
                return dateB - dateA; // Newest first
            } else {
                return dateA - dateB; // Oldest first
            }
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
            appealed: 'Apelado'
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
            {/* Header with Search and Filters */}
            <div className={styles.requestsHeader}>
                <h2 className={styles.requestsTitle}>Solicitudes</h2>

                <div className={styles.requestsControls}>
                    {/* Search Box */}
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

                    {/* Dropdown Filter */}
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
                            <button
                                className={`${styles.dropdownOption} ${sortFilter === 'all' ? styles.selected : ''}`}
                                onClick={() => {
                                    setSortFilter('all');
                                    setIsDropdownOpen(false);
                                }}
                            >
                                📋 Todas
                            </button>
                            <button
                                className={`${styles.dropdownOption} ${sortFilter === 'recents' ? styles.selected : ''}`}
                                onClick={() => {
                                    setSortFilter('recents');
                                    setIsDropdownOpen(false);
                                }}
                            >
                                Recientes
                            </button>
                            <button
                                className={`${styles.dropdownOption} ${sortFilter === 'oldest' ? styles.selected : ''}`}
                                onClick={() => {
                                    setSortFilter('oldest');
                                    setIsDropdownOpen(false);
                                }}
                            >
                                Antiguos
                            </button>
                            <button
                                className={`${styles.dropdownOption} ${sortFilter === 'approved' ? styles.selected : ''}`}
                                onClick={() => {
                                    setSortFilter('approved');
                                    setIsDropdownOpen(false);
                                }}
                            >
                                Aprobados
                            </button>
                            <button
                                className={`${styles.dropdownOption} ${sortFilter === 'rejected' ? styles.selected : ''}`}
                                onClick={() => {
                                    setSortFilter('rejected');
                                    setIsDropdownOpen(false);
                                }}
                            >
                                Rechazados
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            {requestType === 'appeals' ? (
                /* Tabla especial para Apelaciones por Mascota */
                appealedPets.length === 0 ? (
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
                            {appealedPets
                                .filter(pet => {
                                    if (!searchQuery) return true;
                                    const query = searchQuery.toLowerCase();
                                    return (
                                        pet.petName.toLowerCase().includes(query) ||
                                        pet.ownerName.toLowerCase().includes(query) ||
                                        pet.ownerEmail.toLowerCase().includes(query)
                                    );
                                })
                                .map((pet) => (
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
                                                    onClick={() => onViewDetails(pet.ownerId, pet.petId)}
                                                >
                                                    Ver Detalles
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )
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
                            <th>Miembro</th>
                            <th>Fecha de Solicitud</th>
                            <th>Mascotas</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                        {filteredRequests.map((request) => (
                            <tr key={request.id}>
                                <td data-label="Miembro">
                                    <div className={styles.memberInfo}>
                                        <div className={styles.memberAvatar}>
                                            {getInitials(request.name)}
                                        </div>
                                        <div className={styles.memberDetails}>
                                            <div className={styles.memberName}>{request.name}</div>
                                            <div className={styles.memberEmail}>{request.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Fecha">{formatDate(request.submittedAt)}</td>
                                <td data-label="Mascotas">{request.petCount || 0}</td>
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
                                                onClick={() => onViewDetails(request.id)}
                                            >
                                                Ver Detalles
                                            </button>
                                        )}
                                        {request.status === 'pending' && (
                                            <>
                                                <button
                                                    className={styles.approveButton}
                                                    onClick={() => onApprove(request.id)}
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    className={styles.rejectButton}
                                                    onClick={() => onReject(request.id)}
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
