'use client';

import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';

export default function AmbassadorReUploadPage() {
    return (
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.container}>
                <div className={styles.disabledCard}>
                    <h2>Función temporalmente no disponible</h2>
                    <p>La carga de documentos de identificación fue removida del registro de embajadores.</p>
                </div>
            </div>
        </div>
    );
}
