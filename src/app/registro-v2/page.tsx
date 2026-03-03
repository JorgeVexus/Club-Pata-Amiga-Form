/**
 * Página de registro - MODO DEMO
 * 
 * Usa NewRegistrationFlow.demo.tsx para funcionar sin dependencias externas.
 * 
 * Para cambiar a modo producción:
 * 1. Cambiar el import de abajo a NewRegistrationFlow
 * 2. Asegurar que variables de entorno estén configuradas
 * 3. Ejecutar migraciones de Supabase
 */

import NewRegistrationFlowDemo from '@/components/RegistrationV2/NewRegistrationFlow.demo';
// import NewRegistrationFlow from '@/components/RegistrationV2/NewRegistrationFlow'; // Modo producción
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Registro - Protege a tu mascota (Demo)',
    description: 'Únete a la manada y protege a tu mascota con la mejor cobertura veterinaria.',
};

export default function RegistroV2Page() {
    // Cambiar a NewRegistrationFlow para modo producción
    return <NewRegistrationFlowDemo />;
    // return <NewRegistrationFlow />; // Descomentar para producción
}
