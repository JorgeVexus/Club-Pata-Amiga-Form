import { NextRequest, NextResponse } from 'next/server';
import {
    buildMissingDocsEmailHtml,
    type MissingDocType,
} from '@/utils/missing-pet-docs-email';

const VALID_MISSING_DOCS = new Set<MissingDocType>(['photo', 'certificate', 'both']);

export async function GET(request: NextRequest) {
    const requestedVariant = request.nextUrl.searchParams.get('missingDocs') as MissingDocType | null;
    const missingDocs = requestedVariant && VALID_MISSING_DOCS.has(requestedVariant)
        ? requestedVariant
        : 'both';

    const html = buildMissingDocsEmailHtml({
        userName: request.nextUrl.searchParams.get('userName') || 'Fulanita Ejemplo',
        petName: request.nextUrl.searchParams.get('petName') || 'NOMBRE_PELUDO',
        petIndex: 1,
        missingDocs,
        followupDay: 0,
        uploadUrl: '#preview-cta',
    }).replaceAll('https://app.pataamiga.mx/email-assets/', `${request.nextUrl.origin}/email-assets/`);

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Robots-Tag': 'noindex, nofollow',
        },
    });
}
