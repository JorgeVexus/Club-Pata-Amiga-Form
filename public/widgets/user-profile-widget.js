/**
 * Club Pata Amiga - User Profile Widget v1.0
 * Embebe en Webflow con: <div id="pata-profile"></div>
 */
(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        placeholderAvatar: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 96%22%3E%3Ccircle cx=%2248%22 cy=%2248%22 r=%2248%22 fill=%22%237DD8D5%22/%3E%3Ccircle cx=%2248%22 cy=%2236%22 r=%2216%22 fill=%22white%22/%3E%3Cellipse cx=%2248%22 cy=%2278%22 rx=%2226%22 ry=%2218%22 fill=%22white%22/%3E%3C/svg%3E'
    };

    const MONTHS = ['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const fmtDate = d => { 
        if(!d || d === 'null' || d === 'undefined') return '—'; 
        const x = new Date(d); 
        if (isNaN(x.getTime())) return '—';
        return x.getDate() + ' de ' + MONTHS[x.getMonth() + 1] + ' ' + x.getFullYear(); 
    };
    const fmtBirth = d => { if(!d) return '—'; const parts = d.split('-'); if(parts.length < 3) return d; const [y,m,day]=parts; return +day+' de '+MONTHS[+m]+', '+y; };
    const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : '';
    const BRAND_SVGS = {
        mastercard: '<svg viewBox="0 0 50 32" width="50" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="32" rx="4" fill="#252525"/><circle cx="19" cy="16" r="10" fill="#EB001B"/><circle cx="31" cy="16" r="10" fill="#F79E1B"/><path d="M25 8.3a10 10 0 0 1 0 15.4A10 10 0 0 1 25 8.3z" fill="#FF5F00"/></svg>',
        visa: '<svg viewBox="0 0 50 32" width="50" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="32" rx="4" fill="#1A1F71"/><text x="8" y="22" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="white" letter-spacing="-1">VISA</text></svg>',
        amex: '<svg viewBox="0 0 50 32" width="50" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="32" rx="4" fill="#2E77BC"/><text x="5" y="21" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="white">AMERICAN</text><text x="5" y="29" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="white">EXPRESS</text></svg>',
        default: '<svg viewBox="0 0 50 32" width="50" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="32" rx="4" fill="#9b9b9b"/><rect x="4" y="10" width="42" height="6" rx="2" fill="#ccc"/><rect x="4" y="20" width="14" height="4" rx="1" fill="#ccc"/></svg>'
    };
    const brandIcon = b => BRAND_SVGS[(b||'').toLowerCase()] || BRAND_SVGS.default;
    const brandName = (b,f) => (f==='debit'?'Débito ':f==='credit'?'Crédito ':'')+cap(b||'Tarjeta');

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @font-face { font-family:'Fraiche'; src:url('https://uploads-ssl.webflow.com/64b5687796068e860950337c/64b56b3e96068e860953a2a6_Fraiche.otf') format('opentype'); }

        .ppa-widget { font-family:'Outfit',sans-serif; max-width:900px; margin:0 auto; display:flex; flex-direction:column; gap:28px; }

        .ppa-card { background:#fff; border-radius:50px; padding:40px 50px; border:2px solid #000; box-shadow:8px 8px 0 rgba(0,0,0,.06); position:relative; }
        .ppa-card-green { background:#9fd406; border-radius:50px; padding:40px 50px; border:2px solid #000; box-shadow:8px 8px 0 rgba(0,0,0,.1); position:relative; }

        .ppa-header-row { display:flex; align-items:flex-start; gap:28px; margin-bottom:32px; }
        .ppa-avatar-wrap { display:flex; flex-direction:column; align-items:center; gap:6px; flex-shrink:0; cursor:pointer; }
        .ppa-avatar { width:96px; height:96px; border-radius:50%; object-fit:cover; border:2px solid #000; background:#7DD8D5; display:block; }
        .ppa-avatar-label { font-size:11px; font-weight:700; color:#000; }
        .ppa-member-info { flex:1; }
        .ppa-member-name { font-family:'Fraiche',sans-serif; font-size:clamp(44px,8vw,80px); color:#000; margin:0; line-height:1; text-transform:lowercase; }
        .ppa-member-since { font-size:17px; color:#9b9b9b; margin:6px 0 0; font-weight:400; }
        .ppa-section-title { font-family:'Fraiche',sans-serif; font-size:clamp(30px,5vw,50px); color:#000; margin:0 0 20px; line-height:1.1; text-transform:lowercase; }
        .ppa-section-title-wh { font-family:'Fraiche',sans-serif; font-size:clamp(38px,7vw,80px); color:#fff; margin:0 0 28px; line-height:1; text-transform:lowercase; }

        .ppa-edit-btn { position:absolute; top:28px; right:28px; background:#9fd406; border:2px solid #000; border-radius:50px; padding:6px 16px 6px 10px; font-size:12px; font-weight:700; color:#fff; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; font-family:'Outfit',sans-serif; }
        .ppa-edit-btn:hover { transform:translateY(-2px); box-shadow:4px 4px 0 rgba(0,0,0,.1); }

        .ppa-data-rows { display:flex; flex-direction:column; gap:12px; }
        .ppa-data-row { display:flex; align-items:center; border:1px solid #9b9b9b; border-radius:50px; background:#fff; overflow:hidden; min-height:54px; }
        .ppa-row-icon { width:54px; height:54px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:22px; }
        .ppa-row-texts { flex:1; padding-right:16px; }
        .ppa-row-label { font-size:13px; font-weight:700; color:rgba(0,0,0,.5); margin:0; line-height:1.2; }
        .ppa-row-value { font-size:15px; font-weight:400; color:#000; margin:0; line-height:1.3; }

        .ppa-stats-row { display:flex; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
        .ppa-stat-card { background:#fff; border-radius:16px; padding:16px 20px; flex:1; min-width:130px; text-align:center; }
        .ppa-stat-label { font-size:13px; font-weight:700; color:#9b9b9b; margin:0 0 4px; }
        .ppa-stat-value { font-family:'Fraiche',sans-serif; font-size:28px; color:#000; margin:0; text-transform:lowercase; }
        .ppa-payment-box { background:#fff; border-radius:40px; padding:20px 30px; margin-bottom:16px; }
        .ppa-payment-top { display:flex; align-items:center; justify-content:space-between; padding-bottom:12px; border-bottom:2px dashed #15BEB2; margin-bottom:12px; }
        .ppa-payment-left { display:flex; align-items:center; gap:14px; }
        .ppa-card-brand { line-height:1; display:flex; align-items:center; }
        .ppa-card-label { font-size:12px; font-weight:700; color:#9b9b9b; margin:0; }
        .ppa-card-name { font-size:17px; font-weight:700; color:#000; margin:0; }
        .ppa-payment-right { text-align:right; }
        .ppa-link-btn { background:none; border:none; cursor:pointer; font-family:'Outfit',sans-serif; font-size:13px; font-weight:700; color:#000; opacity:.6; text-decoration:underline; padding:4px 0; display:block; transition:opacity .2s; }
        .ppa-link-btn:hover { opacity:1; }
        .ppa-payment-bottom { display:flex; align-items:center; justify-content:space-between; }
        .ppa-add-payment { display:flex; align-items:center; gap:10px; cursor:pointer; background:none; border:none; font-family:'Outfit',sans-serif; font-size:14px; font-weight:700; color:#000; padding:0; }
        .ppa-add-circle { width:30px; height:30px; border-radius:50%; border:2px solid #000; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; }
        .ppa-cancel-link { text-align:center; margin-top:16px; }
        .ppa-cancel-btn { background:none; border:none; cursor:pointer; font-family:'Outfit',sans-serif; font-size:13px; font-weight:700; color:#000; opacity:.5; text-decoration:underline; transition:all .2s; }
        .ppa-cancel-btn:hover { opacity:.9; color:#E53E3E; }

        .ppa-role-meta { margin-bottom:20px; }
        .ppa-role-type { font-size:14px; color:rgba(0,0,0,.5); font-weight:500; margin:0; }
        .ppa-role-count { font-size:18px; font-weight:700; color:#000; margin:2px 0 0; }
        .ppa-pata-float { position:absolute; bottom:20px; right:20px; width:58px; height:58px; background:#FE8F15; border-radius:50%; border:2px solid #000; display:flex; align-items:center; justify-content:center; font-size:26px; }

        .ppa-amb-badge { display:inline-flex; align-items:center; gap:8px; background:#9fd406; border:2px solid #000; border-radius:50px; padding:6px 16px; font-size:12px; font-weight:800; color:#000; text-transform:uppercase; margin-bottom:20px; }
        .ppa-amb-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin-bottom:20px; }
        .ppa-amb-card { background:#f8f8f8; border-radius:20px; padding:16px; text-align:center; border:2px solid #eee; }
        .ppa-amb-val { font-family:'Fraiche',sans-serif; font-size:40px; color:#15BEB2; margin:0; line-height:1; }
        .ppa-amb-lbl { font-size:11px; font-weight:700; color:#888; margin:4px 0 0; text-transform:uppercase; }
        .ppa-ref-box { background:#f0fefe; border:2px dashed #15BEB2; border-radius:20px; padding:14px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .ppa-ref-code { font-family:'Fraiche',sans-serif; font-size:28px; color:#15BEB2; letter-spacing:2px; }
        .ppa-copy-btn { background:#15BEB2; color:#fff; border:2px solid #000; border-radius:50px; padding:8px 18px; font-size:13px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; transition:all .2s; }
        .ppa-copy-btn:hover { transform:scale(1.05); }

        .ppa-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:100000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(8px); animation:ppaFI .2s ease; }
        .ppa-modal { background:#fff; border-radius:40px; border:3px solid #000; padding:40px; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; box-shadow:12px 12px 0 rgba(0,0,0,.1); animation:ppaSU .3s ease; position:relative; }
        .ppa-modal-title { font-family:'Fraiche',sans-serif; font-size:36px; margin:0 0 28px; color:#000; text-transform:lowercase; }
        .ppa-modal-x { position:absolute; top:18px; right:18px; width:36px; height:36px; border-radius:50%; border:2px solid #000; background:#f0f0f0; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; }
        .ppa-fg { margin-bottom:16px; }
        .ppa-fl { font-size:13px; font-weight:700; color:#555; margin-bottom:5px; display:block; }
        .ppa-fi { width:100%; padding:13px 20px; border:2px solid #e0e0e0; border-radius:50px; font-family:'Outfit',sans-serif; font-size:15px; outline:none; transition:border-color .2s; }
        .ppa-fi:focus { border-color:#15BEB2; }
        .ppa-fi:disabled { background:#f5f5f5; color:#999; cursor:default; }
        .ppa-fr { display:flex; gap:12px; }
        .ppa-fr .ppa-fg { flex:1; }
        .ppa-save-btn { width:100%; background:#FE8F15; color:#fff; border:2px solid #000; border-radius:50px; padding:15px; font-family:'Fraiche',sans-serif; font-size:22px; cursor:pointer; transition:all .2s; margin-top:8px; text-transform:lowercase; }
        .ppa-save-btn:hover { transform:translateY(-2px); box-shadow:6px 6px 0 rgba(0,0,0,.1); }
        .ppa-save-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; box-shadow:none; }
        .ppa-msg { margin-top:10px; text-align:center; font-size:14px; font-weight:700; }
        .ppa-msg-ok { color:#38A169; } .ppa-msg-err { color:#E53E3E; }

        .ppa-cancel-overlay { position:fixed; inset:0; background:rgba(0,0,0,.58); z-index:100001; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(8px); animation:ppaFI .2s ease; }
        .ppa-cancel-modal { background:#fff; border-radius:40px; border:3px solid #000; padding:40px; width:100%; max-width:580px; max-height:90vh; overflow-y:auto; box-shadow:12px 12px 0 rgba(0,0,0,.14); animation:ppaSU .3s ease; position:relative; font-family:'Outfit',sans-serif; }
        .ppa-cancel-title { font-family:'Fraiche',sans-serif; font-size:38px; color:#000; margin:0 0 10px; line-height:1; text-transform:lowercase; text-align:center; }
        .ppa-cancel-subtitle { font-size:16px; color:#3a3a3a; line-height:1.55; margin:0 0 24px; text-align:center; }
        .ppa-cancel-link-inline { color:#00BBB4; text-decoration:none; font-weight:900; border-bottom:2px dotted #00BBB4; cursor:pointer; background:none; border-top:none; border-left:none; border-right:none; padding:0; font-family:'Outfit',sans-serif; }
        .ppa-cancel-link-inline:hover { color:#0a8984; border-bottom-style:solid; }
        .ppa-cancel-options { margin:20px 0; display:flex; flex-direction:column; gap:10px; }
        .ppa-cancel-option { display:flex; align-items:center; gap:12px; padding:13px 16px; border:2px solid #e0e0e0; border-radius:28px; cursor:pointer; transition:all .2s; font-size:15px; background:#fff; }
        .ppa-cancel-option:hover { border-color:#00BBB4; background:#f0fffd; }
        .ppa-cancel-option.selected { border-color:#00BBB4; background:#e1fffb; font-weight:800; box-shadow:4px 4px 0 rgba(0,0,0,.08); }
        .ppa-cancel-option input { width:20px; height:20px; accent-color:#00BBB4; flex-shrink:0; }
        .ppa-cancel-other-input { width:100%; padding:13px 18px; border:2px solid #e0e0e0; border-radius:24px; font-family:'Outfit',sans-serif; font-size:15px; outline:none; }
        .ppa-cancel-textarea { width:100%; padding:14px 18px; border:2px solid #e0e0e0; border-radius:22px; font-family:'Outfit',sans-serif; font-size:15px; min-height:96px; resize:vertical; outline:none; }
        .ppa-cancel-other-input:focus,.ppa-cancel-textarea:focus { border-color:#00BBB4; }
        .ppa-cancel-confirm-box { display:flex; align-items:center; gap:12px; padding:14px 16px; background:#fffce7; border:2px dashed #000; border-radius:22px; margin:18px 0; font-size:15px; font-weight:800; color:#000; }
        .ppa-cancel-confirm-box input { width:22px; height:22px; accent-color:#E53E3E; flex-shrink:0; }
        .ppa-cancel-actions { display:flex; gap:12px; margin-top:22px; }
        .ppa-cancel-btn-primary,.ppa-cancel-btn-secondary { width:100%; border:2px solid #000; border-radius:50px; padding:15px 18px; cursor:pointer; transition:all .2s; font-family:'Fraiche',sans-serif; font-size:22px; text-transform:lowercase; }
        .ppa-cancel-btn-primary { background:#E53E3E; color:#fff; }
        .ppa-cancel-btn-primary:hover { transform:translateY(-2px); box-shadow:6px 6px 0 rgba(0,0,0,.12); }
        .ppa-cancel-btn-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }
        .ppa-cancel-btn-secondary { background:#fff; color:#000; }
        .ppa-cancel-btn-secondary:hover { background:#fffc67; }
        .ppa-cancel-modal-x { position:absolute; top:18px; right:18px; width:36px; height:36px; border-radius:50%; border:2px solid #000; background:#f5f5f5; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; }
        .ppa-cancel-detail { background:#f0fffd; border:2px solid #00BBB4; border-radius:24px; padding:16px; text-align:center; font-weight:800; margin:18px 0; }
        .ppa-terms-modal { max-width:760px; display:flex; flex-direction:column; }
        .ppa-terms-viewer { width:100%; max-height:58vh; overflow-y:auto; background:#fff; border:2px solid #E2E8F0; border-radius:18px; padding:22px; margin-top:18px; font-family:'Outfit',sans-serif; font-size:14px; line-height:1.62; color:#2D3748; text-align:justify; box-shadow:inset 0 2px 8px rgba(0,0,0,.05); }
        .ppa-terms-viewer::-webkit-scrollbar { width:8px; }
        .ppa-terms-viewer::-webkit-scrollbar-track { background:#F7FAFC; border-radius:8px; }
        .ppa-terms-viewer::-webkit-scrollbar-thumb { background:#CBD5E0; border-radius:8px; }
        .ppa-terms-text-header { color:#00BBB4; font-family:'Fraiche',sans-serif; font-size:22px; margin:22px 0 10px; border-bottom:1px solid #E2E8F0; padding-bottom:6px; text-align:left; line-height:1.1; text-transform:lowercase; }
        .ppa-terms-text-line { margin:0 0 12px; white-space:pre-wrap; word-break:break-word; }
        .ppa-terms-loading { padding:32px; text-align:center; color:#718096; font-weight:800; }

        @keyframes ppaFI { from{opacity:0} to{opacity:1} }
        @keyframes ppaSU { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        @media(max-width:640px) {
            .ppa-card,.ppa-card-green { padding:26px 22px; }
            .ppa-header-row { flex-direction:column; align-items:center; text-align:center; }
            .ppa-edit-btn { position:static; margin-top:10px; align-self:center; }
            .ppa-stats-row { flex-direction:column; }
            .ppa-payment-top { flex-direction:column; gap:10px; }
            .ppa-payment-right { display:flex; gap:14px; }
            .ppa-fr { flex-direction:column; gap:0; }
            .ppa-cancel-modal { padding:28px 22px; border-radius:28px; }
            .ppa-cancel-title { font-size:30px; }
            .ppa-cancel-actions { flex-direction:column-reverse; }
            .ppa-terms-viewer { max-height:56vh; padding:16px; font-size:13px; }
        }
    `;
    class UserProfileWidget {
        constructor() {
            this.member = null;
            this.user = null;
            this.paymentMethod = null;
            this.ambassador = null;
            this.pets = [];
            this.photoFile = null;
        }

        async init() {
            const container = document.getElementById('pata-profile');
            if (!container) return;
            this.injectStyles();
            container.innerHTML = '<div class="ppa-widget"><div style="text-align:center;padding:60px;font-family:Outfit,sans-serif;color:#666;font-size:16px;">Cargando tu perfil...</div></div>';
            await this.waitForMemberstack();
        }

        injectStyles() {
            if (document.getElementById('ppa-styles')) return;
            const s = document.createElement('style');
            s.id = 'ppa-styles';
            s.textContent = STYLES;
            document.head.appendChild(s);
        }

        async waitForMemberstack() {
            let tries = 0;
            const attempt = async () => {
                try {
                    const res = await window.$memberstackDom.getCurrentMember();
                    if (res?.data) {
                        this.member = res.data;
                        await this.loadData();
                    } else {
                        document.getElementById('pata-profile').innerHTML = '<div class="ppa-widget"><div style="text-align:center;padding:60px;font-family:Outfit,sans-serif;">Inicia sesión para ver tu perfil.</div></div>';
                    }
                } catch(e) {
                    if (++tries < 20) setTimeout(attempt, 500);
                    else console.error('[ProfileWidget] Memberstack no disponible', e);
                }
            };
            attempt();
        }

        async loadData() {
            const id = this.member.id;
            try {
                const [profRes, pmRes, ambRes, wellRes] = await Promise.allSettled([
                    fetch(`${CONFIG.apiUrl}/api/user/profile?memberstackId=${id}`).then(r=>r.json()),
                    fetch(`${CONFIG.apiUrl}/api/user/payment-method?memberstackId=${id}`).then(r=>r.json()),
                    fetch(`${CONFIG.apiUrl}/api/ambassadors/by-memberstack?memberstackId=${id}`).then(r=>r.json()),
                    fetch(`${CONFIG.apiUrl}/api/wellness/me?memberstack_id=${id}`).then(r=>r.json())
                ]);

                if (wellRes.status === 'fulfilled' && wellRes.value.success && wellRes.value.data) {
                    this.isWellnessCenter = true;
                    this.wellnessCenter = wellRes.value.data;
                } else {
                    this.isWellnessCenter = false;
                }

                if (profRes.status==='fulfilled' && profRes.value.success) {
                    this.user = profRes.value.user;
                }
                if (pmRes.status==='fulfilled' && pmRes.value.success) {
                    this.paymentMethod = pmRes.value.paymentMethod;
                }
                if (ambRes.status==='fulfilled' && ambRes.value.success && ambRes.value.ambassador) {
                    this.ambassador = ambRes.value.ambassador;
                }

                // Cargar mascotas del usuario con cache buster (solo si no es centro de bienestar)
                if (!this.isWellnessCenter) {
                    const petsRes = await fetch(`${CONFIG.apiUrl}/api/user/pets?userId=${id}&t=${Date.now()}`).then(r=>r.json()).catch(()=>null);
                    if (petsRes?.success) this.pets = petsRes.pets || [];
                }

            } catch(e) {
                console.error('[ProfileWidget] Error cargando datos:', e);
            }
            this.render();
        }

        render() {
            const container = document.getElementById('pata-profile');
            if (!container) return;
            container.innerHTML = `<div class="ppa-widget">
                ${this.renderSection1()}
                ${this.isWellnessCenter ? '' : this.renderSection2()}
                ${this.renderSection3()}
            </div>`;
            this.bindEvents();
        }

        renderSection1() {
            if (this.isWellnessCenter) {
                const c = this.wellnessCenter || {};
                const name = c.establishment_name || c.name || 'Centro de Bienestar';
                const since = c.created_at ? 'Aliado desde ' + this.getMonthYear(c.created_at) : 'Bienvenido';
                const email = c.email || this.member?.auth?.email || '—';
                const phone = c.phone || '—';
                const addr = c.address || '—';
                const photoBase = c.logo_url || CONFIG.placeholderAvatar;
                const photo = photoBase.includes('supabase.co') ? `${photoBase}?t=${new Date().getTime()}` : photoBase;

                return `<div class="ppa-card">
                    <div class="ppa-header-row">
                        <div class="ppa-avatar-wrap" id="ppa-avatar-wrap">
                            <img class="ppa-avatar" id="ppa-avatar-img" src="${photo}" alt="Logo del centro" onerror="this.src='${CONFIG.placeholderAvatar}'" />
                            <span class="ppa-avatar-label">📷 Cambiar logo</span>
                            <input type="file" id="ppa-photo-input" accept="image/*" style="display:none" />
                        </div>
                        <div class="ppa-member-info">
                            <h1 class="ppa-member-name">${name.toLowerCase()}</h1>
                            <p class="ppa-member-since">${since}</p>
                        </div>
                    </div>
                    <button class="ppa-edit-btn" id="ppa-edit-btn">✏️ editar información</button>
                    <h2 class="ppa-section-title">datos del centro</h2>
                    <div class="ppa-data-rows">
                        ${this.dataRow('✉️','Correo electrónico',email,true)}
                        ${this.dataRow('📱','Teléfono de contacto',phone)}
                        ${this.dataRow('📍','Dirección principal',addr)}
                        ${c.services && c.services.length > 0 ? this.dataRow('🩺','Servicios ofrecidos', c.services.join(', ')) : ''}
                    </div>
                </div>`;
            }

            const u = this.user || {};
            const name = [u.first_name, u.last_name, u.mother_last_name].filter(Boolean).join(' ') || this.member?.auth?.email?.split('@')[0] || 'Usuario';
            const since = u.registration_date ? 'Miembro desde ' + this.getMonthYear(u.registration_date) : 'Bienvenido';
            const email = this.member?.auth?.email || u.email || '—';
            const phone = u.phone || '—';
            const addr = this.buildAddress(u);
            const birth = fmtBirth(u.birth_date);
            const photoBase = u.avatar_url || CONFIG.placeholderAvatar;
            const photo = photoBase.includes('supabase.co') ? `${photoBase}?t=${new Date().getTime()}` : photoBase;

            return `<div class="ppa-card">
                <div class="ppa-header-row">
                    <div class="ppa-avatar-wrap" id="ppa-avatar-wrap">
                        <img class="ppa-avatar" id="ppa-avatar-img" src="${photo}" alt="Foto de perfil" onerror="this.src='${CONFIG.placeholderAvatar}'" />
                        <span class="ppa-avatar-label">📷 Agregar foto</span>
                        <input type="file" id="ppa-photo-input" accept="image/*" style="display:none" />
                    </div>
                    <div class="ppa-member-info">
                        <h1 class="ppa-member-name">${name.toLowerCase()}</h1>
                        <p class="ppa-member-since">${since}</p>
                    </div>
                </div>
                <button class="ppa-edit-btn" id="ppa-edit-btn">✏️ editar información</button>
                <h2 class="ppa-section-title">datos personales</h2>
                <div class="ppa-data-rows">
                    ${this.dataRow('✉️','Correo electrónico',email,true)}
                    ${this.dataRow('📱','Teléfono celular',phone)}
                    ${this.dataRow('📍','Dirección',addr)}
                    ${this.dataRow('🗓️','Fecha de nacimiento',birth)}
                </div>
            </div>`;
        }

        dataRow(icon, label, value, readonly=false) {
            return `<div class="ppa-data-row">
                <div class="ppa-row-icon">${icon}</div>
                <div class="ppa-row-texts">
                    <p class="ppa-row-label">${label}${readonly?' <span style="font-size:10px;opacity:.6">(no editable)</span>':''}</p>
                    <p class="ppa-row-value">${value || '—'}</p>
                </div>
            </div>`;
        }

        buildAddress(u) {
            const parts = [u.colony, u.city, u.state, u.postal_code ? 'C.P. '+u.postal_code : null].filter(Boolean);
            return parts.length > 0 ? parts.join(', ') : '—';
        }

        getMonthYear(iso) {
            if (!iso) return '';
            const d = new Date(iso);
            return cap(MONTHS[d.getMonth()+1]) + ' de ' + d.getFullYear();
        }

        renderSection2() {
            const u = this.user || {};
            const pm = this.paymentMethod;
            console.log('[DEBUG] PaymentMethod Info:', {
                next_date: pm?.next_payment_date,
                plan: pm?.plan_name,
                cost: pm?.plan_cost,
                debug: pm?._debug_sub,
                is_cancelled: pm?.is_cancelled,
                membership_end_date: pm?.membership_end_date,
                cancelled_at: pm?.cancelled_at
            });
            
            // 🆕 Verificar si la membresía está cancelada
            const isCancelled = pm?.is_cancelled === true;
            const membershipEndDate = pm?.membership_end_date;
            
            const planName = pm?.interval || u.plan_name || (pm ? 'Plan activo' : 'Sin plan');
            const planCost = pm?.plan_cost ? '$' + pm.plan_cost.toLocaleString('es-MX') : (u.plan_cost ? '$'+u.plan_cost : '—');
            
            // 🆕 Si está cancelada, mostrar "Apoyo hasta" en lugar de "Próximo pago"
            let nextPayLabel = 'Próximo pago';
            let nextPayValue = fmtDate(pm?.next_payment_date);
            if (isCancelled && membershipEndDate) {
                nextPayLabel = 'Membresía cancelada · Apoyo hasta';
                nextPayValue = fmtDate(membershipEndDate);
            } else if (!pm?.next_payment_date || !isCancelled) {
                nextPayValue = fmtDate(pm?.next_payment_date);
            }

            const pmHtml = pm ? `
                <div class="ppa-payment-top">
                    <div class="ppa-payment-left">
                        <div class="ppa-card-brand">${brandIcon(pm.brand)}</div>
                        <div>
                            <p class="ppa-card-label">Cuenta registrada</p>
                            <p class="ppa-card-name">${brandName(pm.brand,pm.funding)} •••• ${pm.last4}</p>
                        </div>
                    </div>
                    <div class="ppa-payment-right">
                        <button class="ppa-link-btn" id="ppa-portal-default">Predeterminado</button>
                        <button class="ppa-link-btn" id="ppa-portal-delete">Eliminar tarjeta</button>
                    </div>
                </div>
                <div class="ppa-payment-bottom">
                    <button class="ppa-add-payment" id="ppa-portal-add"><span class="ppa-add-circle">+</span> Agregar otro método de pago</button>
                    <button class="ppa-link-btn" id="ppa-portal-history">Ver historial de pagos</button>
                </div>` : `
                <div style="text-align:center;padding:20px 0;">
                    <button class="ppa-add-payment" id="ppa-portal-add" style="margin:0 auto;"><span class="ppa-add-circle">+</span> Agregar método de pago</button>
                </div>`;

            return `<div class="ppa-card-green">
                <div class="ppa-pata-float">🐾</div>
                <h2 class="ppa-section-title-wh">información de<br>membresía</h2>
                <div class="ppa-stats-row">
                    <div class="ppa-stat-card"><p class="ppa-stat-label">${isCancelled ? 'Membresía cancelada' : 'Membresía activa'}</p><p class="ppa-stat-value" style="color:${isCancelled ? '#E53E3E' : 'inherit'}">${planName}</p></div>
                    <div class="ppa-stat-card"><p class="ppa-stat-label">Costo</p><p class="ppa-stat-value">${planCost}</p></div>
                    <div class="ppa-stat-card"><p class="ppa-stat-label">${nextPayLabel}</p><p class="ppa-stat-value" style="font-size:20px; color:${isCancelled ? '#E53E3E' : 'inherit'}">${nextPayValue}</p></div>
                </div>
                <div class="ppa-payment-box">${pmHtml}</div>
                <div class="ppa-cancel-link"><button class="ppa-cancel-btn" id="ppa-cancel-btn" ${isCancelled ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>${isCancelled ? 'Ya cancelada · No renovará' : 'Cancelar membresía'}</button></div>
            </div>`;
        }
        renderSection3() {
            if (this.isWellnessCenter) {
                const c = this.wellnessCenter || {};
                const locations = c.locations || [];
                const locationCount = locations.length;

                let locationsHtml = '';
                if (locationCount > 0) {
                    locationsHtml = `
                        <div style="margin-top:20px;border-top:1px solid #f0f0f0;padding-top:20px;">
                            <h3 style="font-family:'Fraiche',sans-serif;font-size:24px;margin:0 0 14px;text-transform:lowercase">sucursales registradas</h3>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                ${locations.map((loc, idx) => `
                                    <div style="padding:14px 20px;border:2px solid #000;border-radius:20px;background:#f9f9f9;display:flex;align-items:center;gap:12px;">
                                        <div style="flex:1;">
                                            <p style="margin:0;font-weight:700;font-size:16px;">${loc.name || `Sucursal ${idx + 1}`}</p>
                                            <p style="margin:4px 0 0;font-size:14px;color:#666;">📍 ${loc.address}</p>
                                            ${loc.phone ? `<p style="margin:2px 0 0;font-size:13px;color:#666;">📞 ${loc.phone}</p>` : ''}
                                        </div>
                                        ${loc.is_primary ? `<span style="background:#00BBB4;color:#fff;font-size:10px;font-weight:800;padding:4px 10px;border-radius:50px;border:1px solid #000;text-transform:uppercase;margin-left:auto;white-space:nowrap;">Principal</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    locationsHtml = `
                        <div style="margin-top:20px;border-top:1px solid #f0f0f0;padding-top:20px;text-align:center;color:#9b9b9b;">
                            No tienes sucursales adicionales registradas.
                        </div>
                    `;
                }

                const statusColors = { approved:'#38A169', pending:'#FE8F15', waiting_approval:'#FE8F15', rejected:'#E53E3E', appealed:'#7B1FA2' };
                const statusLabels = { approved:'Aprobado', pending:'Pendiente de pago', waiting_approval:'En revisión', rejected:'Rechazado', appealed:'Apelado' };
                const color = statusColors[c.status] || '#9b9b9b';
                const label = statusLabels[c.status] || c.status;

                return `<div class="ppa-card">
                    <div class="ppa-pata-float">🐾</div>
                    <h2 class="ppa-section-title">roles en pata amiga</h2>
                    <div class="ppa-role-meta" style="margin-bottom:0;">
                        <p class="ppa-role-type">Establecimiento Aliado</p>
                        <p class="ppa-role-count">Centro de Bienestar</p>
                        <div style="margin-top:12px;">
                            <span style="display:inline-block;padding:6px 16px;border-radius:50px;background:${color};color:#fff;font-size:12px;font-weight:800;border:2px solid #000;text-transform:uppercase;">${label}</span>
                        </div>
                    </div>
                    ${locationsHtml}
                </div>`;
            }

            const isAmbassador = !!this.ambassador;
            const petCount = this.pets.length;
            const ambSection = isAmbassador ? this.renderAmbassadorView() : '';

            // El id 'pata-amiga-manada-widget' es el que busca pet-cards-widget.js
            // Se expone directamente para que el retry loop lo encuentre inmediatamente
            return `<div class="ppa-card">
                <div class="ppa-pata-float">🐾</div>
                <h2 class="ppa-section-title">roles en pata amiga</h2>
                ${ambSection}
                <div class="ppa-role-meta">
                    <p class="ppa-role-type">Miembro del club</p>
                    <p class="ppa-role-count">${petCount} peludo${petCount !== 1 ? 's' : ''} registrado${petCount !== 1 ? 's' : ''}</p>
                </div>
                <div id="pata-amiga-manada-widget"></div>
            </div>`;
        }



        renderAmbassadorView() {
            const a = this.ambassador;
            return `<div style="margin-bottom:28px">
                <div class="ppa-amb-badge">⭐ Embajador Pata Amiga</div>
                <div class="ppa-amb-grid">
                    <div class="ppa-amb-card"><p class="ppa-amb-val">${a.total_referrals || 0}</p><p class="ppa-amb-lbl">Total referidos</p></div>
                    <div class="ppa-amb-card"><p class="ppa-amb-val">${a.active_referrals || 0}</p><p class="ppa-amb-lbl">Referidos activos</p></div>
                    <div class="ppa-amb-card"><p class="ppa-amb-val" style="font-size:20px;color:${a.status==='active'?'#38A169':'#E53E3E'}">${a.status === 'active' ? '✅ Activo' : '⏸ Inactivo'}</p><p class="ppa-amb-lbl">Estado</p></div>
                </div>
                <div class="ppa-ref-box">
                    <div>
                        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9b9b9b">Tu código de referido</p>
                        <p class="ppa-ref-code" id="ppa-ref-code">${a.referral_code || '—'}</p>
                    </div>
                    <button class="ppa-copy-btn" id="ppa-copy-ref">📋 Copiar</button>
                </div>
            </div>`;
        }

        renderPetCard(p) {
            const statusColors = { approved:'#38A169', pending:'#FE8F15', waiting_approval:'#FE8F15', rejected:'#E53E3E', cancelled:'#9b9b9b' };
            const statusLabels = { approved:'Aprobado', pending:'En espera', waiting_approval:'En revisión', rejected:'Rechazado', cancelled:'Cancelado' };
            const color = statusColors[p.status] || '#9b9b9b';
            const label = statusLabels[p.status] || p.status;
            const photo = p.primary_photo_url || CONFIG.placeholderAvatar;
            const typeIcon = p.type?.toLowerCase().includes('gato') ? '🐱' : p.type?.toLowerCase().includes('perro') ? '🐶' : '🐾';

            return `<div style="display:inline-block;width:180px;margin:0 12px 16px 0;vertical-align:top;border:2px solid #000;border-radius:24px;overflow:hidden;background:#fff;box-shadow:4px 4px 0 rgba(0,0,0,.08)">
                <div style="width:100%;height:160px;overflow:hidden;background:#f0f0f0">
                    <img src="${photo}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.src='${CONFIG.placeholderAvatar}'" />
                </div>
                <div style="padding:12px">
                    <p style="font-family:'Fraiche',sans-serif;font-size:22px;margin:0 0 6px;text-transform:lowercase">${typeIcon} ${p.name}</p>
                    <span style="display:inline-block;padding:4px 12px;border-radius:50px;background:${color};color:#fff;font-size:11px;font-weight:700">${label}</span>
                </div>
            </div>`;
        }

        bindEvents() {
            // Foto de perfil
            const avatarWrap = document.getElementById('ppa-avatar-wrap');
            const photoInput = document.getElementById('ppa-photo-input');
            if (avatarWrap && photoInput) {
                avatarWrap.addEventListener('click', () => photoInput.click());
                photoInput.addEventListener('change', e => this.handlePhotoChange(e));
            }

            // Editar perfil
            const editBtn = document.getElementById('ppa-edit-btn');
            if (editBtn) editBtn.addEventListener('click', () => this.openEditModal());

            // Stripe portal buttons
            ['ppa-portal-default','ppa-portal-delete','ppa-portal-add','ppa-portal-history'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('click', () => this.openStripePortal());
            });

            // Cancelar membresía
            const cancelBtn = document.getElementById('ppa-cancel-btn');
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.openCancellationFlow());

            // Copiar código de referido
            const copyRef = document.getElementById('ppa-copy-ref');
            if (copyRef) {
                copyRef.addEventListener('click', () => {
                    const code = document.getElementById('ppa-ref-code')?.textContent;
                    if (code && code !== '—') {
                        navigator.clipboard.writeText(code).then(() => {
                            copyRef.textContent = '✅ Copiado';
                            setTimeout(() => copyRef.textContent = '📋 Copiar', 2000);
                        });
                    }
                });
            }
        }

        async openStripePortal() {
            try {
                await window.$memberstackDom.launchStripeCustomerPortal();
            } catch {
                alert('No se pudo abrir el portal de pagos. Intenta de nuevo.');
            }
        }

        escapeHtml(value) {
            return String(value || '').replace(/[&<>"']/g, ch => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[ch]));
        }

        async openCancellationFlow() {
            const wantsToContinue = await this.showCancelConfirmationModal();
            if (!wantsToContinue) return;

            const cancellationInfo = await this.showCancellationForm();
            if (!cancellationInfo) return;

            const endDateInfo = await this.fetchCancellationEndDate();
            if (!endDateInfo.success) {
                await this.showCancellationFeedbackModal({
                    title: 'no pudimos calcular tu fecha',
                    message: endDateInfo.error || 'Intenta de nuevo en unos minutos o contacta a soporte.'
                });
                return;
            }

            const finalConfirmation = await this.showFinalConfirmation(endDateInfo);
            if (!finalConfirmation) return;

            await this.executeCancellation(cancellationInfo, endDateInfo);
        }

        showCancelConfirmationModal() {
            return new Promise(resolve => {
                const overlay = this.createCancelModal(`
                    <button class="ppa-cancel-modal-x" id="ppa-cancel-step1-close">x</button>
                    <h2 class="ppa-cancel-title">cancelar membresia</h2>
                    <p class="ppa-cancel-subtitle">
                        Estas por proceder a la cancelacion de tu membresia Pata Amiga y despedirte de la manada.
                        <br><br>
                        <strong>Recuerda que no hay reembolsos</strong> de acuerdo con los terminos y condiciones.
                        <br>
                        <button type="button" class="ppa-cancel-link-inline" id="ppa-terms-link">Ver terminos y condiciones</button>
                    </p>
                    <div class="ppa-cancel-actions">
                        <button class="ppa-cancel-btn-secondary" id="ppa-cancel-step1-back">volver</button>
                        <button class="ppa-cancel-btn-primary" id="ppa-cancel-step1-continue">si, continuar</button>
                    </div>
                `);

                const close = value => { overlay.remove(); document.body.style.overflow = ''; resolve(value); };
                document.getElementById('ppa-terms-link').addEventListener('click', () => this.openTermsModal());
                document.getElementById('ppa-cancel-step1-close').addEventListener('click', () => close(false));
                document.getElementById('ppa-cancel-step1-back').addEventListener('click', () => close(false));
                document.getElementById('ppa-cancel-step1-continue').addEventListener('click', () => close(true));
                overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
            });
        }

        showCancellationForm() {
            return new Promise(resolve => {
                const reasons = [
                    { id: 'no_longer_needed', label: 'Ya no necesito el servicio' },
                    { id: 'price_too_high', label: 'El precio es muy alto' },
                    { id: 'found_alternative', label: 'Encontre una mejor opcion' },
                    { id: 'service_issues', label: 'Problemas con el servicio' },
                    { id: 'other', label: 'Otro' }
                ];
                const overlay = this.createCancelModal(`
                    <button class="ppa-cancel-modal-x" id="ppa-cancel-step2-close">x</button>
                    <h2 class="ppa-cancel-title">cuentanos por que</h2>
                    <p class="ppa-cancel-subtitle">Tu retroalimentacion nos ayuda a mejorar Pata Amiga.</p>
                    <div class="ppa-cancel-options" id="ppa-cancel-options">
                        ${reasons.map(reason => `
                            <label class="ppa-cancel-option" data-reason="${reason.id}">
                                <input type="radio" name="ppa-cancel-reason" value="${reason.id}">
                                <span>${reason.label}</span>
                            </label>
                        `).join('')}
                    </div>
                    <input type="text" class="ppa-cancel-other-input" id="ppa-reason-other-text" placeholder="Cuentanos el motivo" style="display:none;margin-bottom:16px;">
                    <label class="ppa-fl" for="ppa-cancel-comments">Comentarios opcionales</label>
                    <textarea class="ppa-cancel-textarea" id="ppa-cancel-comments" placeholder="Tu opinion es importante para nosotros"></textarea>
                    <label class="ppa-cancel-confirm-box">
                        <input type="checkbox" id="ppa-cancel-agree">
                        <span>Acepto cancelar mi membresia Pata Amiga</span>
                    </label>
                    <div class="ppa-cancel-actions">
                        <button class="ppa-cancel-btn-secondary" id="ppa-cancel-step2-back">volver</button>
                        <button class="ppa-cancel-btn-primary" id="ppa-cancel-step2-submit" disabled>continuar</button>
                    </div>
                `);

                const submitBtn = document.getElementById('ppa-cancel-step2-submit');
                const otherInput = document.getElementById('ppa-reason-other-text');
                const agreeInput = document.getElementById('ppa-cancel-agree');
                let selectedReason = '';

                const updateState = () => {
                    const hasOtherText = selectedReason !== 'other' || otherInput.value.trim().length > 0;
                    submitBtn.disabled = !(selectedReason && agreeInput.checked && hasOtherText);
                };
                const close = value => { overlay.remove(); document.body.style.overflow = ''; resolve(value); };

                document.querySelectorAll('.ppa-cancel-option').forEach(option => {
                    option.addEventListener('click', () => {
                        document.querySelectorAll('.ppa-cancel-option').forEach(item => item.classList.remove('selected'));
                        option.classList.add('selected');
                        selectedReason = option.getAttribute('data-reason');
                        otherInput.style.display = selectedReason === 'other' ? 'block' : 'none';
                        if (selectedReason === 'other') otherInput.focus();
                        updateState();
                    });
                });
                otherInput.addEventListener('input', updateState);
                agreeInput.addEventListener('change', updateState);
                document.getElementById('ppa-cancel-step2-close').addEventListener('click', () => close(null));
                document.getElementById('ppa-cancel-step2-back').addEventListener('click', () => close(null));
                document.getElementById('ppa-cancel-step2-submit').addEventListener('click', () => close({
                    reason: selectedReason,
                    reasonOtherText: selectedReason === 'other' ? otherInput.value.trim() : null,
                    comments: document.getElementById('ppa-cancel-comments').value.trim() || null
                }));
            });
        }

        async fetchCancellationEndDate() {
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/cancellation-end-date?memberstackId=${encodeURIComponent(this.member.id)}`);
                return await res.json();
            } catch(e) {
                console.error('[ProfileWidget] Error fetching cancellation end date:', e);
                return { success: false, error: 'Error de conexion' };
            }
        }

        showFinalConfirmation(endDateInfo) {
            return new Promise(resolve => {
                const formatted = fmtDate(endDateInfo.endDate);
                const overlay = this.createCancelModal(`
                    <button class="ppa-cancel-modal-x" id="ppa-cancel-step3-close">x</button>
                    <h2 class="ppa-cancel-title">ultimo paso</h2>
                    <p class="ppa-cancel-subtitle">
                        Lamentamos que ya no continues en la manada de Pata Amiga.
                    </p>
                    <div class="ppa-cancel-detail">
                        Te respaldamos hasta el ${this.escapeHtml(formatted)}.
                        <br>
                        Faltan ${Number(endDateInfo.daysRemaining || 0)} dias para que termine tu periodo pagado.
                    </div>
                    <p class="ppa-cancel-subtitle">
                        Al confirmar, se cancelara la renovacion de tu suscripcion y quedara registrada tu solicitud.
                    </p>
                    <div class="ppa-cancel-actions">
                        <button class="ppa-cancel-btn-secondary" id="ppa-cancel-step3-back">volver</button>
                        <button class="ppa-cancel-btn-primary" id="ppa-cancel-step3-confirm">confirmar cancelacion</button>
                    </div>
                `);

                const close = value => { overlay.remove(); document.body.style.overflow = ''; resolve(value); };
                document.getElementById('ppa-cancel-step3-close').addEventListener('click', () => close(false));
                document.getElementById('ppa-cancel-step3-back').addEventListener('click', () => close(false));
                document.getElementById('ppa-cancel-step3-confirm').addEventListener('click', () => close(true));
            });
        }

        async executeCancellation(cancellationInfo, endDateInfo) {
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/deactivate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberstackId: this.member.id,
                        reason: cancellationInfo.reason,
                        reasonOtherText: cancellationInfo.reasonOtherText,
                        comments: cancellationInfo.comments
                    })
                }).then(r => r.json());

                if (res.success) {
                    const endDate = res.cancellation?.endDate || endDateInfo.endDate;
                    await this.showCancellationFeedbackModal({
                        title: 'membresia cancelada',
                        message: `Gracias por haber sido parte de Pata Amiga. Te respaldamos hasta el ${fmtDate(endDate)}.`
                    });
                    await window.$memberstackDom.logout();
                    window.location.href = '/';
                } else {
                    await this.showCancellationFeedbackModal({
                        title: 'no pudimos cancelar',
                        message: res.error || 'Por favor intenta de nuevo o contacta a soporte.'
                    });
                }
            } catch {
                await this.showCancellationFeedbackModal({
                    title: 'error de conexion',
                    message: 'Intenta de nuevo en unos minutos.'
                });
            }
        }

        showCancellationFeedbackModal({ title, message }) {
            return new Promise(resolve => {
                const overlay = this.createCancelModal(`
                    <button class="ppa-cancel-modal-x" id="ppa-cancel-feedback-close">x</button>
                    <h2 class="ppa-cancel-title">${this.escapeHtml(title)}</h2>
                    <p class="ppa-cancel-subtitle">${this.escapeHtml(message)}</p>
                    <button class="ppa-cancel-btn-primary" id="ppa-cancel-feedback-ok">entendido</button>
                `);
                const close = () => { overlay.remove(); document.body.style.overflow = ''; resolve(true); };
                document.getElementById('ppa-cancel-feedback-close').addEventListener('click', close);
                document.getElementById('ppa-cancel-feedback-ok').addEventListener('click', close);
            });
        }

        createCancelModal(content) {
            const overlay = document.createElement('div');
            overlay.className = 'ppa-cancel-overlay';
            overlay.innerHTML = `<div class="ppa-cancel-modal" onclick="event.stopPropagation()">${content}</div>`;
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            return overlay;
        }

        renderLegalText(text) {
            if (!text) return '<div class="ppa-terms-loading">No hay terminos disponibles.</div>';
            return text.split('\n').map(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('## ') || trimmedLine.startsWith('### ')) {
                    return `<h4 class="ppa-terms-text-header">${this.escapeHtml(trimmedLine.replace(/^###?\s/, ''))}</h4>`;
                }
                if (trimmedLine === '') return '<br>';
                return `<p class="ppa-terms-text-line">${this.escapeHtml(line)}</p>`;
            }).join('');
        }

        openTermsModal() {
            const existing = document.getElementById('ppa-terms-modal');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.className = 'ppa-cancel-overlay';
            overlay.id = 'ppa-terms-modal';
            overlay.innerHTML = `
                <div class="ppa-cancel-modal ppa-terms-modal" onclick="event.stopPropagation()">
                    <button class="ppa-cancel-modal-x" id="ppa-terms-close">x</button>
                    <h2 class="ppa-cancel-title">terminos</h2>
                    <p class="ppa-cancel-subtitle">Lee los terminos y condiciones de Pata Amiga.</p>
                    <div class="ppa-terms-viewer" id="ppa-terms-content">
                        <div class="ppa-terms-loading">Cargando terminos y condiciones...</div>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            const close = () => overlay.remove();
            document.getElementById('ppa-terms-close').addEventListener('click', close);
            overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

            fetch(`${CONFIG.apiUrl}/api/legal/terms`)
                .then(r => r.json())
                .then(data => {
                    const content = document.getElementById('ppa-terms-content');
                    if (!content) return;
                    if (data?.success && data.fullDocument) {
                        content.innerHTML = this.renderLegalText(data.fullDocument);
                    } else {
                        content.innerHTML = '<div class="ppa-terms-loading">No pudimos cargar los terminos. Contacta a soporte para continuar.</div>';
                    }
                })
                .catch(() => {
                    const content = document.getElementById('ppa-terms-content');
                    if (content) content.innerHTML = '<div class="ppa-terms-loading">No pudimos cargar los terminos. Contacta a soporte para continuar.</div>';
                });
        }

        async handlePhotoChange(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { alert('La foto no puede pesar más de 5MB.'); return; }

            const img = document.getElementById('ppa-avatar-img');
            if (img) img.src = URL.createObjectURL(file);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('memberstackId', this.member.id);

            try {
                const endpoint = this.isWellnessCenter ? '/api/upload/wellness-logo' : '/api/upload/profile-photo';
                const res = await fetch(`${CONFIG.apiUrl}${endpoint}`, { method:'POST', body: formData }).then(r=>r.json());
                if (res.success && res.url) {
                    if (img) img.src = res.url;
                    if (this.isWellnessCenter) {
                        if (this.wellnessCenter) this.wellnessCenter.logo_url = res.url;
                    } else {
                        if (this.user) this.user.avatar_url = res.url;
                    }
                }
            } catch(e) {
                console.error('[ProfileWidget] Error subiendo foto:', e);
            }
        }
        closeModal() {
            document.getElementById('ppa-modal-overlay')?.remove();
            document.body.style.overflow = '';
        }

        openEditModal() {
            if (document.getElementById('ppa-modal-overlay')) return;
            
            if (this.isWellnessCenter) {
                const c = this.wellnessCenter || {};
                const overlay = document.createElement('div');
                overlay.className = 'ppa-overlay';
                overlay.id = 'ppa-modal-overlay';
                overlay.innerHTML = `
                    <div class="ppa-modal">
                        <button class="ppa-modal-x" id="ppa-modal-close">✕</button>
                        <h2 class="ppa-modal-title">editar información</h2>
                        <div class="ppa-fg"><label class="ppa-fl">Nombre del Establecimiento</label><input class="ppa-fi" id="ef-name" value="${c.establishment_name||c.name||''}" placeholder="Ej: Clínica Vet Pata Amiga" /></div>
                        <div class="ppa-fg"><label class="ppa-fl">Correo electrónico (no editable)</label><input class="ppa-fi" value="${c.email||this.member?.auth?.email||''}" disabled /></div>
                        <div class="ppa-fg"><label class="ppa-fl">Teléfono de contacto</label><input class="ppa-fi" id="ef-phone" value="${c.phone||''}" placeholder="Ej: 5512345678" /></div>
                        <div class="ppa-fg"><label class="ppa-fl">Dirección principal</label><textarea class="ppa-fi" id="ef-address" style="min-height:80px;border-radius:20px;resize:vertical;" placeholder="Calle, número, colonia, CP y ciudad">${c.address||''}</textarea></div>
                        <button class="ppa-save-btn" id="ppa-save-btn">guardar cambios</button>
                        <p class="ppa-msg" id="ppa-save-msg"></p>
                    </div>`;
                document.body.appendChild(overlay);
                document.body.style.overflow = 'hidden';

                document.getElementById('ppa-modal-close').addEventListener('click', () => this.closeModal());
                overlay.addEventListener('click', e => { if(e.target === overlay) this.closeModal(); });
                document.getElementById('ppa-save-btn').addEventListener('click', () => this.saveWellnessProfile());
                return;
            }

            const u = this.user || {};
            const overlay = document.createElement('div');
            overlay.className = 'ppa-overlay';
            overlay.id = 'ppa-modal-overlay';
            overlay.innerHTML = `
                <div class="ppa-modal">
                    <button class="ppa-modal-x" id="ppa-modal-close">✕</button>
                    <h2 class="ppa-modal-title">editar información</h2>
                    <div class="ppa-fg"><label class="ppa-fl">Nombre(s)</label><input class="ppa-fi" id="ef-fname" value="${u.first_name||''}" placeholder="Tu nombre" /></div>
                    <div class="ppa-fg"><label class="ppa-fl">Apellido paterno</label><input class="ppa-fi" id="ef-plast" value="${u.last_name||''}" placeholder="Apellido paterno" /></div>
                    <div class="ppa-fg"><label class="ppa-fl">Apellido materno</label><input class="ppa-fi" id="ef-mlast" value="${u.mother_last_name||''}" placeholder="Apellido materno" /></div>
                    <div class="ppa-fg"><label class="ppa-fl">Correo electrónico (no editable)</label><input class="ppa-fi" value="${this.member?.auth?.email||''}" disabled /></div>
                    <div class="ppa-fg"><label class="ppa-fl">Teléfono celular</label><input class="ppa-fi" id="ef-phone" value="${u.phone||''}" placeholder="+52 55 1234 5678" /></div>
                    <div class="ppa-fg"><label class="ppa-fl">Estado</label><input class="ppa-fi" id="ef-state" value="${u.state||''}" placeholder="Jalisco" /></div>
                    <div class="ppa-fg"><label class="ppa-fl">Municipio / Ciudad</label><input class="ppa-fi" id="ef-city" value="${u.city||''}" placeholder="Guadalajara" /></div>
                    <div class="ppa-fg"><label class="ppa-fl">Colonia</label><input class="ppa-fi" id="ef-colony" value="${u.colony||''}" placeholder="Colonia" /></div>
                    <div class="ppa-fg"><label class="ppa-fl">Código postal</label><input class="ppa-fi" id="ef-cp" value="${u.postal_code||''}" placeholder="44190" /></div>
                    <div class="ppa-fg"><label class="ppa-fl">Fecha de nacimiento</label><input class="ppa-fi" id="ef-birth" type="date" value="${u.birth_date||''}" /></div>
                    <button class="ppa-save-btn" id="ppa-save-btn">guardar cambios</button>
                    <p class="ppa-msg" id="ppa-save-msg"></p>
                </div>`;
            document.body.appendChild(overlay);

            document.body.style.overflow = 'hidden';

            document.getElementById('ppa-modal-close').addEventListener('click', () => this.closeModal());
            overlay.addEventListener('click', e => { if(e.target === overlay) this.closeModal(); });
            document.getElementById('ppa-save-btn').addEventListener('click', () => this.saveProfile());
        }

        async saveProfile() {
            const btn = document.getElementById('ppa-save-btn');
            const msg = document.getElementById('ppa-save-msg');
            if (!btn || !msg) return;

            btn.disabled = true;
            btn.textContent = 'guardando...';
            msg.className = 'ppa-msg';
            msg.textContent = '';

            const payload = {
                memberstackId: this.member.id,
                first_name: document.getElementById('ef-fname')?.value?.trim(),
                last_name: document.getElementById('ef-plast')?.value?.trim(),
                mother_last_name: document.getElementById('ef-mlast')?.value?.trim(),
                phone: document.getElementById('ef-phone')?.value?.trim(),
                state: document.getElementById('ef-state')?.value?.trim(),
                city: document.getElementById('ef-city')?.value?.trim(),
                colony: document.getElementById('ef-colony')?.value?.trim(),
                postal_code: document.getElementById('ef-cp')?.value?.trim(),
                birth_date: document.getElementById('ef-birth')?.value || undefined,
            };

            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/update-profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(r => r.json());

                if (res.success) {
                    this.user = { ...this.user, ...payload };
                    msg.className = 'ppa-msg ppa-msg-ok';
                    msg.textContent = '✅ ¡Cambios guardados correctamente!';
                    setTimeout(() => {
                        this.closeModal();
                        this.render();
                    }, 1200);
                } else {
                    throw new Error(res.error || 'Error desconocido');
                }
            } catch(e) {
                msg.className = 'ppa-msg ppa-msg-err';
                msg.textContent = '❌ ' + (e.message || 'No se pudo guardar. Intenta de nuevo.');
                btn.disabled = false;
                btn.textContent = 'guardar cambios';
            }
        }

        async saveWellnessProfile() {
            const btn = document.getElementById('ppa-save-btn');
            const msg = document.getElementById('ppa-save-msg');
            if (!btn || !msg) return;

            btn.disabled = true;
            btn.textContent = 'guardando...';
            msg.className = 'ppa-msg';
            msg.textContent = '';

            const payload = {
                memberstack_id: this.member.id,
                establishment_name: document.getElementById('ef-name')?.value?.trim(),
                phone: document.getElementById('ef-phone')?.value?.trim(),
                address: document.getElementById('ef-address')?.value?.trim(),
            };

            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/wellness/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(r => r.json());

                if (res.success) {
                    this.wellnessCenter = { ...this.wellnessCenter, ...payload };
                    msg.className = 'ppa-msg ppa-msg-ok';
                    msg.textContent = '✅ ¡Cambios guardados correctamente!';
                    setTimeout(() => {
                        this.closeModal();
                        this.render();
                    }, 1200);
                } else {
                    throw new Error(res.error || 'Error al actualizar');
                }
            } catch(e) {
                msg.className = 'ppa-msg ppa-msg-err';
                msg.textContent = '❌ ' + (e.message || 'No se pudo guardar. Intenta de nuevo.');
                btn.disabled = false;
                btn.textContent = 'guardar cambios';
            }
        }

        // Método para el dev test — permite cambiar el rol
        devSetRole(role) {
            if (role === 'ambassador') {
                this.isWellnessCenter = false;
                this.ambassador = { referral_code: 'PATA2025', status: 'active', total_referrals: 12, active_referrals: 8 };
            } else if (role === 'wellness_center') {
                this.isWellnessCenter = true;
                this.ambassador = null;
                this.wellnessCenter = {
                    id: 'well_dev_001',
                    memberstack_id: this.member?.id || 'mem_dev_profile_001',
                    name: 'Clínica Veterinaria Pata Amiga',
                    establishment_name: 'Veterinaria Central Pata Amiga',
                    email: 'contacto@vets.pataamiga.mx',
                    phone: '5512345678',
                    address: 'Av. Revolución 100, Col. Centro, CP 01000, CDMX',
                    logo_url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=150',
                    status: 'approved',
                    created_at: '2025-02-10T12:00:00Z',
                    services: ['Consulta General', 'Vacunas', 'Desparasitación', 'Cirugía'],
                    locations: [
                        { name: 'Sucursal Sur', address: 'Av. Insurgentes Sur 1500, CDMX', phone: '5577665544', is_primary: true },
                        { name: 'Sucursal Norte', address: 'Calzada de Tlalpan 3200, CDMX', phone: '5599887766', is_primary: false }
                    ]
                };
            } else {
                this.isWellnessCenter = false;
                this.ambassador = null;
            }
            this.render();
        }
    }

    // Inicializar
    const widget = new UserProfileWidget();
    window.PataProfileWidget = widget;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => widget.init());
    } else {
        widget.init();
    }

})();
