export function ComingSoon({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <h1 className="font-display text-3xl text-ink-title">{title}</h1>
      <p className="max-w-md text-sm text-ink-secondary">{note}</p>
      <span className="rounded-full bg-info-bg px-5 py-2 text-[13px] font-bold text-info-text">
        En construcción 🐾
      </span>
    </div>
  );
}
