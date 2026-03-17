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

import NewRegistrationFlow from '@/components/RegistrationV2/NewRegistrationFlow';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Registro de Membresía - Pata Amiga',
    description: 'Únete a la red de protección veterinaria más grande de México. Registra a tu mascota y obtén beneficios exclusivos.',
};

export default function RegistroPage() {
    return <NewRegistrationFlow />;
}
