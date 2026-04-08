/**
 * API Endpoint para consulta de códigos postales con cache
 * Implementa cache local para reducir dependencia de SEPOMEX
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente de Supabase con service role para operaciones admin (solo si hay credenciales)
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

// Cache en memoria (para desarrollo)
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
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seg timeout

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
 * Guarda en cache de Supabase (solo si está disponible)
 */
async function saveToCache(cp: string, data: any) {
    // Siempre guardar en memoria
    memoryCache.set(cp, {
        data,
        timestamp: Date.now()
    });
    
    // Si no hay Supabase configurado, solo usar cache en memoria
    if (!supabaseAdmin) {
        console.log('⚠️ Sin Supabase - usando solo cache en memoria');
        return;
    }
    
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
                }, {
                    onConflict: 'cp,colony'
                });
        }
    } catch (error) {
        console.error('Error guardando en cache de Supabase:', error);
    }
}

/**
 * Obtiene del cache (memoria primero, luego Supabase si está disponible)
 */
async function getFromCache(cp: string): Promise<any | null> {
    try {
        // Primero revisar memoria
        const memoryHit = memoryCache.get(cp);
        if (memoryHit && (Date.now() - memoryHit.timestamp) < CACHE_TTL) {
            console.log('✅ Cache HIT (memoria):', cp);
            return memoryHit.data;
        }

        // Si no hay Supabase configurado, no hay más cache
        if (!supabaseAdmin) {
            return null;
        }

        // Revisar Supabase
        const { data, error } = await supabaseAdmin
            .from('catalog_sepomex')
            .select('*')
            .eq('cp', cp)
            .limit(1);

        if (error || !data || data.length === 0) {
            return null;
        }

        // Reconstruir respuesta en formato SEPOMEX
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

        // Guardar en memoria
        memoryCache.set(cp, {
            data: response,
            timestamp: Date.now()
        });

        console.log('✅ Cache HIT (Supabase):', cp);
        return response;
    } catch (error) {
        console.error('Error leyendo cache:', error);
        return null;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cp: string }> }
) {
    console.log('📍 SEPOMEX API called');
    
    try {
        const resolvedParams = await params;
        const cp = resolvedParams.cp;
        
        console.log('📮 CP received:', cp);

        // 0. Revisar si es CDMX vía hardcoded mapping (Máxima prioridad y rapidez)
        const { getCDMXAlcaldia } = await import('@/utils/postalCodeUtils');
        const cdmxAlcaldia = getCDMXAlcaldia(cp);

        if (cdmxAlcaldia) {
            console.log('🏙️ CDMX Alcaldía mapped locally:', cdmxAlcaldia);
            // Si es CDMX, retornamos de inmediato con el mapeo robusto
            // Podemos seguir con el flujo normal si queremos obtener colonias,
            // pero si la API externa falla, al menos el municipio/estado ya está asegurado.
        }

        // 1. Intentar obtener del cache
        const cached = await getFromCache(cp);
        if (cached) {
            return NextResponse.json({
                success: true,
                data: {
                    cp: cached.response.cp,
                    state: cached.response.estado,
                    municipality: cdmxAlcaldia || cached.response.municipio, // Sobrescribir si es CDMX
                    city: cached.response.ciudad,
                    colonies: cached.response.asentamiento
                },
                fromCache: true
            });
        }

        // 2. Si no está en cache, consultar SEPOMEX
        console.log('🌐 Consultando SEPOMEX:', cp);
        const sepomexData = await querySepomex(cp);

        if (!sepomexData || sepomexData.error) {
            // Si falló la API pero es CDMX, podemos dar una respuesta parcial exitosa
            if (cdmxAlcaldia) {
                return NextResponse.json({
                    success: true,
                    data: {
                        cp: cp,
                        state: 'Ciudad de México',
                        municipality: cdmxAlcaldia,
                        city: cdmxAlcaldia,
                        colonies: [] // No tenemos las colonias pero salvamos el municipio
                    },
                    isPartial: true,
                    note: 'Datos de municipio recuperados vía mapeo local'
                });
            }

            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Código postal no encontrado o servicio no disponible' 
                },
                { status: 404 }
            );
        }

        // 3. Guardar en cache para futuras consultas
        await saveToCache(cp, sepomexData);

        return NextResponse.json({
            success: true,
            data: {
                cp: sepomexData.response.cp,
                state: sepomexData.response.estado,
                municipality: cdmxAlcaldia || sepomexData.response.municipio, // Sobrescribir si es CDMX
                city: sepomexData.response.ciudad,
                colonies: sepomexData.response.asentamiento
            },
            fromCache: false
        });

    } catch (error: any) {
        console.error('Error en endpoint SEPOMEX:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Error interno del servidor' 
            },
            { status: 500 }
        );
    }
}
