# Guía de Entorno de Staging y Preview 🧪

Esta guía explica cómo utilizar el entorno de **Staging** para probar cambios de forma segura antes de que lleguen a los usuarios finales en Producción.

## 🏗️ Estructura de Ramas

El proyecto utiliza un flujo de trabajo basado en dos ramas principales:

| Rama | Entorno Vercel | Propósito | URL Típica |
|------|----------------|-----------|------------|
| `main` | **Producción** | Usuarios reales, datos finales. | `app.pataamiga.mx` / `tu-app.vercel.app` |
| `staging` | **Preview** | Pruebas internas, nuevos features. | `tu-app-git-staging-tu-usuario.vercel.app` |

---

## 🚀 Flujo de Trabajo Recomendado

1.  **Cambiarse a Staging**:
    Antes de empezar a trabajar, asegúrate de estar en la rama correcta:
    ```bash
    git checkout staging
    ```
2.  **Desarrollar y Probar Localmente**:
    Realiza tus cambios y pruébalos con `npm run dev`.
3.  **Hacer Push a Staging**:
    ```bash
    git add .
    git commit -m "feat: descripción del cambio"
    git push origin staging
    ```
4.  **Validar en la URL de Preview**:
    Vercel detectará el push y generará un **"Preview Deployment"**. Podrás ver el link en tu dashboard de Vercel (o en el comentario automático que deja GitHub en los PRs).
5.  **Pasar a Producción (Promover)**:
    Una vez validado en Staging, integra los cambios a la rama principal:
    ```bash
    git checkout main
    git merge staging
    git push origin main
    ```

---

## 🔑 Autenticación y Widgets en Staging

### ¿Puedo iniciar sesión en Staging?
**Sí**, pero requiere una pequeña configuración en Memberstack:

1.  **Dominios Autorizados**:
    Memberstack bloquea peticiones de dominios desconocidos por seguridad.
    - Ve a tu dashboard de **Memberstack** → **Settings** → **Domains**.
    - Agrega los dominios de Vercel:
        - `*.vercel.app` (para cubrir todas las previsualizaciones).
        - Tu URL específica de staging si quieres ser más restrictivo.
2.  **Misma Base de Usuarios**:
    Por defecto, Staging y Producción comparten la misma `MEMBERSTACK_APP_ID`, por lo que tus usuarios de prueba funcionarán en ambos lados. 

### Base de Datos (Supabase)
Actualmente, ambos entornos comparten la misma base de datos de Supabase. 
> [!WARNING]
> Ten cuidado al hacer pruebas en Staging que borren o modifiquen datos reales, ya que afectarán a los usuarios de Producción. Se recomienda usar **usuarios de prueba** específicos.

---

## 🛠️ Configuración de Variables de Entorno en Vercel

Si necesitas que Staging use una API Key diferente (por ejemplo, de Stripe en modo Test):

1.  Ve a **Vercel Dashboard** → **Project Settings** → **Environment Variables**.
2.  Al editar una variable, puedes desmarcar "Production" y marcar solo "Preview" para asignar un valor diferente exclusivo de Staging.

---

## ✅ Checklist de Validación en Staging

Antes de pasar a `main`, verifica:
- [ ] El widget carga correctamente en la URL de preview.
- [ ] El login/sesión de Memberstack funciona.
- [ ] Los formularios envían datos a Supabase sin errores.
- [ ] El diseño se ve bien en móviles (responsivo).
- [ ] No hay errores de consola (F12) críticos.

---

*Última actualización: 17 de Abril, 2026*
