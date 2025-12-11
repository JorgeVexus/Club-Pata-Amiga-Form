'use client';

import React from 'react';
import styles from './MemberDetailModal.module.css';

interface Pet {
    name: string;
    breed: string;
    age: string;
    type: string;
}

interface MemberDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: any; // Using any for flexibility with MemberStack data structure
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export default function MemberDetailModal({ isOpen, onClose, member, onApprove, onReject }: MemberDetailModalProps) {
    if (!isOpen || !member) return null;

    const fields = member.customFields || {};

    // Extract pets
    const pets: (Pet & { photos: string[], certificate?: string })[] = [];
    for (let i = 1; i <= 3; i++) {
        if (fields[`pet-${i}-name`]) {
            const petPhotos = [];
            if (fields[`pet-${i}-photo-1-url`]) petPhotos.push(fields[`pet-${i}-photo-1-url`]);
            if (fields[`pet-${i}-photo-2-url`]) petPhotos.push(fields[`pet-${i}-photo-2-url`]);

            pets.push({
                name: fields[`pet-${i}-name`],
                breed: fields[`pet-${i}-breed`],
                age: fields[`pet-${i}-age`],
                type: fields[`pet-${i}-type`] || 'Mascota',
                photos: petPhotos,
                certificate: fields[`pet-${i}-vet-certificate-url`]
            });
        }
    }

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
                        <div className={styles.grid}>
                            {pets.map((pet, index) => (
                                <div key={index} className={styles.petCardFull}>
                                    <div className={styles.petHeader}>
                                        <div className={styles.petAvatar}>
                                            {pet.type === 'Gato' ? '🐱' : '🐶'}
                                        </div>
                                        <div className={styles.petInfo}>
                                            <h4>{pet.name}</h4>
                                            <div className={styles.petBreed}>{pet.breed} • {pet.age} años</div>
                                        </div>
                                    </div>

                                    {/* Pet Photos */}
                                    <div className={styles.petPhotosSection}>
                                        <span className={styles.petLabel}>Fotos de la mascota:</span>
                                        <div className={styles.petPhotosGrid}>
                                            {pet.photos.map((photo, i) => (
                                                <div key={i} className={styles.petPhotoContainer}>
                                                    <img src={photo} alt={`${pet.name} ${i + 1}`} className={styles.petThumb} />
                                                    <div className={styles.photoActions}>
                                                        <a href={photo} target="_blank" rel="noopener noreferrer">Ver</a>
                                                        <a
                                                            href="#"
                                                            onClick={(e) => handleDownload(e, photo, `${pet.name}-foto-${i + 1}`)}
                                                        >
                                                            Bajar
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                            {pet.photos.length === 0 && <span className={styles.noData}>Sin fotos</span>}
                                        </div>
                                    </div>

                                    {/* Vet Certificate */}
                                    {pet.certificate && (
                                        <div className={styles.certificateSection}>
                                            <span className={styles.petLabel}>Certificado Médico/Cartilla:</span>
                                            <div className={styles.documentCardSmall}>
                                                <span className={styles.documentIcon}>🩺</span>
                                                <div className={styles.documentInfo}>Documento</div>
                                                <a href={pet.certificate} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>Ver</a>
                                                <a
                                                    href="#"
                                                    onClick={(e) => handleDownload(e, pet.certificate!, `${pet.name}-certificado`)}
                                                    className={styles.linkButton}
                                                >
                                                    Descargar
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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
