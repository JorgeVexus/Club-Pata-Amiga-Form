'use client';

import React from 'react';
import styles from './reporte.module.css';

const ReporteMVP = () => {
    return (
        <div className={styles.reportContainer}>
            {/* Header section with Logo */}
            <header className={styles.header}>
                <img 
                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6930687c8f64d3b129a9cece_PATA_AMIGA_LOGOTIPO_EDITABLE-02.webp" 
                    alt="Pata Amiga Logo" 
                    className={styles.logo}
                />
                <h1 className={styles.mainTitle}>Reporte de Implementación MVP</h1>
                <p className={styles.subtitle}>
                    Resumen técnico y de negocio de la infraestructura desplegada para el lanzamiento de <span className={styles.accent}>Club Pata Amiga</span>.
                </p>
            </header>

            {/* Sticky Navigation */}
            <nav className={styles.nav}>
                <a href="#memberstack" className={styles.navLink}>Memberstack</a>
                <a href="#registro" className={styles.navLink}>Flujo de Registro</a>
                <a href="#dashboards" className={styles.navLink}>Dashboards</a>
                <a href="#infraestructura" className={styles.navLink}>Infraestructura</a>
                <a href="#integraciones" className={styles.navLink}>Integraciones</a>
            </nav>

            <main className={styles.contentBody}>
                {/* 1. Memberstack Section */}
                <section id="memberstack" className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🫀</span>
                        Memberstack: El Corazón del Sistema
                    </h2>
                    <p>
                        Memberstack actúa como el motor central de identidad y gestión de datos. No solo maneja la autenticación, sino que orquesta toda la metadata del usuario y sus mascotas.
                    </p>
                    <div className={styles.cardGrid}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Gestión de Identidad</h3>
                            <p className={styles.cardText}>
                                Autenticación segura y manejo de sesiones persistentes. Integración transparente entre Webflow (frontend de marketing) y Next.js (lógica de negocio).
                            </p>
                        </div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>77 Campos Personalizados</h3>
                            <p className={styles.cardText}>
                                Hemos configurado una arquitectura de datos extensa que incluye 20 campos para el humano y 57 campos distribuidos en hasta 3 mascotas.
                            </p>
                        </div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Sincronización Bidireccional</h3>
                            <p className={styles.cardText}>
                                Los cambios realizados en el Dashboard de Admin se reflejan instantáneamente en el perfil de Memberstack, activando disparadores automáticos en la webapp.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2. Registro Flow Section */}
                <section id="registro" className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>📋</span>
                        Flujo de Registro Detallado (UX)
                    </h2>
                    <p>
                        Un proceso de 5 pasos diseñado para maximizar la conversión y asegurar la integridad de los datos legales requeridos.
                    </p>
                    <div className={styles.list}>
                        <div className={styles.listItem}>
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Paso 1</span>
                            <strong>Creación de Cuenta:</strong> Registro inicial vía Email/Password o Social Auth. Notificación inmediata al CRM como "Lead".
                        </div>
                        <div className={styles.listItem}>
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Paso 2</span>
                            <strong>Datos de Mascota (Básico):</strong> Primer contacto emocional. Nombre, tipo y edad. Se guarda en Supabase para persistencia.
                        </div>
                        <div className={styles.listItem}>
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Paso 3</span>
                            <strong>Selección de Plan & Pago:</strong> Integración con Stripe Checkout. Incluye <strong>Lógica de Verificación Superior</strong> que impide avanzar sin un pago exitoso verificado.
                        </div>
                        <div className={styles.listItem}>
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Paso 4</span>
                            <strong>Perfil del Usuario:</strong> Recolección de datos fiscales y legales. Integración con API de Códigos Postales y subida de INE a bucket privado.
                        </div>
                        <div className={styles.listItem}>
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Paso 5</span>
                            <strong>Registro Completo de Mascota:</strong> Subida de fotos y certificados veterinarios. Cálculo automatizado del <u>período de carencia</u>.
                        </div>
                    </div>
                </section>

                {/* 3. Dashboards Section */}
                <section id="dashboards" className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🖥️</span>
                        Dashboards e Interfaces
                    </h2>
                    <div className={styles.cardGrid}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Panel de Administración</h3>
                            <ul className={styles.cardText}>
                                <li>Gestión centralizada de miembros.</li>
                                <li>Sistema de Aprobación/Rechazo de documentos con feedback visual.</li>
                                <li>Visualización de métricas clave en tiempo real.</li>
                            </ul>
                        </div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Dashboard de Miembros</h3>
                            <ul className={styles.cardText}>
                                <li>Vista de estado de protección (Activa vs Carencia).</li>
                                <li>Gestión de hasta 3 mascotas registradas.</li>
                                <li>Sistema de quejas y apelaciones integrado.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 4. Infrastructure Section */}
                <section id="infraestructura" className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🏗️</span>
                        Infraestructura Robusta
                    </h2>
                    <p>
                        El sistema utiliza una arquitectura híbrida para garantizar seguridad y rendimiento.
                    </p>
                    <div className={styles.cardGrid}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Supabase DB & Storage</h3>
                            <p className={styles.cardText}>
                                Almacenamiento seguro de documentos en buckets privados con políticas RLS. Base de datos para persistencia de "pasos intermedios" en el registro.
                            </p>
                        </div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Stripe Payments</h3>
                            <p className={styles.cardText}>
                                Manejo de suscripciones Mensuales y Anuales. Portal de facturación integrado y manejo de webhooks para actualización automática de membresías.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 5. Integrations Section */}
                <section id="integraciones" className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🔗</span>
                        Ecosistema de Integraciones
                    </h2>
                    <div className={styles.cardGrid}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>LynSales CRM</h3>
                            <p className={styles.cardText}>
                                <strong>Tracking de Carrito Abandonado:</strong> Si un usuario inicia el registro pero no paga en 15 minutos, el CRM lo etiqueta para seguimiento automático.
                            </p>
                        </div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Resend Email Service</h3>
                            <p className={styles.cardText}>
                                Envío de correos transaccionales personalizados: Bienvenida, éxito de pago, y notificaciones de estado de aprobación.
                            </p>
                        </div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Ambassador Program</h3>
                            <p className={styles.cardText}>
                                Sistema de referidos integrado que rastrea el origen de cada registro y asigna créditos automáticamente a los embajadores correspondientes.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className={styles.footer}>
                <p>© 2026 Club Pata Amiga - Reporte Interno de Desarrollo</p>
                <div style={{marginTop: '10px', fontSize: '0.8rem', opacity: 0.6}}>
                    Desplegado en Vercel con Next.js 15.5
                </div>
            </footer>
        </div>
    );
};

export default ReporteMVP;
