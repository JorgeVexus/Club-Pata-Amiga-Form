const STEPS = ["Tu cuenta", "Tu peludo", "Plan y pago"];

/**
 * 3-step indicator. Desktop: pill stepper (screen 1a). Mobile: segmented
 * progress bar + "Paso X de 3" handled by RegistroHeader (screen 1e).
 */
export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <>
      {/* Desktop pills */}
      <div className="hidden gap-2 sm:flex">
        {STEPS.map((step, i) => {
          const n = i + 1;
          if (n < current) {
            return (
              <div
                key={step}
                className="flex flex-1 items-center gap-2 rounded-full bg-info-bg px-3.5 py-2 text-[13px] font-semibold text-teal-deep"
              >
                <span className="grid size-5 place-items-center rounded-full bg-teal text-[11px] text-white">
                  ✓
                </span>
                {step}
              </div>
            );
          }
          if (n === current) {
            return (
              <div
                key={step}
                className="flex flex-1 items-center gap-2 rounded-full bg-teal px-3.5 py-2 text-[13px] font-semibold text-white"
              >
                <span className="grid size-5 place-items-center rounded-full bg-white/25 text-[11px]">
                  {n}
                </span>
                {step}
              </div>
            );
          }
          return (
            <div
              key={step}
              className="flex flex-1 items-center gap-2 rounded-full border-[1.5px] border-border-input bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-tertiary"
            >
              <span className="grid size-5 place-items-center rounded-full bg-[#EFEAE0] text-[11px]">
                {n}
              </span>
              {step}
            </div>
          );
        })}
      </div>
      {/* Mobile progress segments */}
      <div className="flex gap-1.5 sm:hidden">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-teal" : "bg-border-input"}`}
          />
        ))}
      </div>
    </>
  );
}
