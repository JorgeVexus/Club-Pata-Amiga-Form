/**
 * Componente de Tarjeta Individual de Mascota
 * Formulario para una sola mascota con todos sus campos
 */

'use client';

import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import RadioGroup from '@/components/FormFields/RadioGroup';
import FileUpload from '@/components/FormFields/FileUpload';
import BreedAutocomplete from '@/components/FormFields/BreedAutocomplete';
import SelectWithInfo from '@/components/FormFields/SelectWithInfo';
import TextArea from '@/components/FormFields/TextArea';
import type { PetFormData } from '@/types/pet.types';
import styles from './PetCard.module.css';

interface PetCardProps {
    petIndex: number;
    petData: Partial<PetFormData>;
    onUpdate: (data: Partial<PetFormData>) => void;
    onRemove?: () => void;
    errors: Record<string, string>;
    canRemove: boolean;
}

export default function PetCard({
    petIndex,
    petData,
    onUpdate,
    onRemove,
    errors,
    canRemove,
}: PetCardProps) {
    const petNum = petIndex + 1;
    const [breedMaxAge, setBreedMaxAge] = useState<number | null>(null);
    const [showVetCertificate, setShowVetCertificate] = useState(false);

    // Opciones de edad (mínimo 4 meses)
    const ageOptions = [
        { value: '4-6-meses', label: '4-6 meses', numericAge: 0 },
        { value: '6-12-meses', label: '6-12 meses', numericAge: 0 },
        { value: '1-año', label: '1 año', numericAge: 1 },
        { value: '2-años', label: '2 años', numericAge: 2 },
        { value: '3-años', label: '3 años', numericAge: 3 },
        { value: '4-años', label: '4 años', numericAge: 4 },
        { value: '5-años', label: '5 años', numericAge: 5 },
        { value: '6-años', label: '6 años', numericAge: 6 },
        { value: '7-años', label: '7 años', numericAge: 7 },
        { value: '8-años', label: '8 años', numericAge: 8 },
        { value: '9-años', label: '9 años', numericAge: 9 },
        { value: '10-años', label: '10 años', numericAge: 10 },
        { value: '11-años', label: '11 años', numericAge: 11 },
        { value: '12-años', label: '12 años', numericAge: 12 },
        { value: '13-años', label: '13 años', numericAge: 13 },
        { value: '14-años', label: '14 años', numericAge: 14 },
        { value: '15+-años', label: '15+ años', numericAge: 15 },
    ];

    // Opciones de tamaño según tipo de mascota con edad senior
    const dogSizeOptions = [
        { value: 'chica', label: 'Chica (hasta 10kg)', seniorAge: 8 },
        { value: 'mediana', label: 'Mediana (11-25kg)', seniorAge: 7 },
        { value: 'grande', label: 'Grande (26-45kg)', seniorAge: 6 },
        { value: 'gigante', label: 'Gigante (46kg+)', seniorAge: 5 },
    ];

    const catSizeOptions = [
        { value: 'chica', label: 'Chica (hasta 4.5kg)', seniorAge: 7 },
        { value: 'mediana', label: 'Mediana (4.5-7kg)', seniorAge: 7 },
        { value: 'grande', label: 'Grande (7kg+)', seniorAge: 7 },
    ];

    // Seleccionar opciones según tipo de mascota
    const sizeOptions = petData.petType === 'gato' ? catSizeOptions : dogSizeOptions;

    // Obtener edad senior según tamaño seleccionado
    const getSeniorAge = (): number | null => {
        if (!petData.breedSize || !petData.petType) return null;
        const options = petData.petType === 'gato' ? catSizeOptions : dogSizeOptions;
        const selected = options.find(opt => opt.value === petData.breedSize);
        return selected?.seniorAge || null;
    };

    // Validar edad cuando cambia la edad o el tamaño
    useEffect(() => {
        const seniorAge = getSeniorAge();
        if (petData.age && seniorAge !== null) {
            const selectedAge = ageOptions.find(opt => opt.value === petData.age);
            if (selectedAge && selectedAge.numericAge >= seniorAge) {
                setShowVetCertificate(true);
                onUpdate({ ...petData, exceedsMaxAge: true });
            } else {
                setShowVetCertificate(false);
                onUpdate({ ...petData, exceedsMaxAge: false, vetCertificate: null });
            }
        } else {
            // Si no hay edad o tamaño, limpiamos banderas
            setShowVetCertificate(false);
            if (petData.exceedsMaxAge) {
                onUpdate({ ...petData, exceedsMaxAge: false, vetCertificate: null });
            }
        }
    }, [petData.age, petData.breedSize, petData.petType]);

    // Manejar cambio de raza
    const handleBreedChange = (
        value: string,
        hasWarning: boolean,
        warningMessage?: string,
        maxAge?: number
    ) => {
        setBreedMaxAge(maxAge || null);
        onUpdate({ ...petData, breed: value });
    };

    // Manejar cambio de edad
    const handleAgeChange = (value: string) => {
        onUpdate({ ...petData, age: value });
    };

    return (
        <div className={styles.petCard}>
            {/* Header con número de mascota */}
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Mascota {petNum}</h3>
                {canRemove && onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className={styles.removeButton}
                        aria-label="Eliminar mascota"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className={styles.columnsWrapper}>
                {/* Columna Izquierda */}
                <div className={styles.column}>
                    <TextInput
                        label="¿Cómo se llama tu peludo?"
                        name={`pet-${petNum}-name`}
                        value={petData.name || ''}
                        onChange={(value) => onUpdate({ ...petData, name: value })}
                        placeholder="Max"
                        helpText="El nombre con el que le hablas cuando llega corriendo a saludarte"
                        error={errors[`pet-${petNum}-name`]}
                        required
                    />

                    <TextInput
                        label="¿Cuál es su apellido?"
                        name={`pet-${petNum}-lastName`}
                        value={petData.lastName || ''}
                        onChange={(value) => onUpdate({ ...petData, lastName: value })}
                        placeholder="Pérez (opcional)"
                    />

                    <RadioGroup
                        label="¿Cuál es su sexo?"
                        name={`pet-${petNum}-gender`}
                        options={[
                            { value: 'macho', label: 'Macho ♂️' },
                            { value: 'hembra', label: 'Hembra ♀️' },
                        ]}
                        value={petData.gender || ''}
                        onChange={(value) => onUpdate({ ...petData, gender: value })}
                        error={errors[`pet-${petNum}-gender`]}
                        required
                    />

                    <RadioGroup
                        label="¿Qué tipo de peludo es?"
                        name={`pet-${petNum}-type`}
                        options={[
                            { value: 'perro', label: 'Perro' },
                            { value: 'gato', label: 'Gato' },
                        ]}
                        value={petData.petType || ''}
                        onChange={(value) => onUpdate({ ...petData, petType: value as 'perro' | 'gato' })}
                        error={errors[`pet-${petNum}-type`]}
                        required
                    />

                    <RadioGroup
                        label="¿Tu peludo tiene más años?"
                        name={`pet-${petNum}-mixed`}
                        options={[
                            { value: 'true', label: 'Mestizo/Doméstico' },
                            { value: 'false', label: 'Raza' },
                        ]}
                        value={petData.isMixed?.toString() || ''}
                        onChange={(value) => onUpdate({ ...petData, isMixed: value === 'true' })}
                        helpText="El amor no tiene raza. Los mestizos son bienvenidos con los brazos abiertos"
                        error={errors[`pet-${petNum}-mixed`]}
                        required
                    />

                    {petData.petType && !petData.isMixed && (
                        <BreedAutocomplete
                            label="🐕 Raza de tu peludo"
                            name={`pet-${petNum}-breed`}
                            petType={petData.petType as 'perro' | 'gato'}
                            value={petData.breed || ''}
                            onChange={handleBreedChange}
                            error={errors[`pet-${petNum}-breed`]}
                            required
                        />
                    )}

                    {petData.petType && (
                        <SelectWithInfo
                            label="📏 Tamaño de la raza de tu peludo"
                            name={`pet-${petNum}-size`}
                            value={petData.breedSize || ''}
                            onChange={(value) => onUpdate({ ...petData, breedSize: value as any })}
                            options={sizeOptions}
                            infoText="El tamaño ayuda a determinar las necesidades de salud de tu mascota"
                            error={errors[`pet-${petNum}-size`]}
                            required
                        />
                    )}

                    <RadioGroup
                        label="¿Tu peludo fue adoptado o rescatado?"
                        name={`pet-${petNum}-adopted`}
                        options={[
                            { value: 'true', label: 'Sí, lo adopté o rescaté' },
                            { value: 'false', label: 'No' },
                        ]}
                        value={petData.isAdopted?.toString() || ''}
                        onChange={(value) => onUpdate({ ...petData, isAdopted: value === 'true' })}
                        error={errors[`pet-${petNum}-adopted`]}
                        required
                    />

                    {petData.isAdopted && (
                        <div className={styles.adoptionStorySection}>
                            <TextArea
                                label="Cuéntanos su historia de adopción (opcional)"
                                name={`pet-${petNum}-adoption-story`}
                                value={petData.adoptionStory || ''}
                                onChange={(value) => onUpdate({ ...petData, adoptionStory: value })}
                                placeholder="Era un día lluvioso cuando lo encontramos..."
                                helpText="Tu historia puede inspirar a otros a adoptar."
                                error={errors[`pet-${petNum}-adoption-story`]}
                            />
                            <p className={styles.legalNotice} style={{ fontSize: '0.75rem', color: '#666', marginTop: '-1rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                                Al llenar la historia de adopción nos autorizas a incluirla en la página web y redes sociales de Club Pata Amiga.
                            </p>
                        </div>
                    )}
                </div>

                {/* Columna Derecha */}
                <div className={styles.column}>
                    <SelectWithInfo
                        label="¿Qué edad tiene?"
                        name={`pet-${petNum}-age`}
                        value={petData.age || ''}
                        onChange={handleAgeChange}
                        options={ageOptions}
                        error={errors[`pet-${petNum}-age`]}
                        required
                    />

                    {/* Campo condicional: Certificado veterinario */}
                    {showVetCertificate && (
                        <div className={styles.vetCertificateSection}>
                            <div className={styles.ageWarning}>
                                <p className={styles.warningText}>
                                    ⚠️ Tu peludo ya es senior para su talla, pero no te preocupes, aún lo puedes incluir en la manada.
                                </p>
                                <p className={styles.warningSubtext}>
                                    Solo necesitamos que subas un documento de tu veterinario certificando que está saludable.
                                </p>
                            </div>

                            <FileUpload
                                label="📋 Certificado Veterinario"
                                name={`pet-${petNum}-vet-certificate`}
                                accept=".pdf,.jpg,.jpeg,.png"
                                maxSize={5}
                                maxFiles={1}
                                instruction="Sube el certificado de salud de tu veterinario (PDF o imagen)"
                                onChange={(files) => onUpdate({ ...petData, vetCertificate: files[0] || null })}
                                error={errors[`pet-${petNum}-vet-certificate`]}
                                required
                            />
                        </div>
                    )}

                    <FileUpload
                        label="Muéstranos a tu peludo* ❤️"
                        name={`pet-${petNum}-photos`}
                        accept=".jpg,.jpeg,.png"
                        maxSize={5}
                        maxFiles={2}
                        instruction="Sube 2 fotos para conocerlo mejor. Pueden ser selfies juntos, de cuando juegan, duermen o simplemente están siendo ellos mismos"
                        onChange={(files) => onUpdate({ ...petData, photos: files })}
                        error={errors[`pet-${petNum}-photos`]}
                        required
                    />

                    <TextInput
                        label="¿Tienes RUAC?"
                        name={`pet-${petNum}-ruac`}
                        value={petData.ruac || ''}
                        onChange={(value) => onUpdate({ ...petData, ruac: value })}
                        placeholder="Ingrésalo aquí (opcional)"
                        helpText="RUAC = Registro Único de Animales de Compañía. Si lo tienes, tu período de carencia se reduce."
                    />
                </div>
            </div>
        </div>
    );
}
