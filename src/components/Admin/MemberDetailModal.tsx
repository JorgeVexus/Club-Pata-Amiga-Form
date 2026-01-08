'use client';

import React, { useState, useEffect } from 'react';
import styles from './MemberDetailModal.module.css';
import { getPetsByUserId } from '@/app/actions/user.actions';

interface Pet {
    id: string;
    name: string;
    breed: string;
    breed_size: string;
    age?: string;
    type?: string;
    status: 'pending' | 'approved' | 'action_required' | 'rejected';
    admin_notes?: string;
    photo_url?: string;
    vet_certificate_url?: string;
}

interface MemberDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: any; // Using any for flexibility with MemberStack data structure
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export default function MemberDetailModal({ isOpen, onClose, member, onApprove, onReject }: MemberDetailModalProps) {
    const [pets, setPets] = useState<Pet[]>([]);
    const [loadingPets, setLoadingPets] = useState(false);
    const [updatingPetId, setUpdatingPetId] = useState<string | null>(null);
    const [petNotes, setPetNotes] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen && member) {
            loadPets();
        }
    }, [isOpen, member]);

    async function loadPets() {
        setLoadingPets(true);
        try {
            const result = await getPetsByUserId(member.id);
            if (result.success && result.pets) {
                setPets(result.pets);
                // Inicializar notas
                const notes: Record<string, string> = {};
                result.pets.forEach((p: any) => {
                    notes[p.id] = p.admin_notes || '';
                });
                setPetNotes(notes);
            }
        } catch (error) {
            console.error('Error loading pets:', error);
        } finally {
            setLoadingPets(false);
        }
    }

    async function handlePetStatusUpdate(petId: string, status: string) {
        setUpdatingPetId(petId);
        try {
            const response = await fetch(`/api/admin/members/${member.id}/pets/${petId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    adminNotes: petNotes[petId],
                    adminId: 'current_admin' // TODO: Get from auth
                })
            });

            const data = await response.json();
            if (data.success) {
                // Actualizar localmente
                setPets(prev => prev.map(p => p.id === petId ? { ...p, status: status as any, admin_notes: petNotes[petId] } : p));
                alert(`Mascota actualizada a ${status}`);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error updating pet:', error);
            alert('Error de conexión');
        } finally {
            setUpdatingPetId(null);
        }
    }

    if (!isOpen || !member) return null;

    const fields = member.customFields || {};

    // Force download handler
    const handleDownload = async (e: React.MouseEvent, url: string, filename: string) => {
        e.preventDefault();
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab if fetch fails (e.g. CORS)
            window.open(url, '_blank');
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Detalles de la Solicitud</h2>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Appeal Info (If applicable) */}
                    {fields['approval-status'] === 'appealed' && (
                        <div className={`${styles.section} ${styles.appealSection}`}>
                            <h3 className={styles.sectionTitle}>📩 Apelación en Proceso</h3>
                            <div className={styles.appealContent}>
                                <p className={styles.appealMessage}>"{fields['appeal-message'] || 'Sin mensaje registrado.'}"</p>
                                <span className={styles.appealDate}>
                                    Fecha: {fields['appealed-at'] ? new Date(fields['appealed-at']).toLocaleDateString() : 'Desconocida'}
                                </span>
                            </div>

                            {/* Admin Response Area */}
                            <div className={styles.adminResponseArea}>
                                <label className={styles.responseLabel}>Responder al usuario:</label>
                                <textarea
                                    className={styles.responseTextarea}
                                    placeholder="Indica al usuario qué documentos faltan o por qué se mantiene el rechazo..."
                                    value={petNotes['appeal_response'] || ''}
                                    onChange={(e) => setPetNotes({ ...petNotes, ['appeal_response']: e.target.value })}
                                />
                                <button
                                    className={styles.sendResponseBtn}
                                    onClick={async () => {
                                        const msg = petNotes['appeal_response'];
                                        if (!msg?.trim()) return alert('Escribe un mensaje primero.');

                                        try {
                                            const res = await fetch(`/api/admin/members/${member.id}/appeal-response`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    message: msg,
                                                    adminId: 'current_admin'
                                                })
                                            });
                                            if (res.ok) {
                                                alert('Mensaje enviado al usuario.');
                                                setPetNotes({ ...petNotes, ['appeal_response']: '' });
                                            } else {
                                                alert('Error al enviar el mensaje.');
                                            }
                                        } catch (e) {
                                            alert('Error de conexión.');
                                        }
                                    }}
                                >
                                    Enviar Mensaje al Usuario 📩
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Personal Info */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Información Personal</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <span className={styles.label}>Nombre Completo</span>
                                <span className={styles.value}>{fields['first-name']} {fields['last-name']}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Email</span>
                                <span className={styles.value}>{member.auth?.email}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Teléfono</span>
                                <span className={styles.value}>{fields['phone'] || 'No registrado'}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>CURP</span>
                                <span className={styles.value}>{fields['curp'] || 'No registrado'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Dirección</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <span className={styles.label}>Calle y Número</span>
                                <span className={styles.value}>{fields['address']}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Colonia</span>
                                <span className={styles.value}>{fields['colony']}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Ciudad/Estado</span>
                                <span className={styles.value}>{fields['city']}, {fields['state']}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Código Postal</span>
                                <span className={styles.value}>{fields['postal-code']}</span>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Documentos Personales</h3>
                        <div className={styles.grid}>
                            {fields['ine-front-url'] && (
                                <div className={styles.documentCard}>
                                    <span className={styles.documentIcon}>🆔</span>
                                    <div className={styles.documentInfo}>
                                        <div className={styles.documentName}>INE (Frente)</div>
                                    </div>
                                    <div className={styles.docActions}>
                                        <a href={fields['ine-front-url']} target="_blank" rel="noopener noreferrer" className={styles.viewDocButton}>Ver</a>
                                        <a
                                            href="#"
                                            onClick={(e) => handleDownload(e, fields['ine-front-url'], 'ine-frente')}
                                            className={styles.viewDocButton}
                                        >
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                            )}
                            {fields['ine-back-url'] && (
                                <div className={styles.documentCard}>
                                    <span className={styles.documentIcon}>🆔</span>
                                    <div className={styles.documentInfo}>
                                        <div className={styles.documentName}>INE (Reverso)</div>
                                    </div>
                                    <div className={styles.docActions}>
                                        <a href={fields['ine-back-url']} target="_blank" rel="noopener noreferrer" className={styles.viewDocButton}>Ver</a>
                                        <a
                                            href="#"
                                            onClick={(e) => handleDownload(e, fields['ine-back-url'], 'ine-reverso')}
                                            className={styles.viewDocButton}
                                        >
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                            )}
                            {fields['proof-of-address-url'] && (
                                <div className={styles.documentCard}>
                                    <span className={styles.documentIcon}>📄</span>
                                    <div className={styles.documentInfo}>
                                        <div className={styles.documentName}>Comprobante de Domicilio</div>
                                    </div>
                                    <div className={styles.docActions}>
                                        <a href={fields['proof-of-address-url']} target="_blank" rel="noopener noreferrer" className={styles.viewDocButton}>Ver</a>
                                        <a
                                            href="#"
                                            onClick={(e) => handleDownload(e, fields['proof-of-address-url'], 'comprobante-domicilio')}
                                            className={styles.viewDocButton}
                                        >
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pets */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Mascotas Registradas ({pets.length})</h3>
                        {loadingPets ? (
                            <div className={styles.loading}>Cargando mascotas...</div>
                        ) : (
                            <div className={styles.grid}>
                                {pets.map((pet) => (
                                    <div key={pet.id} className={styles.petCardFull}>
                                        <div className={styles.petHeader}>
                                            <div className={styles.petAvatar}>🐶</div>
                                            <div className={styles.petInfo}>
                                                <h4>{pet.name}</h4>
                                                <div className={styles.petBreed}>{pet.breed} • {pet.breed_size}</div>
                                            </div>
                                            <div className={`${styles.statusBadge} ${styles[pet.status]}`}>
                                                {pet.status === 'pending' ? 'Pendiente' :
                                                    pet.status === 'approved' ? 'Aprobada' :
                                                        pet.status === 'rejected' ? 'Rechazada' : 'Acción Requerida'}
                                            </div>
                                        </div>

                                        {/* Pet Photo Section */}
                                        <div className={styles.petPhotosSection}>
                                            <div className={styles.petPhotosGrid}>
                                                {/* Mostrar fotos del objeto pet (Supabase) */}
                                                {[pet.photo_url, (pet as any).photo2_url].filter(Boolean).map((url, idx) => (
                                                    <div key={idx} className={styles.petPhotoContainer}>
                                                        <img
                                                            src={url}
                                                            alt={`${pet.name} - ${idx + 1}`}
                                                            className={styles.petThumb}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png';
                                                                (e.target as HTMLImageElement).style.opacity = '0.5';
                                                            }}
                                                        />
                                                        <div className={styles.photoActions}>
                                                            <a href={url} target="_blank" rel="noopener noreferrer">Ver #{idx + 1}</a>
                                                            <a href="#" onClick={(e) => handleDownload(e, url!, `${pet.name}-foto-${idx + 1}`)}>Bajar</a>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Fallback si no hay fotos en el objeto pet, buscar en customFields de Memberstack */}
                                                {!pet.photo_url && !((pet as any).photo2_url) && (
                                                    (() => {
                                                        const pIdx = pets.indexOf(pet) + 1;
                                                        const mUrl1 = fields[`pet-${pIdx}-photo-1-url`];
                                                        const mUrl2 = fields[`pet-${pIdx}-photo-2-url`];

                                                        if (mUrl1 || mUrl2) {
                                                            return [mUrl1, mUrl2].filter(Boolean).map((url, idx) => (
                                                                <div key={`m-${idx}`} className={styles.petPhotoContainer}>
                                                                    <img
                                                                        src={url}
                                                                        alt={`${pet.name} (MS) - ${idx + 1}`}
                                                                        className={styles.petThumb}
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png';
                                                                            (e.target as HTMLImageElement).style.opacity = '0.5';
                                                                        }}
                                                                    />
                                                                    <div className={styles.photoActions}>
                                                                        <a href={url} target="_blank" rel="noopener noreferrer">Ver MS #{idx + 1}</a>
                                                                    </div>
                                                                </div>
                                                            ));
                                                        }

                                                        return (
                                                            <div className={styles.noPhotoPlaceholder}>
                                                                <span>📷 Sin fotos detectadas</span>
                                                                <p style={{ fontSize: '0.6rem', margin: '5px 0 0' }}>Sync Error o falta de archivos.</p>
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                            </div>
                                        </div>

                                        {/* Admin Actions per Pet */}
                                        <div className={styles.petAdminActions}>
                                            <div className={styles.notesField}>
                                                <label>Notas del Administrador:</label>
                                                <textarea
                                                    value={petNotes[pet.id] || ''}
                                                    onChange={(e) => setPetNotes({ ...petNotes, [pet.id]: e.target.value })}
                                                    placeholder="Razón del rechazo o info faltante..."
                                                    className={styles.notesInput}
                                                />
                                            </div>
                                            <div className={styles.petButtons}>
                                                {pet.status !== 'approved' && (
                                                    <button
                                                        className={styles.petApproveBtn}
                                                        onClick={() => handlePetStatusUpdate(pet.id, 'approved')}
                                                        disabled={updatingPetId === pet.id}
                                                    >
                                                        {updatingPetId === pet.id ? '...' : 'Aprobar'}
                                                    </button>
                                                )}
                                                {pet.status !== 'action_required' && (
                                                    <button
                                                        className={styles.petInfoBtn}
                                                        onClick={() => handlePetStatusUpdate(pet.id, 'action_required')}
                                                        disabled={updatingPetId === pet.id}
                                                    >
                                                        {updatingPetId === pet.id ? '...' : 'Solicitar Info'}
                                                    </button>
                                                )}
                                                {pet.status !== 'rejected' && (
                                                    <button
                                                        className={styles.petRejectBtn}
                                                        onClick={() => handlePetStatusUpdate(pet.id, 'rejected')}
                                                        disabled={updatingPetId === pet.id}
                                                    >
                                                        {updatingPetId === pet.id ? '...' : 'Rechazar'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={styles.footer}>
                    <button
                        className={`${styles.actionButton} ${styles.approveButton}`}
                        onClick={() => onApprove(member.id)}
                    >
                        Aprobar Solicitud
                    </button>
                    <button
                        className={`${styles.actionButton} ${styles.rejectButton}`}
                        onClick={() => onReject(member.id)}
                    >
                        Rechazar Solicitud
                    </button>
                </div>
            </div>
        </div>
    );
}
