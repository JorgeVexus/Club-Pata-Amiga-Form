'use client';

import React, { useState } from 'react';

/**
 * DEMO: Simulación de cómo funcionaría el CMS
 * 
 * Esta página simula lo que vería marketing en Sanity Studio.
 * En producción real, esto estaría en el dashboard de Sanity.
 */

// Contenido editable (simula la base de datos del CMS)
const defaultContent = {
    heroTitle: "Protege a quien más amas",
    heroSubtitle: "Club Pata Amiga es la primera comunidad de protección para mascotas en México",
    ctaButtonText: "Únete Ahora",
    benefitsTitle: "¿Por qué elegirnos?",
    benefits: [
        { icon: "🏥", title: "Cobertura Médica", description: "Acceso a veterinarios de primer nivel" },
        { icon: "💊", title: "Medicamentos", description: "Descuentos en farmacias veterinarias" },
        { icon: "🚑", title: "Emergencias 24/7", description: "Asistencia las 24 horas del día" },
    ],
    testimonialsTitle: "Lo que dicen nuestros miembros",
    testimonials: [
        { name: "María García", petName: "Luna", quote: "Gracias a Club Pata Amiga, Luna recibió su tratamiento sin preocupaciones." },
        { name: "Carlos López", petName: "Max", quote: "El mejor servicio que he encontrado para mi mejor amigo." },
    ]
};

