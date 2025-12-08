import { NextResponse } from 'next/server';
import { seedBreeds } from '@/app/actions/breed.actions';
import { promises as fs } from 'fs';
import path from 'path';

// Esta ruta permite cargar las razas iniciales o recibir un JSON nuevo
export async function POST(req: Request) {
    try {
        let dataToSeed;

        // 1. Intentar leer del body
        try {
            const body = await req.json();
            if (body.perros || body.gatos) {
                console.log('📦 Usando datos recibidos en el body del request');
                dataToSeed = body;
            }
        } catch (e) {
            formattedBreeds.push(...dataToSeed.perros.map((b: any) => ({
                name: b.name,
                type: 'perro',
                has_genetic_issues: b.hasGeneticIssues,
                warning_message: b.warningMessage,
                max_age: b.maxAge
            })));
        }

        // Transformar Gatos
        if (dataToSeed.gatos) {
            formattedBreeds.push(...dataToSeed.gatos.map((b: any) => ({
                name: b.name,
                type: 'gato',
                has_genetic_issues: b.hasGeneticIssues,
                warning_message: b.warningMessage,
                max_age: b.maxAge
            })));
        }

        if (formattedBreeds.length === 0) {
            return NextResponse.json({ message: 'No se encontraron razas para procesar' }, { status: 400 });
        }

        const result = await seedBreeds(formattedBreeds);

        if (result.success) {
            return NextResponse.json({
                message: `✅ Éxito! Se procesaron ${formattedBreeds.length} razas.`,
                count: formattedBreeds.length
            });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
