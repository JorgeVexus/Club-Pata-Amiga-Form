/**
 * API Endpoint para obtener catálogo de razas
 * Usa las razas existentes del sistema
 */

import { NextRequest, NextResponse } from 'next/server';

// Razas de perros (del sistema existente)
const DOG_BREEDS = [
    { id: 'labrador', name: 'Labrador Retriever', type: 'dog' },
    { id: 'pitbull', name: 'Pitbull', type: 'dog' },
    { id: 'chihuahua', name: 'Chihuahua', type: 'dog' },
    { id: 'pastor-aleman', name: 'Pastor Alemán', type: 'dog' },
    { id: 'golden', name: 'Golden Retriever', type: 'dog' },
    { id: 'bulldog', name: 'Bulldog Francés', type: 'dog' },
    { id: 'beagle', name: 'Beagle', type: 'dog' },
    { id: 'poodle', name: 'Poodle', type: 'dog' },
    { id: 'boxer', name: 'Boxer', type: 'dog' },
    { id: 'mestizo', name: 'Mestizo', type: 'dog' },
    { id: 'otro', name: 'Otra raza', type: 'dog' }
];

// Razas de gatos
const CAT_BREEDS = [
    { id: 'siames', name: 'Siamés', type: 'cat' },
    { id: 'persa', name: 'Persa', type: 'cat' },
    { id: 'maine-coon', name: 'Maine Coon', type: 'cat' },
    { id: 'bengala', name: 'Bengala', type: 'cat' },
    { id: 'ragdoll', name: 'Ragdoll', type: 'cat' },
    { id: 'sphynx', name: 'Sphynx (Sin pelo)', type: 'cat' },
    { id: 'angora', name: 'Angora Turco', type: 'cat' },
    { id: 'mestizo', name: 'Doméstico', type: 'cat' },
    { id: 'otro', name: 'Otra raza', type: 'cat' }
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        let breeds = [...DOG_BREEDS, ...CAT_BREEDS];

        if (type === 'dog' || type === 'perro') {
            breeds = DOG_BREEDS;
        } else if (type === 'cat' || type === 'gato') {
            breeds = CAT_BREEDS;
        }

        return NextResponse.json({
            success: true,
            data: breeds
        });
    } catch (error: any) {
        console.error('Error obteniendo razas:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Error al obtener catálogo de razas' 
            },
            { status: 500 }
        );
    }
}
