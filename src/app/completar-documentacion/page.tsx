/**
 * Página de Carga de Documentación Faltante de Mascotas
 *
 * Ruta: /completar-documentacion?m={memberId}&p={petIndex}&t={token}&exp={expiry}
 *
 * Esta página es el destino del enlace enviado en los correos de seguimiento.
 * Usa un token seguro (magic link) para permitir la subida de documentos
 * SIN necesidad de iniciar sesión en Memberstack.
 *
 * También soporta acceso con sesión de Memberstack activa (sin token).
 */

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './completar-documentacion.module.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type MissingDocs  = 'photo' | 'certificate' | 'both' | null;

interface PetInfo {
    name: string;
    type: string;
    petIndex: number;
    missingDocs: MissingDocs;
}

// ─── Wrapper con Suspense (requerido por Next.js 15 para useSearchParams) ────

export default function CompletarDocumentacionPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <CompletarDocumentacionContent />
        </Suspense>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

function CompletarDocumentacionContent() {
    const searchParams = useSearchParams();
    const memberId     = searchParams.get('m') || '';
    const petIndexParam = parseInt(searchParams.get('p') || '1', 10);
    const token        = searchParams.get('t') || '';
    const exp          = searchParams.get('exp') || '';

    const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authenticatedMemberId, setAuthenticatedMemberId] = useState<string>('');

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [certFile, setCertFile] = useState<File | null>(null);

    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const photoInputRef = useRef<HTMLInputElement>(null);
    const certInputRef  = useRef<HTMLInputElement>(null);

    // ── 1. Autenticación (Token magic link O Memberstack) ─────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                // RUTA A: Magic link con token (sin login)
                if (token && exp && memberId) {
                    console.log('[CompletarDocs] Verificando token de acceso directo...');

                    const verifyRes = await fetch('/api/user/verify-upload-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            memberId,
                            petIndex: petIndexParam,
                            token,
                            exp: Number(exp),
                        }),
                    });

                    const verifyData = await verifyRes.json();

                    if (!verifyData.valid) {
                        setAuthError(
                            verifyData.error === 'Enlace inválido o expirado'
                                ? 'Este enlace ha expirado. Por favor revisa tu correo más reciente o contacta a soporte.'
                                : verifyData.error || 'No se pudo verificar el enlace.'
                        );
                        setIsLoading(false);
                        return;
                    }

                    // Token válido — cargar info de mascota
                    setAuthenticatedMemberId(memberId);

                    if (!verifyData.petInfo.missingDocs) {
                        setIsSuccess(true);
                        setIsLoading(false);
                        return;
                    }

                    setPetInfo({
                        name: verifyData.petInfo.name,
                        type: verifyData.petInfo.type,
                        petIndex: petIndexParam,
                        missingDocs: verifyData.petInfo.missingDocs as MissingDocs,
                    });

                    setIsLoading(false);
                    return;
                }

                // RUTA B: Autenticación con Memberstack (usuario con sesión activa)
                console.log('[CompletarDocs] Sin token, intentando Memberstack...');
                let attempts = 0;
                while (!(window as any).$memberstackDom && attempts < 30) {
                    await new Promise(r => setTimeout(r, 200));
                    attempts++;
                }

                if (!(window as any).$memberstackDom) {
                    setAuthError('Debes iniciar sesión para acceder a esta página.');
                    setIsLoading(false);
                    return;
                }

                const { data: member } = await (window as any).$memberstackDom.getCurrentMember();
                if (!member) {
                    setAuthError('Debes iniciar sesión para acceder a esta página.');
                    setIsLoading(false);
                    return;
                }

                if (memberId && member.id !== memberId) {
                    setAuthError('No tienes permiso para editar este perfil.');
                    setIsLoading(false);
                    return;
                }

                const effectiveMemberId = memberId || member.id;
                setAuthenticatedMemberId(effectiveMemberId);

                const cf = member.customFields || {};
                const idx = petIndexParam;
                const petName = cf[`pet-${idx}-name`];

                if (!petName) {
                    setAuthError('No encontramos la mascota indicada en tu perfil.');
                    setIsLoading(false);
                    return;
                }

                const hasPhoto = !!(cf[`pet-${idx}-photo-1-url`]?.trim());
                const requiresCert = cf[`pet-${idx}-vet-certificate-required`] === 'true' || cf[`pet-${idx}-vet-certificate-required`] === true;
                const hasCert = !!(cf[`pet-${idx}-vet-certificate-url`]?.trim());

                let missing: MissingDocs = null;
                if (!hasPhoto && requiresCert && !hasCert) missing = 'both';
                else if (!hasPhoto) missing = 'photo';
                else if (requiresCert && !hasCert) missing = 'certificate';

                if (!missing) {
                    setIsSuccess(true);
                    setIsLoading(false);
                    return;
                }

                setPetInfo({
                    name: petName,
                    type: cf[`pet-${idx}-type`] || 'mascota',
                    petIndex: idx,
                    missingDocs: missing,
                });

                setIsLoading(false);
            } catch (err: any) {
                console.error('Error inicializando página:', err);
                setAuthError('Ocurrió un error al cargar tu información. Intenta de nuevo.');
                setIsLoading(false);
            }
        };

        init();
    }, [memberId, petIndexParam, token, exp]);

    // ── 2. Manejadores de archivos ────────────────────────────────────────────

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCertFile(file);
    };

    // ── 3. Subida de archivos ─────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!petInfo || !authenticatedMemberId) return;

        const needsPhoto = petInfo.missingDocs === 'photo' || petInfo.missingDocs === 'both';
        const needsCert  = petInfo.missingDocs === 'certificate' || petInfo.missingDocs === 'both';

        if (needsPhoto && !photoFile) {
            setErrorMessage('Por favor selecciona una foto para continuar.');
            return;
        }
        if (needsCert && !certFile) {
            setErrorMessage('Por favor selecciona el certificado médico para continuar.');
            return;
        }

        setErrorMessage(null);
        setUploadStatus('uploading');

        try {
            const idx = petInfo.petIndex;
            const updatedFields: Record<string, string> = {};

            // Subir foto
            if (needsPhoto && photoFile) {
                const photoFormData = new FormData();
                photoFormData.append('file', photoFile);
                photoFormData.append('petIndex', String(idx));
                photoFormData.append('memberId', authenticatedMemberId);

                const photoRes = await fetch('/api/upload/pet-photo', {
                    method: 'POST',
                    body: photoFormData,
                });
                const photoData = await photoRes.json();
                if (!photoData.success) throw new Error(photoData.error || 'Error subiendo la foto');
                updatedFields['photo_url'] = photoData.url;
            }

            // Subir certificado
            if (needsCert && certFile) {
                const certFormData = new FormData();
                certFormData.append('file', certFile);
                certFormData.append('petIndex', String(idx));
                certFormData.append('memberId', authenticatedMemberId);

                const certRes = await fetch('/api/upload/vet-certificate', {
                    method: 'POST',
                    body: certFormData,
                });
                const certData = await certRes.json();
                if (!certData.success) throw new Error(certData.error || 'Error subiendo el certificado');
                updatedFields['vet_certificate_url'] = certData.url;
            }

            // Actualizar Supabase con las URLs (via API, no requiere sesión)
            const updateRes = await fetch('/api/user/update-pet-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: authenticatedMemberId,
                    fields: updatedFields,
                    token,
                    exp: Number(exp),
                    petIndex: petIndexParam,
                }),
            });

            const updateData = await updateRes.json();
            if (!updateData.success) throw new Error(updateData.error || 'Error actualizando el perfil');

            setUploadStatus('success');
            setIsSuccess(true);

        } catch (err: any) {
            console.error('Error en subida:', err);
            setUploadStatus('error');
            setErrorMessage(err.message || 'Ocurrió un error al subir los archivos. Intenta de nuevo.');
        }
    };

    // ── 4. Pantallas ──────────────────────────────────────────────────────────

    if (isLoading) return <LoadingScreen />;

    if (authError) return <ErrorScreen message={authError} />;

    if (isSuccess) return <SuccessScreen petName={petInfo?.name || 'tu mascota'} />;

    if (!petInfo) return <ErrorScreen message="No se encontró la información de la mascota." />;

    const needsPhoto = petInfo.missingDocs === 'photo' || petInfo.missingDocs === 'both';
    const needsCert  = petInfo.missingDocs === 'certificate' || petInfo.missingDocs === 'both';

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.cardHeader}>
                    <img
                        src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6929e0aea61dcbb985e68c84_logo.svg"
                        alt="Club Pata Amiga"
                        className={styles.logo}
                    />
                    <p className={styles.headerLabel}>Perfil de mascota</p>
                </div>

                {/* Cuerpo */}
                <div className={styles.cardBody}>
                    <h1 className={styles.title}>
                        ¡Casi listo, <span className={styles.petNameHighlight}>{petInfo.name}</span>! 🐾
                    </h1>
                    <p className={styles.subtitle}>
                        Solo falta{needsPhoto && needsCert ? 'n' : ''}{' '}
                        {needsPhoto && needsCert ? 'la foto y el certificado médico' :
                         needsPhoto ? 'la foto' : 'el certificado médico'}.
                    </p>

                    <div className={styles.fieldsContainer}>

                        {/* Campo: Foto */}
                        {needsPhoto && (
                            <div className={styles.fieldGroup}>
                                <div className={styles.fieldLabel}>
                                    <span className={styles.fieldIcon} style={{ background: '#FE8F15' }}>📸</span>
                                    <div>
                                        <p className={styles.fieldTitle}>Foto de {petInfo.name}</p>
                                        <p className={styles.fieldHint}>Una foto clara donde se vea bien su carita</p>
                                    </div>
                                </div>

                                {photoPreview ? (
                                    <div className={styles.previewWrapper}>
                                        <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                                        <button
                                            type="button"
                                            className={styles.changeFileBtn}
                                            onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                        >
                                            Cambiar foto
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.uploadArea} onClick={() => photoInputRef.current?.click()}>
                                        <div className={styles.uploadIcon}>🖼️</div>
                                        <p className={styles.uploadText}>Haz clic para seleccionar una foto</p>
                                        <p className={styles.uploadHint}>JPG, PNG o HEIC · Máx. 5 MB</p>
                                    </div>
                                )}
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                    id="pet-photo-input"
                                />
                            </div>
                        )}

                        {/* Campo: Certificado */}
                        {needsCert && (
                            <div className={styles.fieldGroup}>
                                <div className={styles.fieldLabel}>
                                    <span className={styles.fieldIcon} style={{ background: '#7DD8D5' }}>📋</span>
                                    <div>
                                        <p className={styles.fieldTitle}>Certificado médico veterinario</p>
                                        <p className={styles.fieldHint}>Expedido por un médico veterinario certificado</p>
                                    </div>
                                </div>

                                <div
                                    className={`${styles.uploadArea} ${certFile ? styles.uploadAreaSuccess : ''}`}
                                    onClick={() => certInputRef.current?.click()}
                                >
                                    <div className={styles.uploadIcon}>{certFile ? '✅' : '📄'}</div>
                                    <p className={styles.uploadText}>
                                        {certFile ? certFile.name : 'Haz clic para seleccionar el certificado'}
                                    </p>
                                    <p className={styles.uploadHint}>PDF, JPG o PNG · Máx. 10 MB</p>
                                </div>
                                <input
                                    ref={certInputRef}
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={handleCertChange}
                                    style={{ display: 'none' }}
                                    id="vet-cert-input"
                                />
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {errorMessage && (
                        <div className={styles.errorBanner}>
                            ⚠️ {errorMessage}
                        </div>
                    )}

                    {/* Botón de envío */}
                    <button
                        type="button"
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={uploadStatus === 'uploading'}
                        id="submit-docs-btn"
                    >
                        {uploadStatus === 'uploading' ? (
                            <span className={styles.loadingDots}>Subiendo archivos<span>.</span><span>.</span><span>.</span></span>
                        ) : (
                            `Completar perfil de ${petInfo.name} →`
                        )}
                    </button>

                    <p className={styles.helpNote}>
                        ¿Tienes alguna duda?{' '}
                        <a href="mailto:miembros@pataamiga.mx" className={styles.helpLink}>
                            Escríbenos
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Pantallas auxiliares ─────────────────────────────────────────────────────

function LoadingScreen() {
    return (
        <div className={styles.pageWrapper}>
            <div className={styles.centeredMessage}>
                <div className={styles.spinner} />
                <p>Cargando tu perfil...</p>
            </div>
        </div>
    );
}

function ErrorScreen({ message }: { message: string }) {
    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>
                <div className={styles.cardHeader} />
                <div className={styles.cardBody} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
                    <h2 className={styles.title}>Algo salió mal</h2>
                    <p className={styles.subtitle}>{message}</p>
                    <a href="https://www.pataamiga.mx" className={styles.submitBtn} style={{ display: 'inline-block', textDecoration: 'none', marginTop: '24px' }}>
                        Ir al inicio
                    </a>
                </div>
            </div>
        </div>
    );
}

function SuccessScreen({ petName }: { petName: string }) {
    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <img
                        src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6929e0aea61dcbb985e68c84_logo.svg"
                        alt="Club Pata Amiga"
                        className={styles.logo}
                    />
                </div>
                <div className={styles.successBody}>
                    <div className={styles.successIcon}>🎉</div>
                    <h2 className={styles.successTitle}>
                        ¡Listo, {petName} está en la manada!
                    </h2>
                    <p className={styles.successSubtitle}>
                        Hemos recibido toda la documentación. Nuestro equipo la revisará
                        y te notificaremos en cuanto esté todo aprobado.
                    </p>
                    <a
                        href="https://www.pataamiga.mx/pets/pet-waiting-period"
                        className={styles.successBtn}
                        id="go-to-home-btn"
                    >
                        Ver mis mascotas →
                    </a>
                    <a href="https://www.pataamiga.mx" className={styles.secondaryLink}>
                        Ir al inicio
                    </a>
                </div>
            </div>
        </div>
    );
}
