'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Don't auto-redirect users who are already logged in
        // This allows them to:
        // 1. Switch accounts without being forced back to dashboard
        // 2. Explicitly choose to login (better UX)
        // The redirect only happens AFTER they submit the login form
    }, []);

    const checkExistingSession = async () => {
        if (typeof window !== 'undefined' && window.$memberstackDom) {
            try {
                const member = await window.$memberstackDom.getCurrentMember();
                if (member?.data) {
                    verifyAndRedirect(member.data.id);
                }
            } catch (e) {
                // Not logged in or error
            }
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const email = (e.target as any).email.value;
        const password = (e.target as any).password.value;

        try {
            if (!window.$memberstackDom) {
                throw new Error('Memberstack not loaded');
            }

            console.log('Attempting login...');
            const response = await window.$memberstackDom.loginMemberEmailPassword({
                email,
                password
            });
            console.log('Login Response:', response);

            // Check for various response structures (v1 vs v2 inconsistency)
            const memberId =
                response.data?.member?.id ||
                response.data?.id ||
                response.member?.id ||
                response.id;

            if (memberId) {
                console.log('ID Found:', memberId);
                await verifyAndRedirect(memberId);
            } else {
                console.error('No ID found in response:', response);
                throw new Error(`No se pudo obtener el ID del usuario. Estructura recibida: ${JSON.stringify(response).slice(0, 100)}...`);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al iniciar sesión');
            setIsLoading(false);
        }
    };

    const verifyAndRedirect = async (memberstackId: string) => {
        try {
            const response = await fetch('/api/admin/me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberstackId })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.isAdmin) {
                    router.push('/admin/dashboard');
                } else {
                    setError('No tienes permisos de administrador. Por favor cierra sesión e intenta con una cuenta admin.');
                    setIsLoading(false);
                    // Don't auto-logout - let user manually logout to try another account
                }
            } else {
                console.error('API Verification Failed:', data);
                setError(data.error || `Error verificando permisos (${response.status})`);
                setIsLoading(false);
            }
        } catch (e) {
            console.error(e);
            setError('Error de conexión con el servidor.');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#f3f4f6',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Admin Portal 🛡️</h1>
                    <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>Inicia sesión para acceder</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            background: '#000',
                            color: 'white',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            fontWeight: 500,
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Verificando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
