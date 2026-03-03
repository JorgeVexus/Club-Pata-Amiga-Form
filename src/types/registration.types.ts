/**
 * Tipos TypeScript para el nuevo flujo de registro reestructurado
 * Fecha: Febrero 2026
 * Objetivo: Flujo optimizado a 4-5 clicks pre-pago
 */

// ============================================================
// FLUJO PRE-PAGO (Pasos 1-3)
// ============================================================

/** Paso 1: Registro de cuenta - Solo email y contraseña */
export interface Step1AccountData {
    email: string;
    password: string;
    confirmPassword?: string;
}

/** Paso 2: Datos básicos de mascota - Solo 3 campos */
export interface Step2PetBasicData {
    petType: 'perro' | 'gato';
    petName: string;
    petAge: number;
    petAgeUnit: 'years' | 'months';
}

/** Paso 3: Selección de plan y datos de pago */
export interface Step3PlanData {
    planId: string;
    planName: string;
    price: number;
    stripePaymentIntentId?: string;
    paymentStatus: 'pending' | 'completed' | 'failed';
}

// ============================================================
// FLUJO POST-PAGO (Pasos 4-6)
// ============================================================

/** Paso 4: Datos del contratante (después del pago) */
export interface Step4ContractorData {
    // Información personal
    firstName: string;
    paternalLastName: string;
    maternalLastName: string;
    birthDate: string; // YYYY-MM-DD
    nationality: string;
    nationalityCode: string; // ISO 3166-1 alpha-3

    // Contacto
    phone: string;
    email: string; // Pre-llenado del paso 1

    // Dirección (SEPOMEX)
    postalCode: string;
    state: string;
    city: string; // Municipio/Alcaldía
    colony: string;
    address: string; // Calle y número

    // Documento
    curp: string;
}

/** Paso 5: Datos complementarios de mascota */
export interface Step5PetComplementaryData {
    // Información adicional
    gender: 'macho' | 'hembra';
    breed: string;
    isMixedBreed: boolean;

    // Colores (nuevos campos)
    coatColor: string;
    coatColorCode: string;
    noseColor: string;
    noseColorCode: string;
    eyeColor: string;
    eyeColorCode: string;

    // Fotos
    primaryPhoto?: File;
    additionalPhotos?: File[];

    // Para mestizos
    isAdopted?: boolean;
    adoptionStory?: string;

    // Senior (10+ años)
    vetCertificate?: File;
}

/** Paso 6: Facturación (opcional) */
export interface Step6InvoiceData {
    rfc: string;
    businessName: string;
    address: string;
    cfdiUse: string;
    paymentMethod: string;
}

// ============================================================
// DATOS COMPLETOS DEL REGISTRO
// ============================================================

export interface CompleteRegistrationData {
    // Pre-pago
    account: Step1AccountData;
    petBasic: Step2PetBasicData;
    plan: Step3PlanData;

    // Post-pago
    contractor?: Step4ContractorData;
    petComplementary?: Step5PetComplementaryData;
    invoice?: Step6InvoiceData;
}

// ============================================================
// CATÁLOGOS
// ============================================================

export interface Nationality {
    id: number;
    code: string; // ISO 3166-1 alpha-3
    nameEs: string;
    nameEn: string;
    phoneCode?: string;
    isActive: boolean;
}

export interface CoatColor {
    id: number;
    petType: 'dog' | 'cat';
    name: string;
    hexCode?: string;
    isCommon: boolean;
}

export interface NoseColor {
    id: number;
    petType: 'dog' | 'cat';
    name: string;
    hexCode?: string;
}

export interface EyeColor {
    id: number;
    petType: 'dog' | 'cat';
    name: string;
    hexCode?: string;
}

export interface SepomexData {
    cp: string;
    state: string;
    municipality: string;
    colonies: string[];
}

// ============================================================
// ESTADOS DEL REGISTRO
// ============================================================

export type RegistrationStatus =
    | 'pending'           // Inició pero no completó ni siquiera cuenta
    | 'account_created'   // Tiene cuenta, no ha llenado mascota
    | 'pre_payment_completed' // Tiene cuenta + datos básicos mascota
    | 'payment_pending'   // Esperando pago
    | 'payment_completed' // Pagó, esperando datos contratante
    | 'contractor_pending' // Completando datos contratante
    | 'pet_data_pending'  // Completando datos mascota
    | 'invoice_pending'   // En facturación (opcional)
    | 'completed';        // Registro completo

export interface RegistrationProgress {
    userId: string;
    stepCompleted: number;
    prePaymentCompleted: boolean;
    paymentCompleted: boolean;
    postPaymentCompleted: boolean;
    contractorDataCompleted: boolean;
    petDataCompleted: boolean;
    invoiceCompleted: boolean;
    abandonedAt?: Date;
    lastActivity: Date;
}

// ============================================================
// TRACKING DE FOTOS PENDIENTES
// ============================================================

export interface PendingPhotosTracking {
    id: number;
    petId: string;
    userId: string;
    deadline: Date;
    reminder7Sent: boolean;
    reminder13Sent: boolean;
    reminder14Sent: boolean;
    completed: boolean;
    completedAt?: Date;
}

// ============================================================
// PROPS DE COMPONENTES
// ============================================================

export interface PetTypeSelectorProps {
    value: 'perro' | 'gato' | '';
    onChange: (value: 'perro' | 'gato') => void;
    error?: string;
}

export interface AgeInputProps {
    value: number;
    unit: 'years' | 'months';
    onChange: (value: number, unit: 'years' | 'months') => void;
    error?: string;
    maxYears?: number;
}

export interface NationalitySelectProps {
    value: string;
    onChange: (value: string, code: string) => void;
    error?: string;
    required?: boolean;
}

export interface ColorSelectorProps {
    value: string;
    onChange: (value: string, code: string) => void;
    options: Array<{ name: string; code: string; hexCode?: string }>;
    label: string;
    error?: string;
}

export interface SepomexAddressFormProps {
    postalCode: string;
    state: string;
    city: string;
    colony: string;
    address: string;
    onPostalCodeChange: (value: string) => void;
    onStateChange: (value: string) => void;
    onCityChange: (value: string) => void;
    onColonyChange: (value: string) => void;
    onAddressChange: (value: string) => void;
    errors: {
        postalCode?: string;
        state?: string;
        city?: string;
        colony?: string;
        address?: string;
    };
    isLoading?: boolean;
}

// ============================================================
// RESPUESTAS DE API
// ============================================================

export interface RegistrationStepResponse {
    success: boolean;
    error?: string;
    data?: {
        userId?: string;
        memberstackId?: string;
        nextStep?: number;
        redirectUrl?: string;
    };
}

export interface SepomexApiResponse {
    success: boolean;
    error?: string;
    data?: SepomexData;
    fromCache?: boolean;
}

export interface CatalogResponse<T> {
    success: boolean;
    error?: string;
    data?: T[];
}
