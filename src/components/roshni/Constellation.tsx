import { useT } from "@/hooks/useLang";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { DAY_MS, daysAgo, type StudentSummary } from "@/lib/roshni";

/**
 * The night-sky class view. Radius = recency of the last noticing,
 * size = how much has been written, colour = doing well / needs you / fading.
 * Counts only — never a score, never a ranking of children.
 */

export interface SkyMetrics {
  count: number;
  str: number;
  con: number;
  recentCon: number;
  /** days since anything was written about this child (9999 = never) */
  days: number;
}

export function skyMetrics(row: StudentSummary, rangeDays: number, now = Date.now()): SkyMetrics {
  const cut = now - rangeDays * DAY_MS;
  const ns = row.noticings.filter((n) => +new Date(n.created_at) >= cut);
  return {
    count: ns.length,
    str: ns.filter((n) => n.valence > 0).length,
    con: ns.filter((n) => n.valence < 0).length,
    recentCon: ns.filter((n) => n.valence < 0 && daysAgo(n.created_at, now) <= 21).length,
    days: row.lastSeenDays ?? 9999,
  };
}

export const isNeeds = (m: SkyMetrics) => m.recentCon >= 2 || (m.con >= 6 && m.con > m.str * 2);

interface Props {
  rows: StudentSummary[];
  rangeDays: number;
  classLabel: string;
}

