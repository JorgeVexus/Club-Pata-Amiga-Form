/**
 * Tipos TypeScript para el formulario de registro de membresías
 */

// Datos del formulario de registro
export interface RegistrationFormData {
    // Información personal
    firstName: string;
    paternalLastName: string;
    maternalLastName: string;
    gender: 'hombre' | 'mujer' | 'no-especificar';
    birthDate: string; // Formato: YYYY-MM-DD
    curp: string;

    // Documentos
    ineFiles: File[]; // Mantener para compatibilidad
    ineFrontFile: File | null; // Nuevo: INE frontal
    ineBackFile: File | null;  // Nuevo: INE trasera
    proofOfAddressFile: File | null;

    // Dirección
    postalCode: string;
    state: string;
    city: string;
    colony: string;
    address: string;

    // Contacto
    email: string;
    phone: string;
    password: string;
}

// Respuesta de la API de códigos postales (Copomex)
export interface PostalCodeResponse {
    error: boolean;
    code_error: number;
    error_message: string | null;
    response: {
        cp: string;
        asentamiento: string;
        tipo_asentamiento: string;
        municipio: string;
        estado: string;
        ciudad: string;
        pais: string;
    }[];
}

// Colonia (asentamiento) de la respuesta
export interface Colony {
    name: string;
    type: string;
}

// Datos de dirección auto-completados
export interface AddressData {
    state: string;
    city: string;
    colonies: Colony[];
}

// Props para componentes de campos
export interface FieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    helpText?: string;
    required?: boolean;
    memberstackField?: string; // data-ms-member attribute
}

// Props para file upload
export interface FileUploadProps {
    label: string;
    name: string;
    accept: string;
    maxSize: number; // en MB
    maxFiles?: number;
    helpText?: string;
    instruction?: string;
    onChange: (files: File[]) => void;
    error?: string;
    required?: boolean;
}

// Estado del formulario
export interface FormState {
    data: Partial<RegistrationFormData>;
    errors: Record<string, string>;
    isSubmitting: boolean;
    isSuccess: boolean;
}

// Respuesta de Memberstack
export interface MemberstackResponse {
    success: boolean;
    member?: {
        id: string;
        email: string;
        customFields: Record<string, any>;
    };
    error?: string;
}

// Respuesta de Supabase Storage
export interface SupabaseUploadResponse {
    success: boolean;
    path?: string;
    publicUrl?: string;
    error?: string;
}
