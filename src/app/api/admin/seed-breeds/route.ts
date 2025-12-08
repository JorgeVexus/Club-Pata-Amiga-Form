import { NextResponse } from 'next/server';
import { seedBreeds } from '@/app/actions/breed.actions';
import initialBreedsData from '@/data/breeds.json';

// Esta ruta permite cargar las razas iniciales o recibir un JSON nuevo
export async function POST(req: Request) {
    try {
        // Intentar leer del body por si envían un JSON actualizado
        let dataToSeed;
        try {
            const body = await req.json();
            if (body.perros || body.gatos) {
                dataToSeed = body;
            }
        } catch (e) {
            // Si no hay body, usamos el JSON local
            console.log('Usando data local de breeds.json');
            dataToSeed = initialBreedsData;
        }

        const formattedBreeds = [];

        // Transformar Perros
        if (dataToSeed.perros) {
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