export function Constellation({ rows, rangeDays, classLabel }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(960);
  const [tip, setTip] = useState<{ x: number; y: number; lines: string[] } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 960));
    ro.observe(el);
    setWidth(el.clientWidth || 960);
    return () => ro.disconnect();
  }, []);

  // Mouse-driven parallax tilt — mutate the scene's own transform directly so
  // hover doesn't trigger a React re-render on every pointer move.
  function tiltScene(e: React.MouseEvent<HTMLDivElement>) {
    const box = ref.current?.getBoundingClientRect();
    const scene = sceneRef.current;
    if (!box || !scene) return;
    const px = (e.clientX - box.left) / box.width - 0.5;
    const py = (e.clientY - box.top) / box.height - 0.5;
    scene.style.setProperty("--tiltX", `${(px * 9).toFixed(2)}deg`);
    scene.style.setProperty("--tiltY", `${(-py * 7).toFixed(2)}deg`);
  }
  function resetTilt() {
    setTip(null);
    sceneRef.current?.style.setProperty("--tiltX", "0deg");
    sceneRef.current?.style.setProperty("--tiltY", "0deg");
  }

  const list = useMemo(
    () => rows.map((r) => ({ s: r.student, m: skyMetrics(r, rangeDays) })),
    [rows, rangeDays],
  );

  const H = 604;
  const cx = width / 2;
  const cy = H / 2;
  const maxR = Math.min(width / 2, H / 2) - 52;
  const zoneR = [0.44, 0.67, 0.9].map((f) => f * maxR);
  const zPhase = [0, 0.62, 1.15];
  const bFaint = 0.555 * maxR;
  const bDark = 0.785 * maxR;

  const groups = useMemo(() => {
    const g: (typeof list)[] = [[], [], []];
    [...list]
      .sort((a, b) => a.s.name.localeCompare(b.s.name))
      .forEach((o) => g[o.m.days <= 21 ? 0 : o.m.days <= 42 ? 1 : 2]!.push(o));
    return g;
  }, [list]);

  const stars = useMemo(() => {
    const out: {
      id: string;
      x: number;
      y: number;
      sr: number;
      fill: string;
      glow: string;
      nameCol: string;
      op: number;
      z: number;
      dx: number;
      dy: number;
      delay: number;
      pulse: boolean;
      beacon: boolean;
      first: string;
      tip: string[];
    }[] = [];
    let idx = 0;
    groups.forEach((arr, zi) => {
      const n = arr.length;
      arr.forEach((o, j) => {
        const a = (n ? (j / n) * Math.PI * 2 : 0) + zPhase[zi]!;
        const rr = zoneR[zi]! + (j % 2 ? 11 : -11);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        const { m, s } = o;
        const dark = zi === 2;
        const needs = !dark && isNeeds(m);

        // This view exists to surface the child who is being missed — so a
        // long-unseen child should visually dominate, not fade into the
        // background. "neglect" grows the longer nobody has written anything.
        const neglect = dark ? Math.min(1, Math.max(0, m.days - 42) / 260) : 0;

        let sr: number, fill: string, glow: string, nameCol: string;
        let pulse = false,
          beacon = false,
          z: number;

        if (needs) {
          sr = 15 + Math.min(1, m.recentCon / 5) * 9;
          fill = "radial-gradient(circle at 40% 35%,#fff,#f0876b 55%,#c8483a)";
          glow = `0 0 ${(sr * 2).toFixed(0)}px ${(sr * 0.65).toFixed(0)}px rgba(240,110,90,.85)`;
          nameCol = "#ffc2b2";
          pulse = true;
          z = 34;
        } else if (dark) {
          sr = 15 + neglect * 12;
          fill = "radial-gradient(circle at 40% 35%,#fff9ec,#cfe0ff 45%,#8fa6d6 78%)";
          glow = `0 0 ${(20 + neglect * 22).toFixed(0)}px ${(6 + neglect * 8).toFixed(0)}px rgba(200,220,255,${(0.45 + neglect * 0.3).toFixed(2)})`;
          nameCol = "#eaf1ff";
          beacon = true;
          z = 16 + neglect * 20;
        } else {
          sr = 7 + Math.min(1, m.count / 22) * 13;
          fill = "radial-gradient(circle at 40% 35%,#fffdf0,#ffd873 60%,#e0a020)";
          glow = `0 0 ${(sr * 1.4).toFixed(0)}px ${(sr * 0.35).toFixed(0)}px rgba(255,205,90,.55)`;
          nameCol = "#ffe6a8";
          z = -8;
        }

        out.push({
          id: s.id,
          x,
          y,
          sr,
          fill,
          glow,
          nameCol,
          op: needs ? 1 : dark ? 0.92 + neglect * 0.08 : 1,
          z,
          dx: cx - x,
          dy: cy - y,
          delay: idx * 13,
          pulse,
          beacon,
          first: s.name.split(" ")[0] ?? s.name,
          tip: [
            s.name,
            `${classLabel} · roll ${s.roll}`,
            `${m.count} noticings · ${m.str}▲ ${m.con}▼`,
            m.days > 900 ? "never noticed" : `last seen ${m.days}d ago`,
          ],
        });
        idx++;
      });
    });
    return out;
  }, [groups, cx, cy, classLabel, zoneR]);

  const needsL = list
    .filter((o) => o.m.days <= 42 && isNeeds(o.m))
    .sort((a, b) => b.m.recentCon - a.m.recentCon);
  const darkL = list.filter((o) => o.m.days > 42).sort((a, b) => b.m.days - a.m.days);

  const open = (id: string) => navigate({ to: "/student/$studentId", params: { studentId: id } });

  return (
    <div>
      <div
        ref={ref}
        className="sky-night relative mt-5 h-[604px] overflow-hidden rounded-[18px]"
        onMouseMove={tiltScene}
        onMouseLeave={resetTilt}
      >
        <div ref={sceneRef} className="sky-scene">
          <div
            className="zone-ring"
            style={{ width: bFaint * 2, height: bFaint * 2 }}
            aria-hidden
          />
          <div className="fade-line" style={{ width: bDark * 2, height: bDark * 2 }} aria-hidden />
          <div className="fade-lbl" style={{ top: cy - bDark }}>
            6-week line · beyond here, in the dark
          </div>

          <div className="sun-core">
            <span className="sun-core-glow blob-shape blob-breathe" aria-hidden />
            <span className="sun-core-shape blob-shape blob-breathe" aria-hidden />
            <span>{t("yourattention")}</span>
          </div>

          {stars.map((st) => (
            <button
              key={st.id}
              type="button"
              className="star"
              aria-label={st.tip.join(", ")}
              onClick={() => open(st.id)}
              onMouseMove={(e) => {
                const box = ref.current?.getBoundingClientRect();
                if (!box) return;
                setTip({ x: e.clientX - box.left, y: e.clientY - box.top, lines: st.tip });
              }}
              onMouseLeave={() => setTip(null)}
              style={
                {
                  left: st.x,
                  top: st.y,
                  width: st.sr,
                  height: st.sr,
                  background: st.fill,
                  boxShadow: st.glow,
                  "--dx": `${st.dx.toFixed(0)}px`,
                  "--dy": `${st.dy.toFixed(0)}px`,
                  "--op": st.op,
                  "--z": `${st.z.toFixed(0)}px`,
                  animation:
                    `orbitIn .9s cubic-bezier(.22,.61,.36,1) ${st.delay}ms both` +
                    (st.pulse ? `, pulseStar 2s ease-in-out ${820 + st.delay}ms infinite` : ""),
                } as React.CSSProperties
              }
            >
              {st.beacon && (
                <>
                  <span className="star-beacon" aria-hidden />
                  <span className="star-beacon b2" aria-hidden />
                </>
              )}
              <span className="star-name" style={{ color: st.nameCol }}>
                {st.first}
              </span>
            </button>
          ))}
        </div>

        <div className="sky-legend left-4">
          <span>
            <i style={{ background: "#ffd873" }} />
            {t("zone_light")} · {groups[0]!.length}
          </span>
          <span>
            <i style={{ background: "#cdb98d" }} />
            {t("zone_slipping")} · {groups[1]!.length}
          </span>
          <span>
            <i style={{ background: "#9fb2d6" }} />
            {t("zone_dark")} · {groups[2]!.length}
          </span>
        </div>
        <div className="sky-legend right-4">
          <span>
            <i style={{ background: "#ffd873" }} />
            {t("key_well")}
          </span>
          <span>
            <i style={{ background: "#f0876b" }} />
            {t("key_needs")}
          </span>
          <span>
            <i style={{ background: "#9fb2d6" }} />
            {t("key_fading")}
          </span>
        </div>

        {tip && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-[11px] leading-relaxed text-white/90"
            style={{ left: Math.min(tip.x + 14, width - 190), top: tip.y + 14 }}
          >
            {tip.lines.map((l, i) => (
              <div key={i} className={i === 0 ? "font-semibold" : "text-white/70"}>
                {l}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {needsL.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] font-bold text-concern">
              🔴 Needs you now ({needsL.length})
            </span>
            {needsL.map((o) => (
              <NameChip key={o.s.id} onClick={() => open(o.s.id)} name={o.s.name} days={o.m.days} />
            ))}
          </div>
        )}
        {darkL.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] font-bold text-[#5a6b8f]">
              🌙 In the dark — worth a check-in ({darkL.length})
            </span>
            {darkL.map((o) => (
              <NameChip
                key={o.s.id}
                dark
                onClick={() => open(o.s.id)}
                name={o.s.name}
                days={o.m.days}
              />
            ))}
          </div>
        )}
        {needsL.length === 0 && darkL.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Everyone here has been seen recently. 🌞
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-faint">
        Centre = your attention · closer = seen more recently · past the dashed line = not seen in
        6+ weeks · size = how much noticed
      </p>
    </div>
  );
}

function NameChip({
  name,
  days,
  dark,
  onClick,
}: {
  name: string;
  days: number;
  dark?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] text-foreground shadow-sm transition hover:-translate-y-px hover:border-gold " +
        (dark ? "border-[#cbd5e8] bg-[#f3f6fb]" : "border-border bg-card")
      }
    >
      {name.split(" ")[0]}
      <span className="font-mono text-[11px] text-faint">{days > 900 ? "never" : `${days}d`}</span>
    </button>
  );
}
