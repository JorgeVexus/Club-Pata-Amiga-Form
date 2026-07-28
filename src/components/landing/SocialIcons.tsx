/** Iconos SVG inline de redes sociales (monocromos, heredan currentColor). */

const ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  ),
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 8.5V6.8c0-.8.5-1.3 1.3-1.3H17V2.5h-2.6C11.9 2.5 10.5 4 10.5 6.5v2h-2.5V12h2.5v9.5H14V12h2.6l.4-3.5H14z"
        fill="currentColor"
      />
    </svg>
  ),
  tiktok: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16.5 3c.3 1.9 1.6 3.4 3.5 3.8v3.1c-1.3 0-2.5-.4-3.5-1.1v6.4c0 3.2-2.6 5.8-5.8 5.8S5 18.4 5 15.2s2.6-5.8 5.8-5.8c.3 0 .6 0 .9.1v3.2a2.7 2.7 0 1 0 1.8 2.5V3h3z"
        fill="currentColor"
      />
    </svg>
  ),
};

export function SocialIcon({ network }: { network: string }) {
  return <>{ICONS[network] ?? null}</>;
}
