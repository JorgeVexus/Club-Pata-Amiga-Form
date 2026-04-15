'use client';

import React, { useState } from 'react';
import DatePicker from '@/components/FormFields/DatePicker';

export default function TestDatePicker() {
    const [birthDate, setBirthDate] = useState('');
    
    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', background: '#f5f7fa', minHeight: '100vh' }}>
            <h1 style={{ marginBottom: '2rem', color: '#2d3748' }}>DatePicker Fix Verification</h1>
            
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '1.5rem' }}>
                    Prueba la interacción en la parte derecha (icono) para el calendario, y en la parte izquierda para escribir.
                </p>
                
                <DatePicker
                    label="Fecha de nacimiento"
                    name="birthDate"
                    value={birthDate}
                    onChange={(val) => {
                        console.log('Date changed:', val);
                        setBirthDate(val);
                    }}
                    required
                    helpText="Toca el icono para el calendario"
                />
                
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#edf2f7', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>Estado de la Fecha:</strong> 
                    <span style={{ 
                        marginLeft: '10px', 
                        padding: '4px 12px', 
                        background: birthDate ? '#7dd8d5' : '#cbd5e0',
                        color: birthDate ? 'white' : 'black',
                        borderRadius: '20px',
                        fontSize: '0.85rem'
                    }}>
                        {birthDate || 'No seleccionada'}
                    </span>
                    {birthDate && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>ISO: {birthDate}</div>}
                </div>
            </div>
            
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button 
                    onClick={() => window.location.reload()}
                    style={{ padding: '8px 16px', borderRadius: '50px', background: '#00BBB4', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    Reiniciar Prueba
                </button>
            </div>
        </div>
    );
}
