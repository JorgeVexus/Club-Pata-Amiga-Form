/**
 * Gráfica de barras ligera (SVG puro, sin librerías) para el panel.
 * Interactiva con hover nativo: cada barra resalta y muestra su valor
 * (tooltip <title> + etiqueta al pasar el cursor).
 */
export function MiniBarChart({
  title,
  data,
  color = "#1CBCAD",
  format = (v: number) => v.toLocaleString("es-MX"),
}: {
  title: string;
  data: { label: string; value: number }[];
  color?: string;
  format?: (v: number) => string;
}) {
  const W = 420;
  const H = 150;
  const PAD = 6;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = (W - PAD * 2) / data.length;

  return (
    <div className="flex flex-col gap-2 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
      <span className="font-display text-lg text-ink-title">{title}</span>
      <svg
        viewBox={`0 0 ${W} ${H + 22}`}
        className="w-full"
        role="img"
        aria-label={`${title}: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`}
      >
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * (H - 24), d.value > 0 ? 4 : 2);
          const x = PAD + i * barW;
          return (
            <g key={d.label} className="group">
              {/* Zona de hover de toda la columna */}
              <rect
                x={x}
                y={0}
                width={barW}
                height={H + 22}
                fill="transparent"
              />
              <rect
                x={x + barW * 0.18}
                y={H - h}
                width={barW * 0.64}
                height={h}
                rx={6}
                fill={color}
                className="opacity-80 transition-opacity group-hover:opacity-100"
              >
                <title>{`${d.label}: ${format(d.value)}`}</title>
              </rect>
              {/* Valor visible al pasar el cursor */}
              <text
                x={x + barW / 2}
                y={H - h - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#1E5350"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                {format(d.value)}
              </text>
              <text
                x={x + barW / 2}
                y={H + 15}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#8A9490"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
