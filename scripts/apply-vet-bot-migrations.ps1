# =============================================
# Script para aplicar migraciones del Vet-Bot
# Fecha: 2026-02-17
# =============================================

param(
    [switch]$DryRun,
    [string]$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL,
    [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Migraciones Vet-Bot v2" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar variables de entorno
if (-not $SupabaseUrl) {
    Write-Host "❌ Error: NEXT_PUBLIC_SUPABASE_URL no está configurada" -ForegroundColor Red
    Write-Host "   Ejecuta: `$env:NEXT_PUBLIC_SUPABASE_URL = 'https://tu-proyecto.supabase.co'" -ForegroundColor Yellow
    exit 1
}

if (-not $ServiceRoleKey) {
    Write-Host "❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurada" -ForegroundColor Red
    Write-Host "   Ejecuta: `$env:SUPABASE_SERVICE_ROLE_KEY = 'tu-service-role-key'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green
Write-Host "   URL: $SupabaseUrl" -ForegroundColor Gray
Write-Host ""

# Archivos de migración
$migrations = @(
    "supabase/migrations/20260217_vet_bot_sessions.sql",
    "supabase/migrations/20260217_vet_bot_verification_codes.sql"
)

# Verificar que los archivos existen
foreach ($migration in $migrations) {
    if (-not (Test-Path $migration)) {
        Write-Host "❌ Error: No se encontró el archivo $migration" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Archivos de migración encontrados:" -ForegroundColor Green
foreach ($migration in $migrations) {
    Write-Host "   - $migration" -ForegroundColor Gray
}
Write-Host ""

if ($DryRun) {
    Write-Host "🏃 MODO DRY RUN - Solo mostrando qué se ejecutaría" -ForegroundColor Yellow
    Write-Host ""
    foreach ($migration in $migrations) {
        Write-Host "--- Contenido de $migration ---" -ForegroundColor Cyan
        Get-Content $migration | Write-Host
        Write-Host "--- Fin de $migration ---" -ForegroundColor Cyan
        Write-Host ""
    }
    exit 0
}

# Función para ejecutar SQL via API de Supabase
function Invoke-SupabaseSQL {
    param(
        [string]$Sql,
        [string]$Description
    )
    
    Write-Host "🔄 Ejecutando: $Description..." -ForegroundColor Yellow -NoNewline
    
    try {
        $headers = @{
            "apikey" = $ServiceRoleKey
            "Authorization" = "Bearer $ServiceRoleKey"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            query = $Sql
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        
        Write-Host " ✅ OK" -ForegroundColor Green
        return $true
        
    } catch {
        Write-Host " ❌ ERROR" -ForegroundColor Red
        Write-Host "   Detalle: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Método alternativo: Usar psql si está disponible
function Test-PsqlAvailable {
    return (Get-Command psql -ErrorAction SilentlyContinue) -ne $null
}

# Intentar con psql primero (más confiable)
if (Test-PsqlAvailable) {
    Write-Host "🔧 psql detectado, intentando conexión directa..." -ForegroundColor Yellow
    
    # Nota: Esto requiere que tengas configurado el connection string
    # Por ahora usamos el método de API
    Write-Host "   (Usando API REST de Supabase en su lugar)" -ForegroundColor Gray
}

# Ejecutar migraciones via API
Write-Host ""
Write-Host "🚀 Iniciando migraciones..." -ForegroundColor Green
Write-Host ""

$allSuccess = $true

foreach ($migration in $migrations) {
    $sql = Get-Content $migration -Raw
    $filename = Split-Path $migration -Leaf
    
    Write-Host "📄 Procesando: $filename" -ForegroundColor Cyan
    
    # Dividir el SQL en statements individuales (separados por ;)
    # Esto es una simplificación, en producción usa una librería SQL parser
    $statements = $sql -split "\n-- [=]+" | Where-Object { $_.Trim() -ne "" }
    
    foreach ($stmt in $statements) {
        $cleanStmt = $stmt.Trim()
        if ($cleanStmt -and -not $cleanStmt.StartsWith("--")) {
            # Extraer descripción del comentario si existe
            $description = if ($cleanStmt -match "--\s*(.+)") { 
                $matches[1] 
            } else { 
                "Statement" 
            }
            
            $success = Invoke-SupabaseSQL -Sql $cleanStmt -Description $description
            if (-not $success) {
                $allSuccess = $false
            }
        }
    }
    
    Write-Host ""
}

# Resumen
Write-Host "==========================================" -ForegroundColor Cyan
if ($allSuccess) {
    Write-Host "✅ Migraciones completadas exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tablas creadas:" -ForegroundColor Yellow
    Write-Host "  - vet_bot_sessions (tokens de sesión)" -ForegroundColor Gray
    Write-Host "  - vet_bot_verification_codes (códigos de 6 dígitos)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Yellow
    Write-Host "  1. Deploy a Vercel: git push" -ForegroundColor Gray
    Write-Host "  2. Instalar widget en Webflow" -ForegroundColor Gray
    Write-Host "  3. Coordinar con la agencia del bot" -ForegroundColor Gray
} else {
    Write-Host "❌ Algunas migraciones fallaron" -ForegroundColor Red
    Write-Host "   Revisa los errores arriba" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan
