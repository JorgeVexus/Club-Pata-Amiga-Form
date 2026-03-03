/**
 * API Endpoint para consulta de códigos postales con cache
 * Versión con query parameter (más confiable que dynamic routes en dev)
 * Uso: /api/sepomex?cp=01000
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente de Supabase con service role (solo si hay credenciales)
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Interface de respuesta SEPOMEX
interface SepomexResponse {
    error: boolean;
    code_error: number;
    error_message: string | null;
    response: {
        cp: string;
        asentamiento: string[];
        tipo_asentamiento: string;
        municipio: string;
        estado: string;
        ciudad: string;
        pais: string;
    };
}

// Cache en memoria
const memoryCache = new Map<string, {
    data: any;
    timestamp: number;
}>();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Consulta SEPOMEX directamente
 */
async function querySepomex(cp: string): Promise<SepomexResponse | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
            `https://api-sepomex.datos.gob.mx/v1/codigo_postal/${cp}`,
            { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`SEPOMEX error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error consultando SEPOMEX:', error);
        return null;
    }
}

/**
 * Guarda en cache
 */
async function saveToCache(cp: string, data: any) {
    memoryCache.set(cp, {
        data,
        timestamp: Date.now()
    });
    
    if (!supabaseAdmin) return;
    
    try {
        const colonies = data.response.asentamiento || [];
        for (const colony of colonies) {
            await supabaseAdmin
                .from('catalog_sepomex')
                .upsert({
                    cp: cp,
                    colony: colony,
                    municipality: data.response.municipio,
                    state: data.response.estado,
                    state_code: '',
                    city: data.response.ciudad,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'cp,colony' });
        }
    } catch (error) {
        console.error('Error guardando en cache:', error);
    }
}

/**
 * Obtiene del cache
 */
async function getFromCache(cp: string): Promise<any | null> {
    const memoryHit = memoryCache.get(cp);
    if (memoryHit && (Date.now() - memoryHit.timestamp) < CACHE_TTL) {
        return memoryHit.data;
    }

    if (!supabaseAdmin) return null;

    try {
        const { data, error } = await supabaseAdmin
            .from('catalog_sepomex')
            .select('*')
            .eq('cp', cp)
            .limit(1);

        if (error || !data || data.length === 0) return null;

        const colonies = await supabaseAdmin
            .from('catalog_sepomex')
            .select('colony')
            .eq('cp', cp);

        const colonyNames = colonies.data?.map(c => c.colony) || [data[0].colony];

        const response = {
            error: false,
            code_error: 0,
            error_message: null,
            response: {
                cp: data[0].cp,
                asentamiento: colonyNames,
                tipo_asentamiento: '',
                municipio: data[0].municipality,
                estado: data[0].state,
                ciudad: data[0].city || data[0].municipality,
                pais: 'México'
            }
        };

        memoryCache.set(cp, { data: response, timestamp: Date.now() });
        return response;
    } catch (error) {
        return null;
    }
}

export async function GET(request: NextRequest) {
    console.log('📍 SEPOMEX API (query) called');
    
    try {
        const { searchParams } = new URL(request.url);
        const cp = searchParams.get('cp');
        
        console.log('📮 CP received:', cp);

        if (!cp || !/^\d{5}$/.test(cp)) {
            return NextResponse.json(
                { success: false, error: 'Código postal inválido. Debe tener 5 dígitos.' },
                { status: 400 }
            );
        }

        // 1. Intentar cache
        const cached = await getFromCache(cp);
        if (cached) {
            return NextResponse.json({
                success: true,
                data: {
                    cp: cached.response.cp,
                    state: cached.response.estado,
                    municipality: cached.response.municipio,
                    city: cached.response.ciudad,
                    colonies: cached.response.asentamiento
                },
                fromCache: true
            });
        }

        // 2. Consultar SEPOMEX
        console.log('🌐 Consultando SEPOMEX:', cp);
        const sepomexData = await querySepomex(cp);

        if (!sepomexData || sepomexData.error) {
            return NextResponse.json(
                { success: false, error: 'Código postal no encontrado' },
                { status: 404 }
            );
        }

        await saveToCache(cp, sepomexData);

        return NextResponse.json({
            success: true,
            data: {
                cp: sepomexData.response.cp,
                state: sepomexData.response.estado,
                municipality: sepomexData.response.municipio,
                city: sepomexData.response.ciudad,
                colonies: sepomexData.response.asentamiento
            },
            fromCache: false
        });

    } catch (error: any) {
        console.error('Error en endpoint SEPOMEX:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
