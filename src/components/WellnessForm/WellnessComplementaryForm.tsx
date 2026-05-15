'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './WellnessForm.module.css';
import { WellnessCenter, SocialLinks } from '@/types/wellness.types';

interface Props {
    center: WellnessCenter;
    onUpdate?: (updated: WellnessCenter) => void;
}


export default function WellnessComplementaryForm({ center, onUpdate }: Props) {
    const [formData, setFormData] = useState({
        phone: center.phone || '',
        address: center.address || '',
        lat: center.lat || '',
        lng: center.lng || '',
        promotion_details: center.promotion_details || '',
        social_links: {
            instagram: center.social_links?.instagram || '',
            facebook: center.social_links?.facebook || '',
            tiktok: center.social_links?.tiktok || '',
            website: center.social_links?.website || ''
        } as SocialLinks
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const autocompleteRef = useRef<any>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const markerRef = useRef<any>(null);

    // Inicializar Google Maps Autocomplete y Mapa
    useEffect(() => {
        if (typeof window === 'undefined' || !window.google) return;

        // Autocomplete
        if (addressInputRef.current) {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
                componentRestrictions: { country: 'mx' },
                fields: ['formatted_address', 'geometry']
            });

            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current.getPlace();
                if (place.geometry) {
                    const newLat = place.geometry.location.lat();
                    const newLng = place.geometry.location.lng();
                    setFormData(prev => ({
                        ...prev,
                        address: place.formatted_address,
                        lat: newLat,
                        lng: newLng
                    }));
                    updateMarker(newLat, newLng);
                }
            });
        }

        // Mapa
        if (mapRef.current) {
            const initialLat = Number(center.lat) || 19.4326;
            const initialLng = Number(center.lng) || -99.1332;

            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat: initialLat, lng: initialLng },
                zoom: 15,
                disableDefaultUI: true,
                zoomControl: true
            });

            markerRef.current = new window.google.maps.Marker({
                position: { lat: initialLat, lng: initialLng },
                map: map,
                draggable: true
            });

            markerRef.current.addListener('dragend', () => {
                const pos = markerRef.current.getPosition();
                setFormData(prev => ({
                    ...prev,
                    lat: pos.lat(),
                    lng: pos.lng()
                }));
            });

            map.addListener('click', (e: any) => {
                const newLat = e.latLng.lat();
                const newLng = e.latLng.lng();
                updateMarker(newLat, newLng);
                setFormData(prev => ({ ...prev, lat: newLat, lng: newLng }));
            });
        }
    }, [center.lat, center.lng]);

    const updateMarker = (lat: number, lng: number) => {
        if (markerRef.current) {
            const pos = { lat: Number(lat), lng: Number(lng) };
            markerRef.current.setPosition(pos);
            markerRef.current.getMap().panTo(pos);
        }
    };

    const handleManualLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = value === '' ? '' : Number(value);
        setFormData(prev => ({ ...prev, [name]: numValue }));
        
        if (numValue !== '') {
            const lat = name === 'lat' ? Number(numValue) : Number(formData.lat);
            const lng = name === 'lng' ? Number(numValue) : Number(formData.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                updateMarker(lat, lng);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await fetch('/api/wellness/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberstack_id: center.memberstack_id,
                    ...formData
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ text: '¡Información actualizada correctamente!', type: 'success' });
                onUpdate?.(data.data);
            } else {
                setMessage({ text: data.error || 'Error al actualizar', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error de conexión', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.complementaryFormInner}>
            <div className={styles.section}>
                <h4>📍 Ubicación y Contacto</h4>
                <div className={styles.field}>
                    <label>Teléfono de contacto</label>
                    <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="55 1234 5678"
                    />
                </div>

                <div className={styles.field}>
                    <label>Dirección física</label>
                    <input 
                        ref={addressInputRef}
                        type="text" 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="Busca tu dirección..."
                    />
                </div>

                <div className={styles.mapContainer}>
                    <div ref={mapRef} className={styles.map}></div>
                    <p className={styles.mapHelp}>Puedes arrastrar el marcador o hacer clic en el mapa para mayor precisión.</p>
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label>Latitud (Manual)</label>
                        <input 
                            type="number" 
                            name="lat"
                            step="any"
                            value={formData.lat}
                            onChange={handleManualLocationChange}
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Longitud (Manual)</label>
                        <input 
                            type="number" 
                            name="lng"
                            step="any"
                            value={formData.lng}
                            onChange={handleManualLocationChange}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h4>🎁 Promoción para Miembros</h4>
                <div className={styles.field}>
                    <label>¿Qué beneficio ofreces a los miembros de Pata Amiga?</label>
                    <textarea 
                        value={formData.promotion_details}
                        onChange={e => setFormData({...formData, promotion_details: e.target.value})}
                        placeholder="Ej. 15% de descuento en consultas generales..."
                    ></textarea>
                </div>
            </div>

            <div className={styles.section}>
                <h4>🌐 Redes Sociales</h4>
                <div className={styles.socialGrid}>
                    <div className={styles.field}>
                        <label>Instagram</label>
                        <input 
                            type="text" 
                            value={formData.social_links.instagram}
                            onChange={e => setFormData({...formData, social_links: {...formData.social_links, instagram: e.target.value}})}
                            placeholder="@tu_usuario"
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Facebook</label>
                        <input 
                            type="text" 
                            value={formData.social_links.facebook}
                            onChange={e => setFormData({...formData, social_links: {...formData.social_links, facebook: e.target.value}})}
                            placeholder="facebook.com/tu_pagina"
                        />
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                </div>
            )}

            <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                {isSubmitting ? 'Guardando...' : 'Guardar Información'}
            </button>
        </form>
    );
}
