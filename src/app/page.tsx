import React from 'react';

export default function Home() {
    // This page should be rewritten to Webflow by next.config.js
    // OR handled by Cloudflare Worker.
    // If we land here, something is wrong with routing, but we shouldn't show the registration form.
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666' }}>
            <p>Cargando Pata Amiga...</p>
        </div>
    );
}
