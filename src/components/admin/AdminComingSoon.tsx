export function AdminComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <h1 className="font-display text-3xl text-ink-title">{title}</h1>
      <span className="rounded-full bg-info-bg px-5 py-2 text-[13px] font-bold text-info-text">
        Llega en un próximo milestone 🐾
      </span>
    </div>
  );
}
