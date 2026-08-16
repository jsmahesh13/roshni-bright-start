import { FACETS, FACET_VAR, DAY_MS, type Noticing } from "@/lib/roshni";

/**
 * The longitudinal timeline from the prototype: two years wide, strengths above
 * the centre line, concerns below, actions on it, coloured by facet, with the
 * last six weeks highlighted.
 */
export function Timeline({ noticings }: { noticings: Noticing[] }) {
  const W = 1160;
  const H = 260;
  const mid = H / 2;
  const L = 54;
  const R = W - 24;
  const range = 730;
  const today = Date.now();
  const cut = today - range * DAY_MS;
  const span = range * DAY_MS;
  const x = (t: number) => L + ((t - cut) / span) * (R - L);

  const months: { px: number; label: string }[] = [];
  const d = new Date(cut);
  d.setDate(1);
  while (d.getTime() < today) {
    const px = x(d.getTime());
    if (px > L) {
      months.push({
        px,
        label: d
          .toLocaleDateString("en-GB", { month: "short", year: "2-digit" })
          .toUpperCase(),
      });
    }
    d.setMonth(d.getMonth() + 2);
  }

  const lanes: Record<string, number> = {};
  const marks = [...noticings]
    .filter((n) => !n.retracted)
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    .map((n) => {
      const t = +new Date(n.created_at);
      const px = x(t);
      if (px < L - 2) return null;
      const key = Math.round(px / 9) + "_" + n.valence;
      lanes[key] = (lanes[key] ?? 0) + 1;
      const dp = lanes[key]!;
      const h = n.valence === 0 ? 7 : 12 + dp * 3;
      const y = n.valence > 0 ? mid - 6 - h : n.valence < 0 ? mid + 6 : mid - 4;
      const w = n.valence === 0 ? 5 : 6;
      return { n, px, y, h, w, t };
    })
    .filter(Boolean) as { n: Noticing; px: number; y: number; h: number; w: number; t: number }[];

  const sx = Math.max(L, x(today - 42 * DAY_MS));
  const sw = R - sx;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t("tl_aria")}>
        {months.map((m) => (
          <g key={m.px}>
            <line x1={m.px} y1={22} x2={m.px} y2={H - 22} stroke="var(--foreground)" strokeOpacity={0.06} />
            <text x={m.px + 4} y={H - 8} fontSize={9} fill="var(--faint)">
              {m.label}
            </text>
          </g>
        ))}
        <line x1={L} y1={mid} x2={R} y2={mid} stroke="var(--foreground)" strokeWidth={1.1} strokeOpacity={0.4} />
        <text x={8} y={mid - 58} fontSize={9} fill="var(--strength)">{t("tl_strength")}</text>
        <text x={8} y={mid + 66} fontSize={9} fill="var(--concern)">{t("tl_concern")}</text>

        {sw > 10 && (
          <>
            <rect x={sx} y={24} width={sw} height={H - 52} fill="var(--gold)" fillOpacity={0.09} stroke="var(--gold)" strokeOpacity={0.5} />
            <rect x={sx} y={7} width={106} height={15} fill="var(--gold)" />
            <text x={sx + 7} y={19} fontSize={9} fill="#3a2c08">{t("tl_lastsix")}</text>
          </>
        )}

        {marks.map((m) => (
          <rect
            key={m.n.id}
            x={+(m.px - m.w / 2).toFixed(1)}
            y={+m.y.toFixed(1)}
            width={m.w}
            height={m.h}
            rx={1.5}
            fill={FACET_VAR[m.n.facet]}
          >
            <title>{`${new Date(m.t).toLocaleDateString("en-GB")} · ${m.n.text}`}</title>
          </rect>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
        {FACETS.map((f) => (
          <span key={f.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FACET_VAR[f.key] }} />
            {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}
