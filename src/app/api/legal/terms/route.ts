import { NextResponse } from 'next/server';
import { LEGAL_CONTENT } from '@/data/legal-terms';

export async function GET() {
    try {
        return NextResponse.json({ 
            success: true, 
            fullDocument: LEGAL_CONTENT.fullDocument 
        });
    } catch (error) {
        console.error('Error fetching legal terms:', error);
        return NextResponse.json({ error: 'Error fetching terms' }, { status: 500 });
    }
}
