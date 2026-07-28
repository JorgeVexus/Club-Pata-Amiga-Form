'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRegistrationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const form = e.target as any;
        const data = {
            firstName: form.firstName.value,
            lastName: form.lastName.value,
            email: form.email.value,
            password: form.password.value,
            secretCode: form.secretCode.value
        };

        try {
            const response = await fetch('/api/admin/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                setSuccess(true);
                // Optional: Redirect after delay
                setTimeout(() => {
                    router.push('/admin/login');
                }, 2000);
            } else {
                setError(result.error || 'Error al registrar.');
            }

        } catch (err) {
            console.error(err);
            setError('Error de conexión.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ecfdf5' }}>
                <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h2 style={{ color: '#065f46', marginBottom: '0.5rem' }}>¡Registro Exitoso!</h2>
                    <p style={{ color: '#047857' }}>Tu cuenta de Admin ha sido creada.</p>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f3f4f6',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '450px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#111827' }}>Registro Admin 🔐</h1>
                    <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>Acceso exclusivo para personal</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        border: '1px solid #fecaca'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Nombre(s)</label>
                            <input
                                type="text"
                                name="firstName"
                                required
                                placeholder="Ej. Juan"
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Apellido Paterno</label>
                            <input
                                type="text"
                                name="lastName"
                                required
                                placeholder="Ej. Pérez"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Email Corporativo</label>
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="nombre@pataamiga.com"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={8}
                            placeholder="••••••••"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4f46e5', marginBottom: '0.5rem' }}>Código Secreto de Acceso</label>
                        <input
                            type="password"
                            name="secretCode"
                            required
                            placeholder="Ingresa el código maestro"
                            style={{ ...inputStyle, borderColor: '#818cf8', background: '#eef2ff' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            background: '#111827',
                            color: 'white',
                            padding: '0.875rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '1rem',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {isLoading ? 'Registrando...' : 'Crear Cuenta Admin'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    <a href="/admin/login" style={{ color: '#4b5563', textDecoration: 'none' }}>
                        ¿Ya tienes cuenta? <span style={{ color: '#2563eb', fontWeight: 500 }}>Inicia sesión</span>
                    </a>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const
};
