// ============================================
// Script de Depuración de Roles de Usuario
// ============================================

(function () {
    'use strict';

    if (!window.PATA_AMIGA_CONFIG) {
        window.PATA_AMIGA_CONFIG = {};
    }

    const CONFIG = {
        apiUrl: (window.PATA_AMIGA_CONFIG.apiUrl || 'https://app.pataamiga.mx') + '/api'
    };

    function showDebugUI() {
        // Crear botón de depuración
        const debugButton = document.createElement('div');
        debugButton.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 100000;
                background: #ff6b6b;
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                cursor: pointer;
                font-family: monospace;
                font-size: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            " onclick="toggleDebugPanel()">
                🐛 DEBUG ROLES
            </div>
        `;
        document.body.appendChild(debugButton);

        // Crear panel de depuración
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            width: 400px;
            max-height: 600px;
            background: white;
            border: 2px solid #ff6b6b;
                border-radius: 8px;
                padding: 20px;
                overflow-y: auto;
                z-index: 99999;
                font-family: monospace;
                font-size: 12px;
                display: none;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(debugPanel);

        // Función para alternar panel
        window.toggleDebugPanel = function() {
            const panel = document.getElementById('debug-panel');
            if (panel.style.display === 'none' || !panel.style.display) {
                panel.style.display = 'block';
                updateDebugInfo();
            } else {
                panel.style.display = 'none';
            }
        };

        // Función para actualizar información de depuración
        window.updateDebugInfo = async function() {
            const panel = document.getElementById('debug-panel');
            const member = await window.$memberstackDom.getCurrentMember();
            
            let html = '<h3>🔍 Información de Depuración</h3>';
            
            if (member && member.data && member.data.id) {
                html += `<p><strong>Memberstack ID:</strong> ${member.data.id}</p>`;
                html += `<p><strong>Email:</strong> ${member.data.auth?.email || 'No disponible'}</p>`;
                
                // Llamar API de depuración
                try {
                    const response = await fetch(`${CONFIG.apiUrl}/auth/debug-role`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ memberstackId: member.data.id })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        html += `<hr><h4>🎯 Resultado Final:</h4>`;
                        html += `<p><strong>Rol Detectado:</strong> <span style="color: ${getRoleColor(data.finalRole)}">${data.finalRole}</span></p>`;
                        html += `<p><strong>Motivo:</strong> ${data.reason}</p>`;
                        
                        html += `<hr><h4>📊 Detalles de Búsqueda:</h4>`;
                        html += `<p><strong>Tiempo Total:</strong> ${data.totalTimeMs}ms</p>`;
                        
                        // Detalles de cada check
                        Object.entries(data.checks).forEach(([checkName, checkData]) => {
                            const icon = getCheckIcon(checkName);
                            const color = checkData.found ? '#28a745' : '#dc3545';
                            html += `<p><strong>${icon} ${checkName}:</strong> <span style="color: ${color}">${checkData.found ? 'ENCONTRADO' : 'NO ENCONTRADO'}</span></p>`;
                            
                            if (checkData.found && checkData.data) {
                                if (checkName === 'admin') {
                                    html += `<p>&nbsp;&nbsp;👤 Role: ${checkData.data.role}</p>`;
                                } else if (checkName === 'wellness_center') {
                                    html += `<p>&nbsp;&nbsp;🏥 Status: ${checkData.data.status}</p>`;
                                    html += `<p>&nbsp;&nbsp;🏪 Nombre: ${checkData.data.establishment_name || 'No disponible'}</p>`;
                                    html += `<p>&nbsp;&nbsp;📧 Email: ${checkData.data.email}</p>`;
                                } else if (checkName === 'ambassador') {
                                    html += `<p>&nbsp;&nbsp;👤 Status: ${checkData.data.status}</p>`;
                                    html += `<p>&nbsp;&nbsp;👤 Nombre: ${checkData.data.name || 'No disponible'}</p>`;
                                } else if (checkName === 'memberstack_plan') {
                                    html += `<p>&nbsp;&nbsp;📋 Planes: ${checkData.data.plan_connections?.length || 0} conexiones</p>`;
                                }
                            }
                            
                            if (checkData.timeMs) {
                                html += `<p>&nbsp;&nbsp;⏱️ Tiempo: ${checkData.timeMs}ms</p>`;
                            }
                            html += '<br>';
                        });
                        
                        html += `<hr><button onclick="copyDebugInfo()" style="
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 8px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-top: 10px;
                        ">📋 Copiar Información</button>`;
                        
                    } else {
                        html += `<p style="color: red;">❌ Error: ${data.error}</p>`;
                    }
                } catch (error) {
                    html += `<p style="color: red;">❌ Error al llamar API: ${error.message}</p>`;
                }
            } else {
                html += '<p style="color: orange;">⚠️ No hay sesión activa</p>';
            }
            
            panel.innerHTML = html;
        };

        function getRoleColor(role) {
            const colors = {
                admin: '#dc3545',
                wellness_center: '#007bff',
                ambassador: '#28a745',
                member: '#6c757d'
            };
            return colors[role] || '#6c757d';
        }

        function getCheckIcon(checkName) {
            const icons = {
                admin: '👤',
                wellness_center: '🏥',
                ambassador: '🤝',
                memberstack_plan: '📋'
            };
            return icons[checkName] || '🔍';
        }

        window.copyDebugInfo = function() {
            const panel = document.getElementById('debug-panel');
            const text = panel.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const button = panel.querySelector('button');
                const originalText = button.textContent;
                button.textContent = '✅ Copiado!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            });
        };

        // Actualizar información cuando cambie la sesión
        if (window.$memberstackDom) {
            window.$memberstackDom.onAuthChange(function (event) {
                setTimeout(updateDebugInfo, 1000);
            });
        }

        // Actualizar periódicamente
        setInterval(updateDebugInfo, 5000);
    }

    // Iniciar depuración
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showDebugUI);
    } else {
        showDebugUI();
    }
})();