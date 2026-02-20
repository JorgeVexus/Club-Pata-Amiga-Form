import { Suspense } from 'react';
import PlanSelectionContent from './PlanSelectionContent';

export default function PlanSelectionPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                background: '#00BBB4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Outfit, sans-serif'
            }}>
                <div style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #E0F7F6',
                        borderTopColor: '#00BBB4',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p>Cargando...</p>
                </div>
            </div>
        }>
            <PlanSelectionContent />
        </Suspense>
    );
}
