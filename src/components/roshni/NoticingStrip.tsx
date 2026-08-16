import { FACET_VAR, RETENTION_DAYS, daysAgo, lastSeenLabelT, type Noticing } from "@/lib/roshni";
import { useT } from "@/hooks/useLang";

/**
 * A two-year "noticing strip".
 * Each noticing is one thin vertical mark placed by date:
 * strengths above the centre line, concerns below, actions on the line.
 * An almost-empty strip is the point of this whole product.
 */
export function NoticingStrip({
  noticings,
  width = 240,
  height = 44,
}: {
  noticings: Noticing[];
  width?: number;
  height?: number;
}) {
  const t = useT();
  const mid = height / 2;
  const now = Date.now();
  const pad = 3;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${noticings.length} noticings over the last two years`}
      className="overflow-visible"
    >
      {/* the centre line — the year the class walked past */}
      <line
        x1={0}
        y1={mid}
        x2={width}
        y2={mid}
        stroke="var(--border)"
        strokeWidth={1}
      />
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={width * t}
          y1={mid - 3}
          x2={width * t}
          y2={mid + 3}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}

      {noticings.map((n) => {
        const d = Math.min(daysAgo(n.created_at, now), RETENTION_DAYS);
        const x = pad + (1 - d / RETENTION_DAYS) * (width - pad * 2);
        const colour = FACET_VAR[n.facet] ?? "var(--facet-action)";
        const when = lastSeenLabelT(d, t);
        const facetLabel = t(`f_${n.facet}`);
        if (n.valence === 0) {
          return (
            <circle key={n.id} cx={x} cy={mid} r={2} fill={colour} opacity={0.75}>
              <title>{`${facetLabel} · ${when}`}</title>
            </circle>
          );
        }
        const up = n.valence > 0;
        return (
          <line
            key={n.id}
            x1={x}
            y1={mid + (up ? -1 : 1)}
            x2={x}
            y2={up ? mid - (mid - 4) : mid + (mid - 4)}
            stroke={colour}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.85}
          >
            <title>{`${facetLabel} ${up ? "▲" : "▼"} · ${when}`}</title>
          </line>
        );
      })}
    </svg>
  );
}
