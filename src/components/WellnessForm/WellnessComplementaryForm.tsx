'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './WellnessForm.module.css';
import { WellnessCenter, SocialLinks, WellnessCenterLocation } from '@/types/wellness.types';

interface Props {
    center: WellnessCenter;
    onUpdate?: (updated: WellnessCenter) => void;
}


const DEFAULT_LOGO_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <rect width="160" height="160" rx="28" fill="#E8F8F7"/>
        <circle cx="80" cy="70" r="30" fill="#00BBB4"/>
        <circle cx="55" cy="45" r="10" fill="#FE8F15"/>
        <circle cx="80" cy="34" r="11" fill="#FE8F15"/>
        <circle cx="105" cy="45" r="10" fill="#FE8F15"/>
        <path d="M48 118c8-22 22-34 32-34s24 12 32 34" fill="#00BBB4"/>
        <text x="80" y="139" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#1E293B">Pata Amiga</text>
    </svg>
`)}`;

interface BranchCardProps {
    index: number;
    location: WellnessCenterLocation;
    onChange: (updated: WellnessCenterLocation) => void;
    onRemove: () => void;
}

function BranchCard({ index, location, onChange, onRemove }: BranchCardProps) {
    const addressInputRef = useRef<HTMLInputElement>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.google || !addressInputRef.current) return;

        const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
            componentRestrictions: { country: 'mx' },
            fields: ['formatted_address', 'geometry']
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                onChange({
                    ...location,
                    address: place.formatted_address || '',
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
            }
        });
    }, []);

    const handleGetCurrentLocation = () => {
        if (!("geolocation" in navigator)) {
            alert('Tu navegador no soporta geolocalización.');
            return;
        }

        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition((position) => {
            onChange({
                ...location,
                lat: Number(position.coords.latitude.toFixed(8)),
                lng: Number(position.coords.longitude.toFixed(8))
            });
            setIsGettingLocation(false);
        }, () => {
            alert('Error al obtener ubicación. Por favor ingrésala manualmente.');
            setIsGettingLocation(false);
        });
    };

    return (
        <div className={styles.branchCard}>
            <div className={styles.branchCardHeader}>
                <h5 className={styles.branchTitle}>Sucursal adicional {index + 1}</h5>
                <button type="button" className={styles.branchRemove} onClick={onRemove}>
                    Eliminar
                </button>
            </div>
            <div className={styles.row}>
                <div className={styles.field}>
                    <label>Nombre de sucursal</label>
                    <input 
                        type="text" 
                        value={location.name || ''}
                        onChange={e => onChange({ ...location, name: e.target.value })}
                        placeholder="Ej. Sucursal Roma Norte"
                        required
                    />
                </div>
                <div className={styles.field}>
                    <label>Teléfono de sucursal</label>
                    <input 
                        type="tel" 
                        value={location.phone || ''}
                        onChange={e => onChange({ ...location, phone: e.target.value })}
                        placeholder="Ej. 5512345678"
                    />
                </div>
            </div>
            <div className={styles.field}>
                <label>Dirección completa</label>
                <input 
                    ref={addressInputRef}
                    type="text" 
                    value={location.address || ''}
                    onChange={e => onChange({ ...location, address: e.target.value })}
                    placeholder="Calle, número, colonia, CP y ciudad..."
                    required
                />
            </div>
            <div className={styles.row}>
                <div className={styles.field}>
                    <label>Latitud</label>
                    <input 
                        type="number" 
                        step="any"
                        value={location.lat || ''}
                        onChange={e => onChange({ ...location, lat: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="Ej. 19.4326"
                    />
                </div>
                <div className={styles.field}>
                    <label>Longitud</label>
                    <input 
                        type="number" 
                        step="any"
                        value={location.lng || ''}
                        onChange={e => onChange({ ...location, lng: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="Ej. -99.1332"
                    />
                </div>
            </div>
            <button 
                type="button" 
                className={styles.secondaryButtonSmall} 
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                style={{ marginTop: '10px', width: '100%' }}
            >
                {isGettingLocation ? 'Obteniendo...' : '📍 Usar mi ubicación actual'}
            </button>
        </div>
    );
}

export default function WellnessComplementaryForm({ center, onUpdate }: Props) {
    const [formData, setFormData] = useState({
        establishment_name: center.establishment_name || '',
        logo_url: center.logo_url || '',
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

    const [hasBranches, setHasBranches] = useState(
        center.locations ? center.locations.filter(l => !l.is_primary).length > 0 : false
    );
    const [branches, setBranches] = useState<WellnessCenterLocation[]>(
        center.locations ? center.locations.filter(l => !l.is_primary) : []
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const autocompleteRef = useRef<any>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const markerRef = useRef<any>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Solo se aceptan imágenes');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no puede superar 5MB');
            return;
        }

        setIsUploadingLogo(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('memberstackId', center.memberstack_id || '');

        try {
            const response = await fetch('/api/upload/wellness-logo', {
                method: 'POST',
                body: fd
            });
            const result = await response.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, logo_url: result.url }));
                setMessage({ text: 'Logo subido correctamente', type: 'success' });
                if (onUpdate) {
                    onUpdate({
                        ...center,
                        logo_url: result.url
                    });
                }
            } else {
                setMessage({ text: 'Error al subir logo: ' + result.error, type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error de conexión al subir logo', type: 'error' });
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ text: '', type: '' });

        const compiledLocations: WellnessCenterLocation[] = [];

        // 1. Agregar sucursal principal si hay dirección
        if (formData.address.trim()) {
            compiledLocations.push({
                name: formData.establishment_name.trim() || 'Sucursal principal',
                address: formData.address.trim(),
                lat: formData.lat === '' ? null : Number(formData.lat),
                lng: formData.lng === '' ? null : Number(formData.lng),
                phone: formData.phone.trim() || null,
                is_primary: true
            });
        }

        // 2. Agregar sucursales adicionales si se activó el switch
        if (hasBranches) {
            branches.forEach((branch, idx) => {
                if (branch.address.trim()) {
                    compiledLocations.push({
                        ...branch,
                        name: branch.name?.trim() || `Sucursal ${idx + 2}`,
                        address: branch.address.trim(),
                        is_primary: false
                    });
                }
            });
        }

        try {
            const response = await fetch('/api/wellness/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberstack_id: center.memberstack_id,
                    ...formData,
                    locations: compiledLocations
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
                <h4>🎨 Marca y Logo</h4>
                <div className={styles.logoPreviewContainer}>
                    <img 
                        src={formData.logo_url || DEFAULT_LOGO_PLACEHOLDER} 
                        className={styles.logoPreview} 
                        id="logo-preview-img" 
                        alt="Logo del centro"
                    />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
                            Recomendado: Imagen cuadrada, min 200x200px (PNG o JPG).
                        </p>
                        <input 
                            type="file" 
                            ref={logoInputRef} 
                            onChange={handleLogoUpload} 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                        />
                        <button 
                            type="button" 
                            onClick={() => logoInputRef.current?.click()} 
                            className={styles.secondaryButtonSmall}
                            disabled={isUploadingLogo}
                        >
                            {isUploadingLogo ? 'Subiendo...' : 'Seleccionar Imagen'}
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h4>📞 Información de Contacto</h4>
                <div className={styles.field}>
                    <label>Nombre del establecimiento</label>
                    <input 
                        type="text" 
                        value={formData.establishment_name}
                        onChange={e => setFormData({...formData, establishment_name: e.target.value})}
                        placeholder="Ej. Clínica Vet Pata Amiga"
                        required
                    />
                </div>
                
                <div className={styles.field}>
                    <label>Teléfono de contacto</label>
                    <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="Ej. 5512345678"
                    />
                </div>
            </div>

            <div className={styles.section}>
                <h4>📍 Ubicación y Geolocalización</h4>
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

            {/* Sucursales Editor */}
            <div className={styles.section}>
                <div className={styles.branchQuestion}>
                    <div>
                        <label className={styles.branchTitle} style={{ marginBottom: '4px', display: 'block' }}>
                            ¿Tu negocio cuenta con más de una sucursal?
                        </label>
                        <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
                            Los beneficios y servicios se toman del centro principal.
                        </p>
                    </div>
                    <div className={styles.branchToggleOptions}>
                        <label>
                            <input 
                                type="radio" 
                                name="has_branches" 
                                value="no" 
                                checked={!hasBranches} 
                                onChange={() => setHasBranches(false)} 
                            />{' '}
                            No
                        </label>
                        <label>
                            <input 
                                type="radio" 
                                name="has_branches" 
                                value="yes" 
                                checked={hasBranches} 
                                onChange={() => setHasBranches(true)} 
                            />{' '}
                            Si
                        </label>
                    </div>
                </div>

                {hasBranches && (
                    <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {branches.length > 0 ? (
                                branches.map((branch, index) => (
                                    <BranchCard
                                        key={index}
                                        index={index}
                                        location={branch}
                                        onChange={(updated) => {
                                            const newBranches = [...branches];
                                            newBranches[index] = updated;
                                            setBranches(newBranches);
                                        }}
                                        onRemove={() => {
                                            setBranches(branches.filter((_, idx) => idx !== index));
                                        }}
                                    />
                                ))
                            ) : (
                                <p className={styles.branchesEmpty}>
                                    Agrega las sucursales adicionales que quieras registrar.
                                </p>
                            )}
                        </div>
                        <button 
                            type="button" 
                            onClick={() => {
                                setBranches([
                                    ...branches,
                                    {
                                        name: '',
                                        address: '',
                                        lat: null,
                                        lng: null,
                                        phone: null,
                                        is_primary: false
                                    }
                                ]);
                            }} 
                            className={styles.secondaryButtonSmall}
                            style={{ width: '100%', marginTop: '15px' }}
                        >
                            + Agregar sucursal
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <h4>🎁 Promoción para Miembros</h4>
                <div className={styles.field}>
                    <label>¿Qué beneficio ofreces a los miembros de Pata Amiga?</label>
                    <textarea 
                        value={formData.promotion_details}
                        onChange={e => setFormData({...formData, promotion_details: e.target.value})}
                        placeholder="Ej. 15% de descuento en consultas generales y 10% en farmacia..."
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
                            placeholder="https://instagram.com/..."
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Facebook</label>
                        <input 
                            type="text" 
                            value={formData.social_links.facebook}
                            onChange={e => setFormData({...formData, social_links: {...formData.social_links, facebook: e.target.value}})}
                            placeholder="https://facebook.com/..."
                        />
                    </div>
                    <div className={styles.field}>
                        <label>TikTok</label>
                        <input 
                            type="text" 
                            value={formData.social_links.tiktok}
                            onChange={e => setFormData({...formData, social_links: {...formData.social_links, tiktok: e.target.value}})}
                            placeholder="https://tiktok.com/@..."
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Sitio Web</label>
                        <input 
                            type="text" 
                            value={formData.social_links.website}
                            onChange={e => setFormData({...formData, social_links: {...formData.social_links, website: e.target.value}})}
                            placeholder="https://..."
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
