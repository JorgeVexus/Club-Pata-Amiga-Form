/**
 * Servicio para interactuar con Supabase Storage
 * Maneja la subida de archivos (INE y comprobante de domicilio)
 */

import { supabase, STORAGE_BUCKETS, isSupabaseConfigured } from '@/lib/supabase';
import type { SupabaseUploadResponse } from '@/types/form.types';

/**
 * Sube un archivo a Supabase Storage
 * @param file - Archivo a subir
 * @param bucket - Nombre del bucket
 * @param userId - ID del usuario (para organizar archivos)
 * @returns Respuesta con la URL del archivo subido
 */
export async function uploadFile(
    file: File,
    bucket: keyof typeof STORAGE_BUCKETS,
    userId: string
): Promise<SupabaseUploadResponse> {
    if (!isSupabaseConfigured()) {
        return {
            success: false,
            error: 'Supabase no está configurado. Por favor agrega las credenciales en .env',
        };
    }

    // Timeout de 30 segundos
    const TIMEOUT_MS = 30000;
    const timeoutPromise = new Promise<SupabaseUploadResponse>((_, reject) => {
        setTimeout(() => reject(new Error('Tiempo de espera agotado al subir el archivo')), TIMEOUT_MS);
    });

    const uploadPromise = async (): Promise<SupabaseUploadResponse> => {
        try {
            const bucketName = STORAGE_BUCKETS[bucket];
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const fileName = `${userId}/${timestamp}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) {
                console.error('Supabase upload error:', error);
                return {
                    success: false,
                    error: error.message,
                };
            }

            // Obtener URL pública (si el bucket es público) o URL firmada (si es privado)
            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(data.path);

            return {
                success: true,
                path: data.path,
                publicUrl: urlData.publicUrl,
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
            };
        }
    };

    return Promise.race([uploadPromise(), timeoutPromise]);
}


/**
 * Sube múltiples archivos (para INE que requiere 2 imágenes)
 * @param files - Array de archivos
 * @param bucket - Nombre del bucket
 * @param userId - ID del usuario
 * @returns Array de respuestas
 */
export async function uploadMultipleFiles(
    files: File[],
    bucket: keyof typeof STORAGE_BUCKETS,
    userId: string
): Promise<SupabaseUploadResponse[]> {
    const uploadPromises = files.map(file => uploadFile(file, bucket, userId));
    return Promise.all(uploadPromises);
}

/**
 * Elimina un archivo de Supabase Storage
 * @param path - Ruta del archivo en el bucket
 * @param bucket - Nombre del bucket
 */
export async function deleteFile(
    path: string,
    bucket: keyof typeof STORAGE_BUCKETS
): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
        return {
            success: false,
            error: 'Supabase no está configurado',
        };
    }

    try {
        const bucketName = STORAGE_BUCKETS[bucket];
        const { error } = await supabase.storage.from(bucketName).remove([path]);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Crea los buckets necesarios en Supabase (ejecutar una sola vez en setup)
 * NOTA: Esto debe ejecutarse manualmente o mediante un script de setup
 */
export async function createStorageBuckets(): Promise<void> {
    if (!isSupabaseConfigured()) {
        console.error('Supabase no está configurado');
        return;
    }

    try {
        // Crear bucket para INE (privado)
        await supabase.storage.createBucket(STORAGE_BUCKETS.INE, {
            public: false,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        });

        // Crear bucket para comprobantes de domicilio (privado)
        await supabase.storage.createBucket(STORAGE_BUCKETS.PROOF_OF_ADDRESS, {
            public: false,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        });

        console.log('✅ Buckets creados exitosamente');
    } catch (error) {
        console.error('Error creando buckets:', error);
    }
}