export default function DemoCMSPage() {
    const [content, setContent] = useState(defaultContent);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            alert('✅ Cambios guardados exitosamente!\n\nEn producción, esto se reflejaría inmediatamente en el sitio web.');
        }, 1000);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            {/* Header del CMS */}
            <header style={{
                background: '#1a1a2e',
                color: 'white',
                padding: '15px 30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '24px' }}>📝</span>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '18px' }}>Club Pata Amiga - CMS</h1>
                        <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>Powered by Sanity (Demo)</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setActiveTab('editor')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: activeTab === 'editor' ? '#00BBB4' : 'transparent',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        ✏️ Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: activeTab === 'preview' ? '#00BBB4' : 'transparent',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        👁️ Vista Previa
                    </button>
                </div>
            </header>

            {activeTab === 'editor' ? (
                <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
                    {/* Sidebar */}
                    <aside style={{
                        width: '250px',
                        background: '#2d2d44',
                        color: 'white',
                        padding: '20px'
                    }}>
                        <h3 style={{ fontSize: '14px', opacity: 0.7, marginBottom: '15px' }}>DOCUMENTOS</h3>
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            cursor: 'pointer'
                        }}>
                            🏠 Página de Inicio
                        </div>
                        <div style={{
                            padding: '12px',
                            background: 'transparent',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            opacity: 0.6
                        }}>
                            📋 Planes y Precios
                        </div>
                        <div style={{
                            padding: '12px',
                            background: 'transparent',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            opacity: 0.6
                        }}>
                            ❓ Preguntas Frecuentes
                        </div>
                        <div style={{
                            padding: '12px',
                            background: 'transparent',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            opacity: 0.6
                        }}>
                            📰 Blog Posts
                        </div>
                    </aside>

                    {/* Editor Principal */}
                    <main style={{ flex: 1, padding: '30px', overflow: 'auto' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '30px',
                            maxWidth: '800px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={{ margin: 0 }}>🏠 Página de Inicio</h2>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        padding: '10px 24px',
                                        background: saving ? '#ccc' : '#00BBB4',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                                </button>
                            </div>

                            {/* Hero Section */}
                            <section style={{ marginBottom: '30px' }}>
                                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                                    🎯 Sección Hero
                                </h3>

                                <label style={{ display: 'block', marginBottom: '15px' }}>
                                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Título Principal</span>
                                    <input
                                        type="text"
                                        value={content.heroTitle}
                                        onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #eee',
                                            borderRadius: '8px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </label>

                                <label style={{ display: 'block', marginBottom: '15px' }}>
                                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Subtítulo</span>
                                    <textarea
                                        value={content.heroSubtitle}
                                        onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #eee',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </label>

                                <label style={{ display: 'block', marginBottom: '15px' }}>
                                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Texto del Botón CTA</span>
                                    <input
                                        type="text"
                                        value={content.ctaButtonText}
                                        onChange={(e) => setContent({ ...content, ctaButtonText: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #eee',
                                            borderRadius: '8px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </label>

                                <label style={{ display: 'block', marginBottom: '15px' }}>
                                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Imagen Hero</span>
                                    <div style={{
                                        border: '2px dashed #ddd',
                                        borderRadius: '8px',
                                        padding: '40px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: '#fafafa'
                                    }}>
                                        📷 Arrastra una imagen o haz clic para subir
                                        <br />
                                        <small style={{ color: '#888' }}>JPG, PNG o WebP (máx 5MB)</small>
                                    </div>
                                </label>
                            </section>

                            {/* Benefits Section */}
                            <section style={{ marginBottom: '30px' }}>
                                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                                    ⭐ Sección Beneficios
                                </h3>

                                <label style={{ display: 'block', marginBottom: '15px' }}>
                                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Título de Sección</span>
                                    <input
                                        type="text"
                                        value={content.benefitsTitle}
                                        onChange={(e) => setContent({ ...content, benefitsTitle: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #eee',
                                            borderRadius: '8px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </label>

                                {content.benefits.map((benefit, idx) => (
                                    <div key={idx} style={{
                                        background: '#f9f9f9',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <input
                                                type="text"
                                                value={benefit.icon}
                                                onChange={(e) => {
                                                    const newBenefits = [...content.benefits];
                                                    newBenefits[idx].icon = e.target.value;
                                                    setContent({ ...content, benefits: newBenefits });
                                                }}
                                                style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}
                                                placeholder="🎯"
                                            />
                                            <input
                                                type="text"
                                                value={benefit.title}
                                                onChange={(e) => {
                                                    const newBenefits = [...content.benefits];
                                                    newBenefits[idx].title = e.target.value;
                                                    setContent({ ...content, benefits: newBenefits });
                                                }}
                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                placeholder="Título"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={benefit.description}
                                            onChange={(e) => {
                                                const newBenefits = [...content.benefits];
                                                newBenefits[idx].description = e.target.value;
                                                setContent({ ...content, benefits: newBenefits });
                                            }}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                            placeholder="Descripción"
                                        />
                                    </div>
                                ))}

                                <button style={{
                                    padding: '10px 20px',
                                    background: '#eee',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}>
                                    ➕ Agregar Beneficio
                                </button>
                            </section>

                            {/* Testimonials */}
                            <section>
                                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                                    💬 Testimonios
                                </h3>

                                <label style={{ display: 'block', marginBottom: '15px' }}>
                                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Título de Sección</span>
                                    <input
                                        type="text"
                                        value={content.testimonialsTitle}
                                        onChange={(e) => setContent({ ...content, testimonialsTitle: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #eee',
                                            borderRadius: '8px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </label>

                                {content.testimonials.map((testimonial, idx) => (
                                    <div key={idx} style={{
                                        background: '#f9f9f9',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <input
                                                type="text"
                                                value={testimonial.name}
                                                onChange={(e) => {
                                                    const newTestimonials = [...content.testimonials];
                                                    newTestimonials[idx].name = e.target.value;
                                                    setContent({ ...content, testimonials: newTestimonials });
                                                }}
                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                placeholder="Nombre"
                                            />
                                            <input
                                                type="text"
                                                value={testimonial.petName}
                                                onChange={(e) => {
                                                    const newTestimonials = [...content.testimonials];
                                                    newTestimonials[idx].petName = e.target.value;
                                                    setContent({ ...content, testimonials: newTestimonials });
                                                }}
                                                style={{ width: '120px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                placeholder="Mascota"
                                            />
                                        </div>
                                        <textarea
                                            value={testimonial.quote}
                                            onChange={(e) => {
                                                const newTestimonials = [...content.testimonials];
                                                newTestimonials[idx].quote = e.target.value;
                                                setContent({ ...content, testimonials: newTestimonials });
                                            }}
                                            rows={2}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', resize: 'vertical' }}
                                            placeholder="Testimonio"
                                        />
                                    </div>
                                ))}
                            </section>
                        </div>
                    </main>
                </div>
            ) : (
                /* Vista Previa */
                <div style={{ padding: '20px', background: '#333' }}>
                    <div style={{
                        background: 'white',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                    }}>
                        {/* Hero Preview */}
                        <section style={{
                            background: 'linear-gradient(135deg, #00BBB4 0%, #00d4aa 100%)',
                            color: 'white',
                            padding: '80px 40px',
                            textAlign: 'center'
                        }}>
                            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>{content.heroTitle}</h1>
                            <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '30px' }}>{content.heroSubtitle}</p>
                            <button style={{
                                padding: '15px 40px',
                                fontSize: '18px',
                                background: 'white',
                                color: '#00BBB4',
                                border: 'none',
                                borderRadius: '30px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}>
                                {content.ctaButtonText}
                            </button>
                        </section>

                        {/* Benefits Preview */}
                        <section style={{ padding: '60px 40px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '32px', marginBottom: '40px' }}>{content.benefitsTitle}</h2>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                                {content.benefits.map((benefit, idx) => (
                                    <div key={idx} style={{ maxWidth: '250px' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>{benefit.icon}</div>
                                        <h3 style={{ marginBottom: '10px' }}>{benefit.title}</h3>
                                        <p style={{ color: '#666' }}>{benefit.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Testimonials Preview */}
                        <section style={{ padding: '60px 40px', background: '#f9f9f9', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '32px', marginBottom: '40px' }}>{content.testimonialsTitle}</h2>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
                                {content.testimonials.map((t, idx) => (
                                    <div key={idx} style={{
                                        background: 'white',
                                        padding: '30px',
                                        borderRadius: '12px',
                                        maxWidth: '350px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                    }}>
                                        <p style={{ fontStyle: 'italic', marginBottom: '20px' }}>"{t.quote}"</p>
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>{t.name}</p>
                                        <p style={{ color: '#00BBB4', margin: 0 }}>🐾 {t.petName}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
