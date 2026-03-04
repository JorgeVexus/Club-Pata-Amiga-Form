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
 * Consulta SEPOMEX directamente con Fallback a Zippopotam
 */
async function querySepomex(cp: string): Promise<SepomexResponse | null> {
    // 1. Intentar SEPOMEX (Primario - Oficial)
    const officialUrls = [
        `https://api-sepomex.datos.gob.mx/v1/codigo_postal/${cp}`,
        `http://api-sepomex.datos.gob.mx/v1/codigo_postal/${cp}` // Fallback a HTTP por problemas de SSL
    ];

    for (const url of officialUrls) {
        try {
            console.log(`🌐 Probando SEPOMEX oficial (${url.startsWith('https') ? 'HTTPS' : 'HTTP'}): ${cp}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data && !data.error) {
                    console.log(`✅ Datos obtenidos de SEPOMEX oficial para CP: ${cp}`);
                    return data;
                }
            }
        } catch (error) {
            console.warn(`⚠️ SEPOMEX (${url.split(':')[0]}) falló:`, error);
        }
    }

    // 2. Fallback a Zippopotam (Muy estable pero datos simplificados)
    try {
        console.log(`🔄 Intentando fallback Zippopotam para CP: ${cp}`);
        const zipResponse = await fetch(`https://api.zippopotam.us/mx/${cp}`);

        if (zipResponse.ok) {
            const zipData = await zipResponse.json();
            const places = zipData.places || [];

            if (places.length > 0) {
                console.log(`✅ Datos obtenidos de Zippopotam para CP: ${cp} (${places.length} asentamientos)`);

                // NOTA: Zippopotam MX no separa municipio de colonia confiablemente.
                // Usualmente el primer 'place name' es una colonia.
                return {
                    error: false,
                    code_error: 0,
                    error_message: null,
                    response: {
                        cp: zipData['post code'],
                        asentamiento: places.map((p: any) => p['place name']),
                        tipo_asentamiento: 'Colonia',
                        // Si hay muchos lugares, el municipio suele ser constante pero Zippo no lo da.
                        // Usamos el primer lugar como placeholder, pero marcamos que debe revisarse en el cliente.
                        municipio: places[0]['place name'],
                        estado: places[0]['state'],
                        ciudad: places[0]['state'],
                        pais: 'México'
                    }
                };
            }
        }
    } catch (error) {
        console.error('❌ Fallback Zippopotam también falló:', error);
    }

    return null;
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
