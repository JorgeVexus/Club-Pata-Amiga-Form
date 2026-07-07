'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './WellnessForm.module.css';
import { WellnessCenter, SocialLinks, WellnessCenterLocation } from '@/types/wellness.types';

const SERVICES_OPTIONS = [
    'Tienda',
    'Clínica veterinaria',
    'Hospital Veterinario',
    'Hotel',
    'Paseador de perros',
    'Funeraria'
];

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
    onPhotoUpload: (
        file: File,
        locationKey: string,
        currentUrls: string[],
        onNext: (urls: string[]) => void
    ) => Promise<void>;
}

function BranchCard({ index, location, onChange, onRemove, onPhotoUpload }: BranchCardProps) {
    const addressInputRef = useRef<HTMLInputElement>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setIsUploadingPhoto(true);
        await onPhotoUpload(file, `branch-${index + 1}`, location.photo_urls || [], (urls) => {
            onChange({ ...location, photo_urls: urls });
        });
        setIsUploadingPhoto(false);
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
            <div className={styles.locationPhotosPanel}>
                <div className={styles.branchCardHeader}>
                    <h5 className={styles.branchTitle}>Fotos de sucursal</h5>
                    <label className={styles.secondaryButtonSmall}>
                        {isUploadingPhoto ? 'Subiendo...' : '+ Foto'}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            disabled={isUploadingPhoto}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
                {(location.photo_urls || []).length > 0 ? (
                    <div className={styles.locationPhotoGrid}>
                        {(location.photo_urls || []).map((url, photoIndex) => (
                            <img
                                key={`${url}-${photoIndex}`}
                                src={url}
                                alt={`Foto de sucursal ${index + 1}`}
                                className={styles.locationPhotoThumb}
                            />
                        ))}
                    </div>
                ) : (
                    <p className={styles.photoHelp}>Agrega fotos del exterior, recepciÃ³n o Ã¡reas principales.</p>
                )}
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
    const primaryLocation = center.locations?.find(location => location.is_primary);
    const [formData, setFormData] = useState({
        legal_name: center.name || '',
        establishment_name: center.establishment_name || '',
        logo_url: center.logo_url || '',
        phone: center.phone || '',
        services: center.services || [],
        bank_name: center.bank_name || '',
        bank_clabe: center.bank_clabe || '',
        bank_holder: center.bank_holder || '',
        address: center.address || '',
        lat: center.lat || '',
        lng: center.lng || '',
        location_photo_urls: primaryLocation?.photo_urls || [],
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
    const [isUploadingMainPhoto, setIsUploadingMainPhoto] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const autocompleteRef = useRef<any>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const markerRef = useRef<any>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const toggleService = (service: string) => {
        const currentServices = formData.services;
        const newServices = currentServices.includes(service)
            ? currentServices.filter(s => s !== service)
            : [...currentServices, service];
        setFormData({ ...formData, services: newServices });
    };

    const updateMarker = useCallback((lat: number, lng: number) => {
        if (markerRef.current) {
            const pos = { lat: Number(lat), lng: Number(lng) };
            markerRef.current.setPosition(pos);
            markerRef.current.getMap().panTo(pos);
        }
    }, []);

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
    }, [center.lat, center.lng, updateMarker]);

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

    const handleLocationPhotoUpload = async (
        file: File,
        locationKey: string,
        currentUrls: string[],
        onNext: (urls: string[]) => void
    ) => {
        if (!file.type.startsWith('image/')) {
            alert('Solo se aceptan imÃ¡genes');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no puede superar 5MB');
            return;
        }

        const fd = new FormData();
        fd.append('file', file);
        fd.append('memberstackId', center.memberstack_id || '');
        fd.append('locationKey', locationKey);

        try {
            const response = await fetch('/api/upload/wellness-location-photo', {
                method: 'POST',
                body: fd
            });
            const result = await response.json();
            if (result.success) {
                onNext([...currentUrls, result.url]);
                setMessage({ text: 'Foto de sucursal subida correctamente', type: 'success' });
            } else {
                setMessage({ text: 'Error al subir foto: ' + result.error, type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error de conexiÃ³n al subir foto', type: 'error' });
        }
    };

    const handleMainLocationPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setIsUploadingMainPhoto(true);
        await handleLocationPhotoUpload(file, 'primary', formData.location_photo_urls, (urls) => {
            setFormData(prev => ({ ...prev, location_photo_urls: urls }));
        });
        setIsUploadingMainPhoto(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ text: '', type: '' });

        if (formData.bank_clabe && formData.bank_clabe.length !== 18) {
            setMessage({ text: 'La CLABE debe tener exactamente 18 dígitos.', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        const compiledLocations: WellnessCenterLocation[] = [];

        // 1. Agregar sucursal principal si hay dirección
        if (formData.address.trim()) {
            compiledLocations.push({
                name: formData.establishment_name.trim() || 'Sucursal principal',
                address: formData.address.trim(),
                lat: formData.lat === '' ? null : Number(formData.lat),
                lng: formData.lng === '' ? null : Number(formData.lng),
                phone: formData.phone.trim() || null,
                photo_urls: formData.location_photo_urls,
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
            const { legal_name, ...profileData } = formData;
            const response = await fetch('/api/wellness/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberstack_id: center.memberstack_id,
                    ...profileData,
                    name: legal_name.trim() || center.name,
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
                    <label>RazÃ³n social / Nombre</label>
                    <input
                        type="text"
                        value={formData.legal_name}
                        onChange={e => setFormData({...formData, legal_name: e.target.value})}
                        placeholder="Ej. Veterinaria Patitas Felices SA de CV"
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

                <div className={styles.field}>
                    <label>Servicios ofrecidos</label>
                    <div className={styles.servicesGrid}>
                        {SERVICES_OPTIONS.map(service => (
                            <button
                                key={service}
                                type="button"
                                onClick={() => toggleService(service)}
                                className={`${styles.serviceBadge} ${formData.services.includes(service) ? styles.active : ''}`}
                            >
                                {service}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h4>Información para reintegros</h4>
                <p className={styles.photoHelp}>
                    Estos datos se usarán para que Pata Amiga realice reintegros a tu Centro.
                </p>
                <div className={styles.field}>
                    <label>Banco</label>
                    <input
                        type="text"
                        value={formData.bank_name}
                        onChange={e => setFormData({...formData, bank_name: e.target.value})}
                        placeholder="Ej. BBVA, Santander, Banorte"
                    />
                </div>
                <div className={styles.field}>
                    <label>Titular de la cuenta</label>
                    <input
                        type="text"
                        value={formData.bank_holder}
                        onChange={e => setFormData({...formData, bank_holder: e.target.value})}
                        placeholder="Nombre como aparece en la cuenta"
                    />
                </div>
                <div className={styles.field}>
                    <label>CLABE interbancaria</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={18}
                        value={formData.bank_clabe}
                        onChange={e => setFormData({...formData, bank_clabe: e.target.value.replace(/\D/g, '').slice(0, 18)})}
                        placeholder="18 dÃ­gitos"
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

                <div className={styles.locationPhotosPanel}>
                    <div className={styles.branchCardHeader}>
                        <h5 className={styles.branchTitle}>Fotos de Sucursal principal</h5>
                        <label className={styles.secondaryButtonSmall}>
                            {isUploadingMainPhoto ? 'Subiendo...' : '+ Foto'}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleMainLocationPhotoChange}
                                disabled={isUploadingMainPhoto}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                    {formData.location_photo_urls.length > 0 ? (
                        <div className={styles.locationPhotoGrid}>
                            {formData.location_photo_urls.map((url, photoIndex) => (
                                <img
                                    key={`${url}-${photoIndex}`}
                                    src={url}
                                    alt="Foto de sucursal principal"
                                    className={styles.locationPhotoThumb}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.photoHelp}>Agrega fotos de la sucursal principal para mostrarlas en el mapa y al admin.</p>
                    )}
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
                                        onPhotoUpload={handleLocationPhotoUpload}
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
                                        photo_urls: [],
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
