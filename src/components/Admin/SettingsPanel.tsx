'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import { adminFetch } from '@/utils/admin-fetch';

interface SettingsPanelProps {
    skipPaymentEnabled: boolean;
    onToggleSkipPayment: (enabled: boolean) => void;
}

export default function SettingsPanel({ skipPaymentEnabled, onToggleSkipPayment }: SettingsPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [memberPets, setMemberPets] = useState<any[]>([]);
    const [isLoadingPets, setIsLoadingPets] = useState(false);
    const [bypassingPetId, setBypassingPetId] = useState<string | null>(null);

    // Cargar miembros en el montaje del componente
    useEffect(() => {
        const fetchMembers = async () => {
            setIsLoadingMembers(true);
            try {
                const res = await adminFetch('/api/admin/members?status=all&paidOnly=false');
                const data = await res.json();
                if (data.success && data.members) {
                    setMembers(data.members);
                }
            } catch (err) {
                console.error('Error fetching members for settings:', err);
            } finally {
                setIsLoadingMembers(false);
            }
        };
        fetchMembers();
    }, []);

    const handleSelectMember = async (member: any) => {
        setSelectedMember(member);
        setIsLoadingPets(true);
        setMemberPets([]);
        try {
            const res = await adminFetch(`/api/user/pets?userId=${member.id}`);
            const data = await res.json();
            if (data.success && data.pets) {
                setMemberPets(data.pets);
            }
        } catch (err) {
            console.error('Error fetching pets for member:', err);
        } finally {
            setIsLoadingPets(false);
        }
    };

    const handleBypassCarencia = async (petId: string) => {
        if (!confirm('¿Estás seguro de finalizar el tiempo de espera de esta mascota?')) return;
        setBypassingPetId(petId);
        try {
            const res = await adminFetch(`/api/admin/pets/${petId}/bypass-carencia`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message || 'Carencia finalizada con éxito.');
                if (selectedMember) {
                    await handleSelectMember(selectedMember);
                }
            } else {
                alert('Error: ' + (data.error || 'No se pudo procesar'));
            }
        } catch (err) {
            alert('Error de conexión al procesar bypass');
        } finally {
            setBypassingPetId(null);
        }
    };

    const filteredMembers = searchQuery.trim() === '' 
        ? [] 
        : members.filter(m => {
            const name = `${m.customFields?.['first-name'] || ''} ${m.customFields?.['paternal-last-name'] || ''} ${m.supabaseFirstName || ''} ${m.supabaseLastName || ''}`.toLowerCase();
            const email = (m.auth?.email || m.email || '').toLowerCase();
            const q = searchQuery.toLowerCase();
            return name.includes(q) || email.includes(q);
        });

    return (
        <div style={{ maxWidth: 600 }}>
            {/* Tarjeta de Modo Test */}
            <div className={styles.sectionCard} style={{
                background: '#fff',
                borderRadius: 16,
                padding: '2rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#333' }}>
                    ⚙️ Opciones de Prueba
                </h3>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: skipPaymentEnabled ? '#FFF3E0' : '#F5F5F7',
                    borderRadius: 12,
                    border: skipPaymentEnabled ? '1px solid #FFB74D' : '1px solid #E5E5E5',
                    transition: 'all 0.3s ease'
                }}>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#333' }}>
                            Modo Test (Skip Payment)
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                            {skipPaymentEnabled
                                ? '⚠️ Los usuarios pueden registrarse sin pagar'
                                : 'Los usuarios deben completar el pago para registrarse'}
                        </div>
                    </div>

                    <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: 52,
                        height: 28,
                        flexShrink: 0,
                        marginLeft: '1rem'
                    }}>
                        <input
                            type="checkbox"
                            checked={skipPaymentEnabled}
                            onChange={(e) => onToggleSkipPayment(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: skipPaymentEnabled ? '#FF9800' : '#ccc',
                            borderRadius: 28,
                            transition: '0.3s',
                        }}>
                            <span style={{
                                position: 'absolute',
                                content: '""',
                                height: 22,
                                width: 22,
                                left: skipPaymentEnabled ? 26 : 3,
                                bottom: 3,
                                background: '#fff',
                                borderRadius: '50%',
                                transition: '0.3s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                        </span>
                    </label>
                </div>

                {skipPaymentEnabled && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        background: '#FFF8E1',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        color: '#E65100',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        🚨 <strong>Recuerda desactivar esto antes del lanzamiento.</strong>
                    </div>
                )}
            </div>

            {/* Tarjeta de Bypass de Carencia */}
            <div className={styles.sectionCard} style={{
                background: '#fff',
                borderRadius: 16,
                padding: '2rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                marginTop: '2rem'
            }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#333' }}>
                    ⚡ Bypass de Período de Carencia (Tiempo de Espera)
                </h3>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#666', marginBottom: 8 }}>
                        Buscar Miembro (Nombre o Email):
                    </label>
                    <input
                        type="text"
                        placeholder="Ej. Juan Pérez o juan@example.com..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (selectedMember) {
                                setSelectedMember(null);
                                setMemberPets([]);
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: '50px',
                            border: '2px solid #E2E8F0',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.9rem',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Autocomplete de miembros */}
                {searchQuery.trim() !== '' && filteredMembers.length > 0 && !selectedMember && (
                    <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '2px solid #E2E8F0',
                        borderRadius: '16px',
                        marginBottom: '1.5rem',
                        background: '#FFF'
                    }}>
                        {filteredMembers.map((member) => {
                            const name = `${member.customFields?.['first-name'] || ''} ${member.customFields?.['paternal-last-name'] || ''}`.trim() || member.supabaseFirstName || 'Sin nombre';
                            const email = member.auth?.email || member.email || 'Sin email';
                            return (
                                <div
                                    key={member.id}
                                    onClick={() => {
                                        handleSelectMember(member);
                                        setSearchQuery('');
                                    }}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #F1F5F9',
                                        transition: 'background 0.2s',
                                        fontSize: '0.9rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ fontWeight: 600, color: '#333' }}>{name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{email}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Mostrar aviso si no hay resultados */}
                {searchQuery.trim() !== '' && filteredMembers.length === 0 && !selectedMember && (
                    <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '0.85rem',
                        background: '#F8FAFC',
                        borderRadius: '12px',
                        border: '1px dashed #CBD5E1',
                        marginBottom: '1.5rem'
                    }}>
                        No se encontraron miembros para "{searchQuery}"
                    </div>
                )}

                {/* Miembro Seleccionado y sus Mascotas */}
                {selectedMember && (
                    <div style={{
                        background: '#F8FAFC',
                        borderRadius: 16,
                        padding: '1.5rem',
                        border: '2px solid #E2E8F0',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Miembro Seleccionado</div>
                                <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '1rem', marginTop: 2 }}>
                                    {`${selectedMember.customFields?.['first-name'] || ''} ${selectedMember.customFields?.['paternal-last-name'] || ''}`.trim() || selectedMember.supabaseFirstName || 'Sin nombre'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{selectedMember.auth?.email || selectedMember.email}</div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedMember(null);
                                    setMemberPets([]);
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.85rem'
                                }}
                            >
                                Cambiar
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569', marginBottom: '0.75rem' }}>Mascotas asociadas:</div>

                            {isLoadingPets ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#666', fontSize: '0.85rem' }}>
                                    ⏳ Cargando mascotas...
                                </div>
                            ) : memberPets.length === 0 ? (
                                <div style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                                    No hay mascotas registradas para este miembro.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {memberPets.map((pet) => {
                                        const carenciaEnd = pet.waiting_period_end ? new Date(pet.waiting_period_end) : null;
                                        const now = new Date();
                                        const isActive = carenciaEnd ? now >= carenciaEnd : false;

                                        let diffTime = carenciaEnd ? carenciaEnd.getTime() - now.getTime() : 0;
                                        const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                                        return (
                                            <div key={pet.id} style={{
                                                background: '#FFF',
                                                borderRadius: 12,
                                                padding: '1rem',
                                                border: '1px solid #E2E8F0',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>
                                                        {pet.name} {pet.pet_type === 'cat' ? '🐱' : '🐶'}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>
                                                        Raza: {pet.is_mixed_breed ? 'Mestizo' : pet.breed} | Estado: <span style={{
                                                            fontWeight: 600,
                                                            color: pet.status === 'approved' ? '#10B981' : pet.status === 'pending' ? '#F59E0B' : '#EF4444'
                                                        }}>{pet.status === 'approved' ? 'Aprobada' : pet.status === 'pending' ? 'Pendiente' : pet.status}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                                                        Carencia: <span style={{
                                                            fontWeight: 600,
                                                            color: isActive ? '#10B981' : '#F59E0B'
                                                        }}>{isActive ? 'Terminada (Activa)' : `En espera (${daysRemaining} días restantes)`}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleBypassCarencia(pet.id)}
                                                    disabled={bypassingPetId === pet.id}
                                                    style={{
                                                        background: '#FE8F15',
                                                        color: '#FFF',
                                                        border: '2px solid #000',
                                                        borderRadius: '50px',
                                                        padding: '6px 14px',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                        opacity: bypassingPetId === pet.id ? 0.7 : 1,
                                                        fontFamily: 'var(--font-heading)',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    {bypassingPetId === pet.id ? '...' : '⚡ Forzar Fin'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

