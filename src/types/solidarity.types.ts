/**
 * Tipos TypeScript para el sistema de Fondo Solidario
 */

export type SolidarityRequestStatus = 
    | 'new'               // nuevas
    | 'in_review'         // en revisión
    | 'needs_info'        // solicitando información
    | 'approved'          // aprobado
    | 'rejected'          // rechazado
    | 'paid'              // pagado (solo para reembolsos)
    | 'scheduled'         // agendado (solo para citas)
    | 'completed';        // finalizado

export type SolidarityRequestType = 'reimbursement' | 'allied_center_appointment';

export type SolidarityBenefitType = 'medical_emergency' | 'annual_vaccination' | 'death';

export interface SolidarityRequest {
    id: string;
    userId: string;
    petId: string;
    
    // Configuración
    type: SolidarityRequestType;
    benefitType: SolidarityBenefitType;
    status: SolidarityRequestStatus;
    
    // Detalles financieros
    requestedAmount?: number;
    approvedAmount?: number;
    
    // Detalles de la cita (opcional)
    caseTitle?: string;
    caseDescription?: string;
    incidentDate?: string;
    preferredAppointmentDate?: string;
    alliedCenterId?: string;
    
    // Notas admin
    adminNotes?: string;
    lastAdminResponseAt?: string;
    
    // Metadata
    createdAt: string;
    updatedAt: string;
    
    // Relaciones (opcionales)
    documents?: SolidarityDocument[];
    petName?: string;
    userName?: string;
}

export interface SolidarityDocument {
    id: string;
    requestId: string;
    documentType: 'evidence_photo' | 'prescription' | 'receipt';
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    url?: string; // URL firmada de Supabase
}

export interface SolidarityRequestFormData {
    petId: string;
    type: SolidarityRequestType;
    benefitType: SolidarityBenefitType;
    caseTitle?: string;
    caseDescription: string;
    incidentDate: string;
    requestedAmount?: number;
    
    // Campos para cita
    preferredAppointmentDate?: string;
    preferredAppointmentTime?: string;
    alliedCenterId?: string;
    
    // Archivos
    evidencePhoto?: File | null;
    prescription?: File | null;
    receipt?: File | null;
}


/**
 * Límites de montos por tipo de beneficio
 */
export const SOLIDARITY_LIMITS = {
    medical_emergency: 3000,
    annual_vaccination: 300,
    death: 2000
};

/**
 * Labels en español para beneficios
 */
export const SOLIDARITY_BENEFIT_LABELS: Record<SolidarityBenefitType, string> = {
    medical_emergency: 'Emergencia Médica',
    annual_vaccination: 'Vacunación Anual',
    death: 'Fallecimiento',
};

/**
 * Labels en español para estados de solicitud
 */
export const SOLIDARITY_STATUS_LABELS: Record<SolidarityRequestStatus, string> = {
    new: 'Nuevo',
    in_review: 'En revisión',
    needs_info: 'Acción Requerida',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    paid: 'Pagado',
    scheduled: 'Agendado',
    completed: 'Completado',
};

