/**
 * 🎯 Widget Dashboard Centro de Bienestar - Club Pata Amiga
 * Integración para Webflow
 */

(function () {
    'use strict';

    let currentCenter = null;
    let payments = [];
    let appointments = [];

    const CONFIG = {
        API_BASE_URL: 'https://app.pataamiga.mx', // Cambiar según entorno
        DEBUG: false
    };

    const STYLES = `
        .wellness-widget-container {
            font-family: 'Outfit', sans-serif;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .wc-card {
            background: white;
            border-radius: 30px;
            padding: 30px;
            border: 3px solid #000;
            box-shadow: 10px 10px 0px rgba(0,0,0,0.05);
            margin-bottom: 30px;
        }

        .wc-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 2rem;
            margin-bottom: 10px;
        }

        .wc-status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 0.8rem;
            text-transform: uppercase;
            border: 2px solid #000;
            margin-bottom: 20px;
        }

        .status-pending { background: #FEF3C7; color: #92400E; }
        .status-approved { background: #D1FAE5; color: #065F46; }
        .status-rejected { background: #FEE2E2; color: #991B1B; }
        .status-appealed { background: #E0F2FE; color: #075985; }
        .status-cancelled { background: #E2E8F0; color: #1E293B; }

        .wc-status-screen {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 40px;
            border: 3px solid #000;
            max-width: 600px;
            margin: 0 auto;
        }

        .wc-status-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }

        .wc-appeal-box {
            margin-top: 30px;
            text-align: left;
            padding: 20px;
            background: #F8FAFC;
            border-radius: 20px;
            border: 2px dashed #CBD5E1;
        }

        .wc-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        @media (max-width: 768px) {
            .wc-grid { grid-template-columns: 1fr; }
        }

        .wc-btn {
            padding: 12px 25px;
            border-radius: 50px;
            border: 2px solid #000;
            font-family: 'Fraiche', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
        }

        .wc-btn-primary { background: #FE8F15; color: white; }
        .wc-btn-secondary { background: #00BBB4; color: white; }
        .wc-btn-danger { background: #E53E3E; color: white; }

        .wc-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .wc-table th {
            text-align: left;
            padding: 15px;
            background: #F8FAFC;
            border-bottom: 2px solid #E2E8F0;
        }

        .wc-table td {
            padding: 15px;
            border-bottom: 1px solid #E2E8F0;
        }

        .wc-amount {
            font-weight: bold;
            color: #059669;
        }

        /* Modal Styles */
        .wc-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }

        .wc-modal {
            background: white;
            padding: 40px;
            border-radius: 30px;
            max-width: 800px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            border: 3px solid #000;
        }

        .wc-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .wc-close-btn {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
        }

        .wc-blocked-screen {
            text-align: center;
            padding: 100px 20px;
        }

        /* Form Styles */
        .wc-form-group {
            margin-bottom: 20px;
            text-align: left;
        }

        .wc-label {
            display: block;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 0.9rem;
            color: #475569;
        }

        .wc-input {
            width: 100%;
            padding: 12px 15px;
            border-radius: 12px;
            border: 2px solid #E2E8F0;
            font-family: inherit;
            font-size: 1rem;
            transition: border-color 0.2s;
        }

        .wc-input:focus {
            outline: none;
            border-color: #FE8F15;
        }

        .wc-input-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .wc-logo-preview-container {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 15px;
        }

        .wc-logo-preview {
            width: 80px;
            height: 80px;
            border-radius: 15px;
            background: #F1F5F9;
            object-fit: cover;
            border: 2px solid #E2E8F0;
        }

        .wc-section-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.2rem;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #F1F5F9;
            color: #1E293B;
        }
    `;

    // ============================================
    // LÓGICA DE DATOS
    // ============================================

    async function fetchCenterData(memberstackId) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/me?memberstack_id=${memberstackId}`);
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Error fetching center data:', error);
            return null;
        }
    }

    async function updateAppointmentStatus(appointmentId, memberstackId, status, details = {}) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/appointments/${appointmentId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    memberstack_id: memberstackId,
                    status,
                    ...details
                })
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async function cancelAccount(memberstackId, reason) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberstack_id: memberstackId, reason })
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async function submitAppeal(memberstackId, message) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    memberstack_id: memberstackId, 
                    appeal_message: message,
                    status: 'appealed'
                })
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    // ============================================
    // RENDERIZADO
    // ============================================

    function renderLoading(container) {
        container.innerHTML = `
            <div style="text-align:center; padding: 50px;">
                <p>Cargando información del aliado...</p>
            </div>
        `;
    }

    function renderBlocked(container) {
        container.innerHTML = `
            <div class="wc-status-screen">
                <div class="wc-status-icon">🚫</div>
                <h1 class="wc-title">Acceso Restringido</h1>
                <p>Tu cuenta como Centro de Bienestar ha sido desactivada.</p>
                <p>Lamentamos que hayas salido de la manada. Si deseas volver, por favor contáctanos.</p>
                <div style="margin-top: 30px;">
                    <a href="mailto:aliados@pataamiga.mx" class="wc-btn wc-btn-primary" style="text-decoration:none;">Contactar Soporte</a>
                </div>
            </div>
        `;
    }

    function renderPending(container, center) {
        container.innerHTML = `
            <div class="wc-status-screen">
                <div class="wc-status-icon">⏳</div>
                <h1 class="wc-title">Solicitud en Revisión</h1>
                <p>¡Hola, ${center.name}! Tu solicitud para ser aliado de Pata Amiga está siendo revisada por nuestro equipo.</p>
                <p>Te notificaremos por correo electrónico una vez que hayamos validado tus datos.</p>
                <div style="margin-top: 30px; padding: 20px; background: #FFFBEB; border-radius: 20px; border: 2px solid #FEF3C7;">
                    <p style="font-size: 0.9rem; color: #92400E;">Mientras tanto, puedes adelantar el llenado de tu información complementaria (logo, redes sociales, ubicación) para agilizar tu aprobación.</p>
                    <button id="btn-complete-pending" class="wc-btn wc-btn-primary" style="margin-top:15px; width:100%;">Completar mi Perfil</button>
                </div>
            </div>
        `;

        container.querySelector('#btn-complete-pending').addEventListener('click', () => showEditProfileModal(container, center));
    }

    function renderRejected(container, center) {
        container.innerHTML = `
            <div class="wc-status-screen">
                <div class="wc-status-icon">❌</div>
                <h1 class="wc-title">Solicitud Rechazada</h1>
                <p>Hola ${center.establishment_name || center.name}, el comité determinó no aceptar tu solicitud de centro de bienestar debido a:</p>
                
                <div class="wc-appeal-box">
                    <p style="${center.rejection_reason ? 'font-weight:bold; color:#E53E3E;' : ''}">${center.rejection_reason || 'No se proporcionó un motivo específico.'}</p>
                </div>

                <div id="appeal-form-container" style="margin-top: 40px;">
                    <h2 class="wc-title" style="font-size:1.2rem;">¿Deseas apelar esta decisión?</h2>
                    <p>Si consideras que hubo un error o tienes nueva información para compartir, descríbelo aquí:</p>
                    <textarea id="wc-appeal-text" placeholder="Escribe tu mensaje de apelación aquí..." style="width:100%; height:120px; padding:15px; border-radius:20px; border:2px solid #000; margin-top:10px; font-family:inherit;"></textarea>
                    <button id="btn-submit-appeal" class="wc-btn wc-btn-primary" style="width:100%; margin-top:15px;">Enviar Apelación</button>
                </div>
            </div>
        `;

        container.querySelector('#btn-submit-appeal').addEventListener('click', async () => {
            const message = container.querySelector('#wc-appeal-text').value;
            if (!message.trim()) {
                alert('Por favor escribe un mensaje de apelación.');
                return;
            }

            const btn = container.querySelector('#btn-submit-appeal');
            btn.disabled = true;
            btn.innerText = 'Enviando...';

            const result = await submitAppeal(center.memberstack_id, message);
            if (result.success) {
                renderAppealed(container, { ...center, status: 'appealed' });
            } else {
                alert('Error al enviar la apelación. Intenta de nuevo.');
                btn.disabled = false;
                btn.innerText = 'Enviar Apelación';
            }
        });
    }

    function renderAppealed(container, center) {
        container.innerHTML = `
            <div class="wc-status-screen">
                <div class="wc-status-icon">📩</div>
                <h1 class="wc-title">Apelación en Revisión</h1>
                <p>Hemos recibido tu apelación, ${center.name}.</p>
                <p>Nuestro equipo revisará nuevamente tu caso y los comentarios proporcionados.</p>
                <div style="margin-top: 30px; padding: 20px; background: #F0F9FF; border-radius: 20px; border: 2px solid #E0F2FE;">
                    <p style="font-size: 0.9rem; color: #0369A1;">Te avisaremos por correo lo antes posible. ¡Gracias por tu paciencia!</p>
                </div>
            </div>
        `;
    }

    function renderDashboard(container, center) {
        currentCenter = center;
        container.innerHTML = `
            <div class="wellness-widget-content">
                <div class="wc-card">
                    <div class="wc-status-badge status-${center.status}">${center.status === 'approved' ? 'Aliado Activo' : 'En Revisión'}</div>
                    <h1 class="wc-title">¡Hola, ${center.establishment_name}!</h1>
                    <p>Bienvenido a tu panel de control de Pata Amiga.</p>
                </div>

                <div class="wc-grid">
                    <div class="wc-card">
                        <h2 class="wc-title" style="font-size:1.5rem;">Solicitudes y Citas</h2>
                        <p>Gestiona las solicitudes de atención y tu calendario.</p>
                        <button id="btn-view-appointments" class="wc-btn wc-btn-secondary">Gestionar Citas</button>
                    </div>

                    <div class="wc-card">
                        <h2 class="wc-title" style="font-size:1.5rem;">Fondo Solidario</h2>
                        <p>Beneficios económicos y pagos recibidos.</p>
                        <button id="btn-view-payments" class="wc-btn wc-btn-secondary">Ver Historial</button>
                    </div>
                </div>

                <div class="wc-card">
                    <h2 class="wc-title" style="font-size:1.5rem;">Información del Centro</h2>
                    <p>Mantén tus datos de contacto y ubicación actualizados.</p>
                    <button id="btn-edit-profile" class="wc-btn wc-btn-secondary">Editar Información</button>
                </div>

                <div style="text-align: right; margin-top: 50px;">
                    <button id="wc-btn-exit" class="wc-btn" style="background:none; border:none; color:#888; text-decoration:underline;">Deseo salir de la manada</button>
                </div>
            </div>
        `;

        container.querySelector('#btn-view-appointments').addEventListener('click', () => showAppointmentsModal(container, center));
        container.querySelector('#btn-view-payments').addEventListener('click', () => showPaymentsModal(container, center));
        container.querySelector('#btn-edit-profile').addEventListener('click', () => showEditProfileModal(container, center));
        container.querySelector('#wc-btn-exit').addEventListener('click', () => showExitModal(container, center));

        // Mostrar modal de bienvenida si es necesario
        if (!center.welcome_shown && center.status === 'approved') {
            showWelcomeModal(center);
        }
    }

    function showWelcomeModal(center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';
        overlay.innerHTML = `
            <div class="wc-modal" style="text-align:center;">
                <div class="wc-status-icon">🎉</div>
                <h2 class="wc-title">Felicidades por unirte a la manada de Pata Amiga</h2>
                <p>Tu solicitud para ser parte de nuestra red de Centros de Bienestar ha sido <strong>aprobada</strong>.</p>
                <p>A partir de este momento ya puedes administrar solicitudes de miembros y gestionar citas desde este panel.</p>
                <button id="btn-welcome-close" class="wc-btn wc-btn-primary" style="width:100%; margin-top:20px;">Comenzar ahora</button>
            </div>
        `;
        
        overlay.querySelector('#btn-welcome-close').addEventListener('click', async () => {
            overlay.remove();
            // Marcar como mostrado en la DB
            await fetch(`${CONFIG.API_BASE_URL}/api/wellness/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    memberstack_id: center.memberstack_id, 
                    welcome_shown: true 
                })
            });
        });

        document.body.appendChild(overlay);
    }

    function showPaymentsModal(center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';
        
        const paymentsList = (center.payments || []).map(p => `
            <tr>
                <td>${new Date(p.paid_at || p.created_at).toLocaleDateString()}</td>
                <td>Pago de Fondo Solidario</td>
                <td class="wc-amount">$${p.amount.toFixed(2)}</td>
                <td><span class="wc-status-badge status-approved">${p.status}</span></td>
            </tr>
        `).join('');

        overlay.innerHTML = `
            <div class="wc-modal">
                <div class="wc-modal-header">
                    <h2 class="wc-title">Historial de Pagos (Fondo Solidario)</h2>
                    <button class="wc-close-btn">&times;</button>
                </div>
                <p>Estos son los pagos que Pata Amiga ha realizado a tu centro por servicios a nuestros miembros.</p>
                
                <table class="wc-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Concepto</th>
                            <th>Monto</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paymentsList.length > 0 ? paymentsList : '<tr><td colspan="4" style="text-align:center; padding:30px;">Aún no tienes pagos registrados.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.querySelector('.wc-close-btn').addEventListener('click', () => overlay.remove());
    }

    function showAppointmentsModal(center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';
        
        const apps = center.appointments || [];
        const pending = apps.filter(a => a.status === 'pending');
        const active = apps.filter(a => a.status === 'accepted');
        const history = apps.filter(a => a.status === 'completed' || a.status === 'rejected');

        overlay.innerHTML = `
            <div class="wc-modal">
                <div class="wc-modal-header">
                    <h2 class="wc-title">Gestión de Citas</h2>
                    <button class="wc-close-btn">&times;</button>
                </div>
                
                <div style="display:flex; gap:10px; margin-bottom:20px;">
                    <button class="wc-btn tab-btn active" data-tab="pending">Solicitudes (${pending.length})</button>
                    <button class="wc-btn tab-btn" data-tab="active">Calendario (${active.length})</button>
                    <button class="wc-btn tab-btn" data-tab="history">Historial</button>
                </div>

                <div id="tab-content"></div>
            </div>
        `;

        document.body.appendChild(overlay);
        const tabContent = overlay.querySelector('#tab-content');

        const renderTab = (tabName) => {
            let html = '';
            if (tabName === 'pending') {
                html = `
                    <table class="wc-table">
                        <thead>
                            <tr>
                                <th>Fecha Sugerida</th>
                                <th>Mascota</th>
                                <th>Miembro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pending.map(a => `
                                <tr>
                                    <td>${new Date(a.appointment_date).toLocaleString()}</td>
                                    <td>${a.pet?.name || 'N/A'}</td>
                                    <td>${a.member?.first_name || 'N/A'}</td>
                                    <td>
                                        <button class="wc-btn wc-btn-secondary btn-action" data-id="${a.id}" data-action="accepted">Aceptar</button>
                                        <button class="wc-btn wc-btn-danger btn-action" data-id="${a.id}" data-action="rejected">Rechazar</button>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay solicitudes pendientes.</td></tr>'}
                        </tbody>
                    </table>
                `;
            } else if (tabName === 'active') {
                html = `
                    <table class="wc-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Mascota</th>
                                <th>Miembro</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${active.map(a => `
                                <tr>
                                    <td>${new Date(a.appointment_date).toLocaleString()}</td>
                                    <td>${a.pet?.name || 'N/A'}</td>
                                    <td>${a.member?.first_name || 'N/A'}</td>
                                    <td><span class="wc-status-badge status-approved">Aceptada</span></td>
                                    <td>
                                        <button class="wc-btn wc-btn-secondary btn-action" data-id="${a.id}" data-action="completed">Finalizar</button>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay citas en calendario.</td></tr>'}
                        </tbody>
                    </table>
                `;
            } else if (tabName === 'history') {
                html = `
                    <table class="wc-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Mascota</th>
                                <th>Estado</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.map(a => `
                                <tr>
                                    <td>${new Date(a.appointment_date).toLocaleDateString()}</td>
                                    <td>${a.pet?.name || 'N/A'}</td>
                                    <td><span class="wc-status-badge status-${a.status}">${a.status === 'completed' ? 'Atendido' : 'Rechazado'}</span></td>
                                    <td class="wc-amount">$${(a.amount || 0).toFixed(2)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" style="text-align:center; padding:20px;">Historial vacío.</td></tr>'}
                        </tbody>
                    </table>
                `;
            }
            tabContent.innerHTML = html;

            // Re-vincular eventos de acción
            tabContent.querySelectorAll('.btn-action').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const action = btn.getAttribute('data-action');
                    
                    let details = {};
                    if (action === 'rejected') {
                        const reason = prompt('Motivo del rechazo (opcional):') || 'no_availability';
                        details = { rejection_reason: reason };
                    }

                    if (action === 'completed') {
                        const amount = prompt('Monto final del servicio (ej: 350.00):');
                        if (!amount) return;
                        
                        // Crear input de archivo dinámico para la evidencia
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*,application/pdf';
                        
                        const filePromise = new Promise((resolve) => {
                            fileInput.onchange = () => resolve(fileInput.files[0]);
                            // Simular click
                            fileInput.click();
                        });

                        alert('Por favor selecciona la evidencia del servicio (foto o receta).');
                        const file = await filePromise;
                        if (!file) {
                            alert('La evidencia es obligatoria para finalizar el servicio.');
                            return;
                        }

                        btn.disabled = true;
                        btn.innerText = 'Subiendo evidencia...';

                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('appointmentId', id);
                        formData.append('memberstackId', center.memberstack_id);

                        try {
                            const uploadRes = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/appointments/upload-evidence`, {
                                method: 'POST',
                                body: formData
                            });
                            const uploadData = await uploadRes.json();
                            if (!uploadData.success) {
                                alert('Error al subir evidencia: ' + uploadData.error);
                                btn.disabled = false;
                                btn.innerText = 'Finalizar';
                                return;
                            }
                        } catch (err) {
                            alert('Error de conexión al subir archivo');
                            btn.disabled = false;
                            btn.innerText = 'Finalizar';
                            return;
                        }

                        details = { amount: parseFloat(amount) };
                    }

                    btn.disabled = true;
                    btn.innerText = 'Procesando...';
                    
                    const res = await updateAppointmentStatus(id, center.memberstack_id, action, details);
                    if (res.success) {
                        alert('Cita actualizada');
                        overlay.remove();
                        init(); // Recargar datos
                    } else {
                        alert('Error: ' + res.error);
                        btn.disabled = false;
                        btn.innerText = action === 'accepted' ? 'Aceptar' : 'Rechazar';
                    }
                });
            });
        };

        renderTab('pending');

        overlay.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderTab(btn.getAttribute('data-tab'));
            });
        });

        overlay.querySelector('.wc-close-btn').addEventListener('click', () => overlay.remove());
    }

    function showExitModal(container, center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';
        
        const renderStep1 = () => {
            overlay.innerHTML = `
                <div class="wc-modal" style="max-width:500px; text-align:center;">
                    <h2 class="wc-title">Lamentamos que te vayas</h2>
                    <p>¿Por qué has decidido salir de la manada? Tu feedback nos ayuda a mejorar.</p>
                    <div style="margin: 20px 0;">
                        <select id="wc-exit-reason" style="width:100%; padding:10px; border-radius:10px; border:2px solid #000;">
                            <option value="">Selecciona un motivo...</option>
                            <option value="too_many_pets">Demasiada demanda de servicios</option>
                            <option value="payment_delay">Retraso en el pago de beneficios</option>
                            <option value="change_of_business">Cambio de giro de negocio / Cierre</option>
                            <option value="tech_issues">Problemas técnicos con la plataforma</option>
                            <option value="other">Otro motivo</option>
                        </select>
                        <textarea id="wc-exit-details" placeholder="Cuéntanos más... (opcional)" style="width:100%; margin-top:10px; padding:10px; border-radius:10px; border:2px solid #000; min-height:80px;"></textarea>
                    </div>
                    <div style="display:flex; gap:10px; justify-content:center;">
                        <button id="wc-modal-cancel" class="wc-btn">Quedarme en la Manada</button>
                        <button id="wc-modal-next" class="wc-btn wc-btn-danger">Continuar con la Salida</button>
                    </div>
                </div>
            `;
            overlay.querySelector('#wc-modal-cancel').addEventListener('click', () => overlay.remove());
            overlay.querySelector('#wc-modal-next').addEventListener('click', () => {
                const reason = overlay.querySelector('#wc-exit-reason').value;
                if (!reason) {
                    alert('Por favor selecciona un motivo.');
                    return;
                }
                renderStep2(reason, overlay.querySelector('#wc-exit-details').value);
            });
        };

        const renderStep2 = (reason, details) => {
            overlay.innerHTML = `
                <div class="wc-modal" style="max-width:500px; text-align:center;">
                    <h2 class="wc-title">¡Espera! 🐾</h2>
                    <p>Al salir de la manada, dejarás de recibir solicitudes de nuevos miembros y tu perfil será desactivado.</p>
                    <p style="font-weight:bold; color:#E53E3E;">¿Sabías que podemos ajustar tu capacidad si tienes mucha demanda?</p>
                    <p>Si confirmas la salida, tus datos permanecerán en nuestro sistema pero el acceso será bloqueado.</p>
                    <div style="display:flex; gap:10px; justify-content:center; margin-top:30px;">
                        <button id="wc-modal-back" class="wc-btn">Volver</button>
                        <button id="wc-modal-confirm" class="wc-btn wc-btn-danger">Confirmar Salida Definitiva</button>
                    </div>
                </div>
            `;
            overlay.querySelector('#wc-modal-back').addEventListener('click', renderStep1);
            overlay.querySelector('#wc-modal-confirm').addEventListener('click', async () => {
                const fullReason = `${reason}: ${details}`;
                const result = await cancelAccount(center.memberstack_id, fullReason);
                if (result.success) {
                    overlay.remove();
                    renderBlocked(container);
                } else {
                    alert('Error al procesar la salida. Intenta de nuevo.');
                }
            });
        };

        renderStep1();
        document.body.appendChild(overlay);
    }

    async function handleLogoUpload(center, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('memberstackId', center.memberstack_id);

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/upload/wellness-logo`, {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error('Error uploading logo:', error);
            return { success: false, error: 'Error de conexión al subir logo' };
        }
    }

    function showEditProfileModal(container, center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';
        
        const social = center.social_links || {};

        overlay.innerHTML = `
            <div class="wc-modal">
                <div class="wc-modal-header">
                    <h2 class="wc-title">Editar Perfil del Centro</h2>
                    <button class="wc-close-btn">&times;</button>
                </div>
                
                <form id="wc-edit-profile-form">
                    <h3 class="wc-section-title">Marca y Logo</h3>
                    <div class="wc-logo-preview-container">
                        <img src="${center.logo_url || 'https://via.placeholder.com/80'}" class="wc-logo-preview" id="logo-preview-img">
                        <div style="flex:1;">
                            <p style="font-size:0.8rem; color:#64748b; margin-bottom:10px;">Recomendado: Imagen cuadrada, min 200x200px (PNG o JPG).</p>
                            <input type="file" id="wc-logo-input" accept="image/*" style="display:none;">
                            <button type="button" id="btn-select-logo" class="wc-btn wc-btn-secondary" style="padding:8px 15px; font-size:0.9rem;">Seleccionar Imagen</button>
                        </div>
                    </div>

                    <h3 class="wc-section-title">Información de Contacto</h3>
                    <div class="wc-form-group">
                        <label class="wc-label">Nombre del Establecimiento</label>
                        <input type="text" name="establishment_name" class="wc-input" value="${center.establishment_name || ''}" placeholder="Ej: Clínica Vet Pata Amiga">
                    </div>
                    
                    <div class="wc-form-group">
                        <label class="wc-label">Teléfono de Contacto</label>
                        <input type="tel" name="phone" class="wc-input" value="${center.phone || ''}" placeholder="Ej: 5512345678">
                    </div>

                    <h3 class="wc-section-title">Ubicación y Geolocalización</h3>
                    <div class="wc-form-group">
                        <label class="wc-label">Dirección Completa</label>
                        <textarea name="address" id="wc-address-input" class="wc-input" style="min-height:80px;" placeholder="Calle, número, colonia, CP y ciudad">${center.address || ''}</textarea>
                    </div>

                    <div class="wc-input-row">
                        <div class="wc-form-group">
                            <label class="wc-label">Latitud</label>
                            <input type="number" step="any" name="lat" id="wc-lat" class="wc-input" value="${center.lat || ''}" placeholder="Ej: 19.4326">
                        </div>
                        <div class="wc-form-group">
                            <label class="wc-label">Longitud</label>
                            <input type="number" step="any" name="lng" id="wc-lng" class="wc-input" value="${center.lng || ''}" placeholder="Ej: -99.1332">
                        </div>
                    </div>
                    <button type="button" id="btn-get-location" class="wc-btn" style="width:100%; margin-bottom:20px; font-size:0.9rem;">📍 Obtener mi ubicación actual</button>

                    <h3 class="wc-section-title">Redes Sociales</h3>
                    <div class="wc-input-row">
                        <div class="wc-form-group">
                            <label class="wc-label">Instagram (URL)</label>
                            <input type="url" name="social_instagram" class="wc-input" value="${social.instagram || ''}" placeholder="https://instagram.com/...">
                        </div>
                        <div class="wc-form-group">
                            <label class="wc-label">Facebook (URL)</label>
                            <input type="url" name="social_facebook" class="wc-input" value="${social.facebook || ''}" placeholder="https://facebook.com/...">
                        </div>
                    </div>
                    <div class="wc-input-row">
                        <div class="wc-form-group">
                            <label class="wc-label">TikTok (URL)</label>
                            <input type="url" name="social_tiktok" class="wc-input" value="${social.tiktok || ''}" placeholder="https://tiktok.com/@...">
                        </div>
                        <div class="wc-form-group">
                            <label class="wc-label">Sitio Web</label>
                            <input type="url" name="social_website" class="wc-input" value="${social.website || ''}" placeholder="https://...">
                        </div>
                    </div>

                    <h3 class="wc-section-title">Promoción para Miembros</h3>
                    <div class="wc-form-group">
                        <label class="wc-label">Descripción del Beneficio</label>
                        <textarea name="promotion_details" class="wc-input" style="min-height:100px;" placeholder="Ej: 15% de descuento en consultas generales y 10% en farmacia.">${center.promotion_details || ''}</textarea>
                    </div>

                    <div style="margin-top:30px;">
                        <button type="submit" id="btn-save-profile" class="wc-btn wc-btn-primary" style="width:100%;">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(overlay);

        // Geolocation logic
        overlay.querySelector('#btn-get-location').addEventListener('click', () => {
            if ("geolocation" in navigator) {
                const btn = overlay.querySelector('#btn-get-location');
                btn.innerText = 'Obteniendo...';
                navigator.geolocation.getCurrentPosition((position) => {
                    overlay.querySelector('#wc-lat').value = position.coords.latitude.toFixed(8);
                    overlay.querySelector('#wc-lng').value = position.coords.longitude.toFixed(8);
                    btn.innerText = '✅ Ubicación obtenida';
                }, (error) => {
                    alert('Error al obtener ubicación. Por favor ingrésala manualmente.');
                    btn.innerText = '📍 Intentar de nuevo';
                });
            } else {
                alert('Tu navegador no soporta geolocalización.');
            }
        });

        // Logo upload logic
        const logoInput = overlay.querySelector('#wc-logo-input');
        overlay.querySelector('#btn-select-logo').addEventListener('click', () => logoInput.click());
        
        logoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const previewImg = overlay.querySelector('#logo-preview-img');
            const originalSrc = previewImg.src;
            previewImg.src = URL.createObjectURL(file);

            const btnSave = overlay.querySelector('#btn-save-profile');
            btnSave.disabled = true;
            btnSave.innerText = 'Subiendo logo...';

            const res = await handleLogoUpload(center, file);
            if (res.success) {
                center.logo_url = res.url; // Actualizar localmente
                alert('Logo subido correctamente');
            } else {
                alert('Error al subir logo: ' + res.error);
                previewImg.src = originalSrc;
            }
            btnSave.disabled = false;
            btnSave.innerText = 'Guardar Cambios';
        });

        // Google Places Autocomplete (if script loaded)
        if (window.google && window.google.maps && window.google.maps.places) {
            const addressInput = overlay.querySelector('#wc-address-input');
            const autocomplete = new google.maps.places.Autocomplete(addressInput);
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    overlay.querySelector('#wc-lat').value = place.geometry.location.lat().toFixed(8);
                    overlay.querySelector('#wc-lng').value = place.geometry.location.lng().toFixed(8);
                }
            });
        }

        // Form Submission
        overlay.querySelector('#wc-edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const updateData = {
                memberstack_id: center.memberstack_id,
                establishment_name: formData.get('establishment_name'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                lat: parseFloat(formData.get('lat')) || null,
                lng: parseFloat(formData.get('lng')) || null,
                promotion_details: formData.get('promotion_details'),
                social_links: {
                    instagram: formData.get('social_instagram'),
                    facebook: formData.get('social_facebook'),
                    tiktok: formData.get('social_tiktok'),
                    website: formData.get('social_website')
                }
            };

            const btn = overlay.querySelector('#btn-save-profile');
            btn.disabled = true;
            btn.innerText = 'Guardando...';

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                const result = await response.json();
                if (result.success) {
                    alert('Perfil actualizado con éxito');
                    overlay.remove();
                    init(); // Recargar todo
                } else {
                    alert('Error al actualizar: ' + result.error);
                    btn.disabled = false;
                    btn.innerText = 'Guardar Cambios';
                }
            } catch (error) {
                alert('Error de conexión');
                btn.disabled = false;
                btn.innerText = 'Guardar Cambios';
            }
        });

        overlay.querySelector('.wc-close-btn').addEventListener('click', () => overlay.remove());
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    async function init() {
        const target = document.getElementById('pata-wellness-dashboard');
        if (!target) return;

        // Inyectar estilos
        if (!document.getElementById('wc-styles')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'wc-styles';
            styleTag.innerHTML = STYLES;
            document.head.appendChild(styleTag);
        }

        renderLoading(target);

        // Esperar a Memberstack
        if (!window.$memberstackDom) {
            await new Promise(resolve => {
                const interval = setInterval(() => {
                    if (window.$memberstackDom) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 500);
            });
        }

        const memberResult = await window.$memberstackDom.getCurrentMember();
        if (!memberResult?.data) {
            target.innerHTML = `<p style="text-align:center; padding:50px;">Por favor, inicia sesión para acceder al panel.</p>`;
            return;
        }

        const center = await fetchCenterData(memberResult.data.id);
        if (!center) {
            target.innerHTML = `<p style="text-align:center; padding:50px;">No encontramos un registro de aliado vinculado a esta cuenta.</p>`;
            return;
        }

        if (center.status === 'cancelled') {
            renderBlocked(target);
        } else if (center.status === 'pending') {
            renderPending(target, center);
        } else if (center.status === 'rejected') {
            renderRejected(target, center);
        } else if (center.status === 'appealed') {
            renderAppealed(target, center);
        } else {
            renderDashboard(target, center);
        }
    }

    // Ejecutar al cargar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
