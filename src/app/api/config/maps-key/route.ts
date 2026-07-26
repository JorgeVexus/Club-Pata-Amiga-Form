import { NextResponse } from 'next/server';

// Expone la API key publica de Google Maps para que los widgets estaticos
// de Webflow (fuera del build de Next.js) puedan cargar el script de Places
// sin tener que hardcodear la key en un archivo publico.
export async function GET() {
    return NextResponse.json({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    });
}
