'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/UI/BrandLogo';
import TextInput from '@/components/FormFields/TextInput';
import FileUpload from '@/components/FormFields/FileUpload';
import styles from './page.module.css';

export default function AmbassadorReUploadPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [rfc, setRfc] = useState('');
    const [ineFront, setIneFront] = useState<File | null>(null);
    const [ineBack, setIneBack] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');

        try {
            // 1. Subir archivos
            const uploadFiles = async (file: File, type: string) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', type);
                const res = await fetch('/api/upload/ambassador-doc', {
                    method: 'POST',
                    body: formData
                });
                return res.json();
            };

            if (!ineFront || !ineBack) {
                throw new Error('Debes subir ambos lados de tu INE');
            }

            const [frontRes, backRes] = await Promise.all([
                uploadFiles(ineFront, 'ambassador_ine_front'),
                uploadFiles(ineBack, 'ambassador_ine_back')
            ]);

            if (!frontRes.success || !backRes.success) {
                throw new Error('Error al subir los archivos. Por favor intenta de nuevo.');
            }

            // 2. Actualizar registro
            const updateRes = await fetch('/api/ambassadors/re-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    rfc,
                    ine_front_url: frontRes.url,
                    ine_back_url: backRes.url
                })
            });

            const updateData = await updateRes.json();

            if (!updateData.success) {
                throw new Error(updateData.error || 'Error al actualizar los documentos');
            }

            setStatus('success');
        } catch (error: any) {
            console.error('Re-upload error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Ocurrió un error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'success') {
        return (
            <div className={styles.pageBackground}>
                <BrandLogo />
                <div className={styles.container}>
                    <div className={styles.successCard}>
                        <h2>¡Gracias!</h2>
                        <p>Tus documentos han sido actualizados exitosamente.</p>
                        <p>Ya podemos continuar con la revisión de tu perfil.</p>
                        <button onClick={() => router.push('/')} className={styles.btnPrimary}>
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1>Actualiza tus documentos</h1>
                    <p className={styles.intro}>
                        Hubo un problema técnico al guardar tus documentos durante el registro.
                        Por favor, proporciónanos tu información para completar tu perfil.
                    </p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <TextInput
                                label="Correo electrónico con el que te registraste"
                                name="email"
                                value={email}
                                onChange={setEmail}
                                required
                                placeholder="tu@email.com"
                            />
                            <TextInput
                                label="Tu RFC"
                                name="rfc"
                                value={rfc}
                                onChange={(val) => setRfc(val.toUpperCase())}
                                required
                                placeholder="XAXX010101000"
                                maxLength={13}
                            />
                        </div>

                        <div className={styles.uploadGroup}>
                            <FileUpload
                                label="Frente de tu INE"
                                name="ineFront"
                                accept="image/*,.pdf"
                                maxSize={5}
                                onChange={(files) => setIneFront(files[0] || null)}
                                required
                                instruction="Asegúrate de que sea legible"
                            />
                            <FileUpload
                                label="Reverso de tu INE"
                                name="ineBack"
                                accept="image/*,.pdf"
                                maxSize={5}
                                onChange={(files) => setIneBack(files[0] || null)}
                                required
                                instruction="Asegúrate de que sea legible"
                            />
                        </div>

                        {status === 'error' && (
                            <div className={styles.errorBanner}>{errorMessage}</div>
                        )}

                        <button
                            type="submit"
                            className={styles.btnSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Enviando...' : 'Actualizar documentos'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
