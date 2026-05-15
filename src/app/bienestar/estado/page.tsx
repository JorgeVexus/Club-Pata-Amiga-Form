'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';
import { WellnessCenter } from '@/types/wellness.types';
import WellnessComplementaryForm from '@/components/WellnessForm/WellnessComplementaryForm';

function LoadingState() {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Validando tu acceso...</p>
        </div>
    );
}

function StatusContent() {
    const searchParams = useSearchParams();
    const memberId = searchParams.get('memberId');
    const [center, setCenter] = useState<WellnessCenter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);

    const [isAppealing, setIsAppealing] = useState(false);
    const [appealMessage, setAppealMessage] = useState('');
    const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!memberId) {
                // Intentar obtener de Memberstack si no viene en la URL
                if (window.$memberstackDom) {
                    const member = await window.$memberstackDom.getCurrentMember();
                    if (member?.data) {
                        loadCenterData(member.data.id);
                        return;
                    }
                }
                setIsLoading(false);
                return;
            }
            loadCenterData(memberId);
        };

        const loadCenterData = async (id: string) => {
            try {
                const res = await fetch(`/api/wellness/me?memberstack_id=${id}`);
                const data = await res.json();
                if (data.success) {
                    setCenter(data.data);
                    
                    // Verificar si es la primera vez que ve la aprobación
                    if (data.data.status === 'approved') {
                        const welcomeKey = `welcome_shown_${data.data.id}`;
                        if (!localStorage.getItem(welcomeKey)) {
                            setShowWelcome(true);
                            localStorage.setItem(welcomeKey, 'true');
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();
    }, [memberId]);

    if (isLoading) return <LoadingState />;

    if (!center) {
        return (
            <div className={styles.errorCard}>
                <h2>No encontramos tu registro</h2>
                <p>Si acabas de registrarte, espera unos segundos e intenta de nuevo.</p>
                <button onClick={() => window.location.href = '/bienestar/registro'}>Registrar Centro</button>
            </div>
        );
    }

    const handleAppeal = async () => {
        if (!appealMessage.trim()) return;
        setIsSubmittingAppeal(true);
        try {
            const res = await fetch('/api/wellness/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberstack_id: center.memberstack_id,
                    appeal_message: appealMessage,
                    status: 'appealed'
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Tu apelación ha sido enviada. Revisaremos tu caso pronto.');
                window.location.reload();
            }
        } catch (err) {
            alert('Error al enviar apelación');
        } finally {
            setIsSubmittingAppeal(false);
        }
    };

    const renderStatus = () => {
        switch (center.status) {
            case 'pending':
            case 'appealed':
                return (
                    <div className={styles.statusBox}>
                        <div className={`${styles.badge} ${styles.pending}`}>
                            {center.status === 'appealed' ? 'APELACIÓN EN REVISIÓN' : 'EN REVISIÓN'}
                        </div>
                        <h2>{center.status === 'appealed' ? 'Tu apelación está siendo revisada' : 'Tu solicitud está siendo procesada'}</h2>
                        <p>Nuestro equipo está validando tu información. Mientras tanto, puedes completar tu perfil:</p>
                        <ComplementaryInfoForm center={center} />
                    </div>
                );
            case 'approved':
                return (
                    <div className={styles.statusBox}>
                        <div className={`${styles.badge} ${styles.approved}`}>APROBADO</div>
                        <h2>¡Bienvenido a la manada!</h2>
                        <p>Tu centro ha sido aprobado. Ya puedes aparecer en el directorio y recibir peludos.</p>
                        <ComplementaryInfoForm center={center} />
                    </div>
                );
            case 'rejected':
                return (
                    <div className={styles.statusBox}>
                        <div className={`${styles.badge} ${styles.rejected}`}>RECHAZADO</div>
                        <h2>Lo sentimos</h2>
                        <p>Tu solicitud no fue aprobada en esta ocasión.</p>
                        {center.rejection_reason && (
                            <div className={styles.reasonBox}>
                                <strong>Motivo:</strong> {center.rejection_reason}
                            </div>
                        )}
                        
                        {!isAppealing ? (
                            <>
                                <p>¿Crees que es un error? Puedes apelar esta decisión detallando tus motivos.</p>
                                <button 
                                    className={styles.secondaryButton} 
                                    onClick={() => setIsAppealing(true)}
                                >
                                    Apelar decisión
                                </button>
                            </>
                        ) : (
                            <div className={styles.appealForm}>
                                <textarea 
                                    className={styles.textarea}
                                    placeholder="Escribe aquí los motivos de tu apelación..."
                                    value={appealMessage}
                                    onChange={(e) => setAppealMessage(e.target.value)}
                                    disabled={isSubmittingAppeal}
                                />
                                <div className={styles.buttonGroup}>
                                    <button 
                                        className={styles.primaryButton}
                                        onClick={handleAppeal}
                                        disabled={isSubmittingAppeal || !appealMessage.trim()}
                                    >
                                        {isSubmittingAppeal ? 'Enviando...' : 'Enviar Apelación'}
                                    </button>
                                    <button 
                                        className={styles.cancelButton}
                                        onClick={() => setIsAppealing(false)}
                                        disabled={isSubmittingAppeal}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'cancelled':
                return (
                    <div className={styles.statusBox}>
                        <div className={`${styles.badge} ${styles.cancelled}`}>CANCELADO</div>
                        <h2>Tu cuenta ha sido desactivada</h2>
                        <p>Lamentamos que hayas decidido salir de la manada.</p>
                        <p>Para reactivar tu cuenta, por favor contáctanos.</p>
                        <button onClick={() => window.location.href = 'mailto:soporte@pataamiga.com'} className={styles.primaryButton}>Contactar Soporte</button>
                    </div>
                );
            default:
                return <div>Estado desconocido</div>;
        }
    };

    return (
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.container}>
                {renderStatus()}
            </div>

            {showWelcome && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.celebrationIcon}>🎉</div>
                        <h2>¡Felicidades {center.establishment_name}!</h2>
                        <p>Tu solicitud para ser parte de nuestra red de Centros de Bienestar ha sido <strong>aprobada</strong>.</p>
                        <p>A partir de este momento ya puedes visualizar el panel de control para administrar solicitudes de miembros y gestionar citas.</p>
                        <button 
                            className={styles.primaryButton}
                            onClick={() => setShowWelcome(false)}
                        >
                            Comenzar ahora
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ComplementaryInfoForm({ center }: { center: WellnessCenter }) {
    return (
        <div className={styles.complementaryForm}>
            <h3>Información Complementaria</h3>
            <p>Ayúdanos a que los miembros te encuentren más rápido.</p>
            <WellnessComplementaryForm center={center} />
        </div>
    );
}

export default function WellnessStatusPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <StatusContent />
        </Suspense>
    );
}
