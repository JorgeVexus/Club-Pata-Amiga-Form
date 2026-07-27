# Matriz de autorizaciÃ³n de endpoints

Fecha de corte: 2026-07-26
Alcance: flujos de miembros, solicitudes de apoyo, embajadores, centros de bienestar y administraciÃ³n.

## Convenciones

| ClasificaciÃ³n          | Significado                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| PÃºblico controlado     | No requiere sesiÃ³n por diseÃ±o; solo captura datos o consulta catÃ¡logos no sensibles.                                 |
| Miembro                | JWT de Memberstack verificado en servidor y asociaciÃ³n con el registro Supabase.                                     |
| Embajador              | JWT de Memberstack y asociaciÃ³n con el embajador solicitado.                                                         |
| Centro                 | JWT de Memberstack y asociaciÃ³n con el centro solicitado.                                                            |
| Administrador          | JWT de Memberstack y rol `admin` o `super_admin` confirmado en Supabase.                                             |
| Firma externa          | Firma de Stripe, secreto CRON, magic token o token de carga de propÃ³sito limitado.                                   |
| Heredado por endurecer | ConfÃ­a total o parcialmente en un identificador del cliente; no debe migrarse de golpe sin actualizar el consumidor. |

## Controles centrales introducidos

| Control                  | Archivo                        | GarantÃ­a                                                                                                          |
| ------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| VerificaciÃ³n Memberstack | `src/lib/memberstack-token.ts` | Acepta exclusivamente `Authorization: Bearer`, valida el JWT contra Memberstack y no confÃ­a en IDs del navegador. |
| Actor de miembro         | `src/lib/member-auth.ts`       | Resuelve el usuario Supabase y exige coincidencia con el ID esperado.                                             |
| Actor de centro          | `src/lib/wellness-auth.ts`     | Resuelve el centro Supabase y exige coincidencia con el ID esperado.                                              |
| Actor neutral            | `src/lib/actor-context.ts`     | Desacopla la autorizaciÃ³n de la futura implementaciÃ³n de identidad.                                               |
| Administrador            | `src/lib/admin-auth.ts`        | Verifica JWT y rol; cualquier rol no administrativo devuelve `null`.                                              |

## Endpoints crÃ­ticos corregidos

| Endpoint                                             | Actor exigido | OperaciÃ³n protegida                          |
| ---------------------------------------------------- | ------------- | -------------------------------------------- |
| `POST /api/user/deactivate`                          | Miembro       | Baja de membresÃ­a y cancelaciÃ³n relacionada. |
| `POST /api/user/reactivate`                          | Miembro       | Reingreso y reactivaciÃ³n de suscripciÃ³n.     |
| `POST /api/solidarity/request`                       | Miembro       | Alta de solicitud de apoyo.                  |
| `GET /api/admin/solidarity/requests/:id`             | Administrador | Expediente y URLs firmadas de documentos.    |
| `POST /api/wellness/cancel`                          | Centro        | Baja del centro autenticado.                 |
| `PATCH /api/admin/wellness/:id/status`               | Administrador | Cambio de estado del centro.                 |
| `POST /api/referrals/:id`                            | Administrador | Cambio de comisiÃ³n/estado de referido.       |
| `POST /api/payouts/:id`                              | Administrador | Cambio de estado de reintegro/pago.          |
| `POST /api/admin/ambassadors/:id/enable-code-change` | Administrador | HabilitaciÃ³n de cambio de cÃ³digo.            |
| `POST /api/admin/ambassadors/sync-memberstack`       | Administrador | SincronizaciÃ³n masiva con Memberstack.       |

## Cobertura administrativa

Todas las rutas bajo `src/app/api/admin/**/route.ts` exigen `getAdminUser`, con una sola excepciÃ³n deliberada:

- `POST /api/admin/register`: bootstrap mediante `ADMIN_SECRET_CODE`. Ya no contiene un secreto predeterminado en cÃ³digo; si la variable no existe, el registro se rechaza.

La cobertura se aplica tambiÃ©n a analÃ­ticas, Stripe, facturaciÃ³n, centros, lista de administradores, depuraciÃ³n de miembros y conversaciones de apelaciÃ³n, que antes carecÃ­an de guardia.

## Entradas pÃºblicas justificadas

| Familia                                                                               | Motivo                                                                             |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/api/breeds`, `/api/catalogs/*`, `/api/sepomex/*`                                    | CatÃ¡logos de formulario sin datos privados.                                        |
| `/api/webflow/newsletter`, `/api/webflow/campaign-lead`, `/api/webflow/wellness-lead` | Formularios pÃºblicos de captaciÃ³n; requieren rate limiting/WAF en infraestructura. |
| `POST /api/wellness`                                                                  | Registro inicial de centro antes de disponer de sesiÃ³n asociada.                   |
| ValidaciÃ³n de cÃ³digos de referido                                                     | El alta necesita validar un cÃ³digo antes del login.                                |
| `POST /api/stripe/webhook`                                                            | Autorizado por firma Stripe.                                                       |
| `/api/cron/*`                                                                         | Autorizado por `CRON_SECRET`.                                                      |

## Rutas heredadas pendientes de migraciÃ³n coordinada

Estas rutas no deben considerarse anÃ³nimas por diseÃ±o. Sus widgets o formularios actuales usan IDs del cliente, magic tokens o tokens de carga. El siguiente paso debe aÃ±adir el actor central y actualizar simultÃ¡neamente cada consumidor:

- Perfil/mascotas: `change-plan`, `welcome-shown`, `appeal`, `add-pet`, `update-profile`, `update-pet-docs`, `preferences`, `pets/:petId/update`, `pets/add`, `fulfill-request`, `chat/send`, `emergency`.
- Cargas: documentos, perfil, mascotas, veterinarios, solidaridad, embajadores y centros. Deben conservar tokens de propÃ³sito limitado y validar propietario, MIME, tamaÃ±o y expiraciÃ³n.
- Embajadores: baja, reactivaciÃ³n, pagos propios, mensajes, reenvÃ­o de cÃ³digo y cambio/guardado de cÃ³digo.
- Solidaridad: mensajes, chat y adjuntos asociados a una solicitud.
- Bienestar: actualizaciÃ³n de perfil, citas y evidencias.
- IntegraciÃ³n veterinaria: cÃ³digo, contexto y consultas; debe documentarse y verificarse la firma/clave del bot.
- `auth/debug-role`: debe deshabilitarse en producciÃ³n o protegerse como endpoint administrativo.

## Riesgo residual y orden recomendado

1. Migrar perfil y mascotas a `requireMemberActor`.
2. Migrar embajadores a un Ãºnico `requireAmbassadorActor`.
3. Migrar actualizaciÃ³n, citas y cargas de bienestar a `requireWellnessActor`.
4. Unificar tokens de carga con alcance, propietario y expiraciÃ³n.
5. AÃ±adir rate limiting a captaciÃ³n pÃºblica y validadores.
6. Introducir transacciones/RPC idempotentes para reembolsos, comisiones y reintegros.
7. Sustituir gradualmente el verificador Memberstack sin cambiar `ActorContext`, durante la migraciÃ³n a Supabase Auth.

## Regla de aceptaciÃ³n

No se debe eliminar Memberstack ni cambiar el proveedor de identidad en producciÃ³n hasta que todas las rutas de â€œheredado por endurecerâ€ tengan prueba de autorizaciÃ³n negativa, consumidor actualizado y validaciÃ³n en staging con una cuenta real de cada actor.
