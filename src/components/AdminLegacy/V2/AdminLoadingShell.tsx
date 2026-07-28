import styles from './AdminLoadingShell.module.css';

export default function AdminLoadingShell() {
    return (
        <div className={styles.shell} aria-live="polite" aria-label="Verificando credenciales">
            <aside className={styles.sidebar} />
            <main>
                <div className={styles.header} />
                <div className={styles.cards}>{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div>
                <div className={styles.content} />
                <span className={styles.srOnly}>Verificando credenciales…</span>
            </main>
        </div>
    );
}
