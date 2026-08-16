import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars, Text } from "@react-three/drei";
import { useNavigate } from "@tanstack/react-router";
import * as THREE from "three";

import { useT } from "@/hooks/useLang";
import type { StudentSummary } from "@/lib/roshni";
import { isNeeds, skyMetrics } from "@/components/roshni/Constellation";

/**
 * The night-sky class view, in three dimensions. Same restraint rules as the
 * 2D version — counts only, never a score — but children who've gone
 * unnoticed the longest now visibly float off the orbital plane and pulse
 * with a "beacon" ring, rather than shrinking into the smallest, dimmest
 * dot on screen.
 */

interface Props {
  rows: StudentSummary[];
  rangeDays: number;
  classLabel: string;
}

type Tier = "needs" | "dark" | "well";

interface PlanetData {
  id: string;
  zone: 0 | 1 | 2;
  radius: number;
  angle0: number;
  revSpeed: number;
  spinSpeed: number;
  sr: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  tier: Tier;
  beacon: boolean;
  bobAmp: number;
  bobSpeed: number;
  bobPhase: number;
  first: string;
  tip: string[];
}

const ZONE_R = [5.6, 8.4, 11.4];
const Z_PHASE = [0, 0.62, 1.15];

function buildPlanets(rows: StudentSummary[], rangeDays: number, classLabel: string): PlanetData[] {
  const list = rows.map((r) => ({ s: r.student, m: skyMetrics(r, rangeDays) }));
  const groups: (typeof list)[] = [[], [], []];
  [...list]
    .sort((a, b) => a.s.name.localeCompare(b.s.name))
    .forEach((o) => groups[o.m.days <= 21 ? 0 : o.m.days <= 42 ? 1 : 2]!.push(o));

  const out: PlanetData[] = [];
  groups.forEach((arr, zi) => {
    const n = arr.length;
    arr.forEach((o, j) => {
      const angle0 = (n ? (j / n) * Math.PI * 2 : 0) + Z_PHASE[zi]! + (j % 2 ? 0.16 : -0.16);
      // Spread a crowded ring into a loose band, not a perfect circle —
      // keeps labels from stacking when many students share a zone.
      const radius = ZONE_R[zi]! + (j % 3) * 0.55 - 0.55;
      const { m, s } = o;
      const dark = zi === 2;
      const needs = !dark && isNeeds(m);
      const neglect = dark ? Math.min(1, Math.max(0, m.days - 42) / 260) : 0;

      let sr: number, color: string, emissive: string, emissiveIntensity: number;
      let tier: Tier, beacon = false;
      let bobAmp = 0.05,
        bobSpeed = 0.6,
        spinSpeed = 0.25;

      if (needs) {
        sr = 0.42 + Math.min(1, m.recentCon / 5) * 0.26;
        color = "#f0876b";
        emissive = "#f0876b";
        emissiveIntensity = 1.6;
        tier = "needs";
        bobAmp = 0.34;
        bobSpeed = 1.5;
        spinSpeed = 0.9;
      } else if (dark) {
        sr = 0.4 + neglect * 0.32;
        color = "#cfe0ff";
        emissive = "#9fc0ff";
        emissiveIntensity = 0.7 + neglect * 0.9;
        tier = "dark";
        beacon = true;
        bobAmp = 0.16 + neglect * 0.22;
        bobSpeed = 0.5;
        spinSpeed = 0.35;
      } else {
        sr = 0.2 + Math.min(1, m.count / 22) * 0.34;
        color = "#ffd873";
        emissive = "#e0a020";
        emissiveIntensity = 0.55;
        tier = "well";
        bobAmp = 0.04;
        spinSpeed = 0.18;
      }

      out.push({
        id: s.id,
        zone: zi as 0 | 1 | 2,
        radius,
        angle0,
        revSpeed: 0.22 / radius,
        spinSpeed,
        sr,
        color,
        emissive,
        emissiveIntensity,
        tier,
        beacon,
        bobAmp,
        bobSpeed,
        bobPhase: Math.random() * Math.PI * 2,
        first: s.name.split(" ")[0] ?? s.name,
        tip: [
          s.name,
          `${classLabel} · roll ${s.roll}`,
          `${m.count} noticings · ${m.str}▲ ${m.con}▼`,
          m.days > 900 ? "never noticed" : `last seen ${m.days}d ago`,
        ],
      });
    });
  });
  return out;
}

const glowTexCache = new Map<string, THREE.CanvasTexture>();
function glowTexture(color: string): THREE.CanvasTexture {
  let tex = glowTexCache.get(color);
  if (tex) return tex;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex = new THREE.CanvasTexture(canvas);
  glowTexCache.set(color, tex);
  return tex;
}

function Sun() {
  const t = useT();
  const mesh = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => glowTexture("#ffdca0"), []);
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.09;
  });
  return (
    <group>
      <sprite scale={[6.5, 6.5, 1]}>
        <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.15, 40, 40]} />
        <meshStandardMaterial color="#f4cd76" emissive="#f4cd76" emissiveIntensity={1.2} roughness={0.4} />
      </mesh>
      <pointLight color="#ffdca0" intensity={6} distance={40} decay={2} />
      <Html center distanceFactor={11} style={{ pointerEvents: "none" }}>
        <div className="w-[68px] text-center text-[8px] font-extrabold uppercase tracking-wide text-[#6a4d12]">
          {t("yourattention")}
        </div>
      </Html>
    </group>
  );
}

function ZoneRing({ radius, dashed }: { radius: number; dashed?: boolean }) {
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = 128;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = dashed
      ? new THREE.LineDashedMaterial({
          color: "#ffcd7a",
          dashSize: 0.28,
          gapSize: 0.22,
          transparent: true,
          opacity: 0.5,
        })
      : new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.09 });
    const obj = new THREE.Line(geo, mat);
    if (dashed) obj.computeLineDistances();
    return obj;
  }, [radius, dashed]);
  return <primitive object={line} />;
}

function Planet({ data, onOpen, onHover, onLeave }: {
  data: PlanetData;
  onOpen: (id: string) => void;
  onHover: (id: string, tip: string[]) => void;
  onLeave: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const angle = data.angle0 + time * data.revSpeed;
    const y = Math.sin(time * data.bobSpeed + data.bobPhase) * data.bobAmp;
    if (group.current) {
      group.current.position.set(Math.cos(angle) * data.radius, y, Math.sin(angle) * data.radius);
    }
    if (mesh.current) mesh.current.rotation.y += delta * data.spinSpeed;
    if (matRef.current && data.tier === "needs") {
      matRef.current.emissiveIntensity = data.emissiveIntensity + Math.sin(time * 3.4) * 0.55;
    }
    if (data.beacon) {
      const cycle = (t: number, offset: number) => ((time * 0.65 + offset) % 1);
      for (const [ref, offset] of [[ring1, 0], [ring2, 0.5]] as const) {
        const c = cycle(time, offset);
        if (ref.current) {
          const s = 1 + c * 2.6;
          ref.current.scale.set(s, s, s);
          (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.75 * (1 - c));
        }
      }
    }
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(data.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
        onHover(data.id, data.tip);
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
        onLeave();
      }}
    >
      {data.beacon && (
        <>
          <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[data.sr * 1.15, data.sr * 1.32, 32]} />
            <meshBasicMaterial color="#dfeaff" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[data.sr * 1.15, data.sr * 1.32, 32]} />
            <meshBasicMaterial color="#dfeaff" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      <mesh ref={mesh} scale={hovered ? 1.18 : 1}>
        <sphereGeometry args={[data.sr, 24, 24]} />
        <meshStandardMaterial
          ref={matRef}
          color={data.color}
          emissive={data.emissive}
          emissiveIntensity={data.emissiveIntensity}
          roughness={0.45}
        />
      </mesh>
      <Text
        position={[0, -data.sr - 0.32, 0]}
        fontSize={0.22}
        color={data.tier === "well" ? "#ffe6a8" : data.tier === "needs" ? "#ffc2b2" : "#eaf1ff"}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.018}
        outlineColor="#0b0d18"
        outlineOpacity={0.85}
      >
        {data.first}
      </Text>
    </group>
  );
}

function Scene({
  planets,
  onOpen,
  onHover,
  onLeave,
}: {
  planets: PlanetData[];
  onOpen: (id: string) => void;
  onHover: (id: string, tip: string[]) => void;
  onLeave: () => void;
}) {
  return (
    <>
      {/* Explicit dark background — don't rely on canvas/CSS alpha compositing. */}
      <color attach="background" args={["#12142a"]} />
      <fog attach="fog" args={["#12142a", 18, 34]} />
      <ambientLight intensity={0.32} />
      <Stars radius={60} depth={35} count={2200} factor={2.4} saturation={0} fade speed={0.4} />
      <Sun />
      {ZONE_R.map((r, i) => (
        <ZoneRing key={i} radius={r} dashed={i === 2} />
      ))}
      {planets.map((p) => (
        <Planet key={p.id} data={p} onOpen={onOpen} onHover={onHover} onLeave={onLeave} />
      ))}
      <OrbitControls
        enablePan={false}
        minDistance={9}
        maxDistance={34}
        maxPolarAngle={Math.PI * 0.49}
        autoRotate
        autoRotateSpeed={0.35}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export function ConstellationThree({ rows, rangeDays, classLabel }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const [tip, setTip] = useState<string[] | null>(null);

  const planets = useMemo(
    () => buildPlanets(rows, rangeDays, classLabel),
    [rows, rangeDays, classLabel],
  );

  const list = useMemo(() => rows.map((r) => ({ s: r.student, m: skyMetrics(r, rangeDays) })), [rows, rangeDays]);
  const needsL = list
    .filter((o) => o.m.days <= 42 && isNeeds(o.m))
    .sort((a, b) => b.m.recentCon - a.m.recentCon);
  const darkL = list.filter((o) => o.m.days > 42).sort((a, b) => b.m.days - a.m.days);

  const open = (id: string) => navigate({ to: "/student/$studentId", params: { studentId: id } });

  const counts = { light: 0, slipping: 0, dark: 0 };
  for (const p of planets) {
    if (p.zone === 2) counts.dark++;
    else if (p.zone === 1) counts.slipping++;
    else counts.light++;
  }

  return (
    <div>
      <div className="sky-night relative mt-5 h-[604px] overflow-hidden rounded-[18px]">
        <Canvas
          camera={{ position: [0, 12, 12], fov: 48 }}
          dpr={[1, 1.8]}
          gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        >
          <Suspense fallback={null}>
            <Scene
              planets={planets}
              onOpen={open}
              onHover={(_, lines) => setTip(lines)}
              onLeave={() => setTip(null)}
            />
          </Suspense>
        </Canvas>

        <div className="sky-legend left-4">
          <span>
            <i style={{ background: "#ffd873" }} />
            {t("zone_light")} · {counts.light}
          </span>
          <span>
            <i style={{ background: "#cdb98d" }} />
            {t("zone_slipping")} · {counts.slipping}
          </span>
          <span>
            <i style={{ background: "#9fb2d6" }} />
            {t("zone_dark")} · {counts.dark}
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
        <div className="pointer-events-none absolute bottom-3 right-4 z-10 text-[10px] text-white/45">
          drag to orbit · scroll to zoom
        </div>

        {tip && (
          <div className="pointer-events-none absolute left-4 top-16 z-10 max-w-[220px] rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-[11px] leading-relaxed text-white/90">
            {tip.map((l, i) => (
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
            <span className="text-[12.5px] font-bold text-concern">🔴 Needs you now ({needsL.length})</span>
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
              <NameChip key={o.s.id} dark onClick={() => open(o.s.id)} name={o.s.name} days={o.m.days} />
            ))}
          </div>
        )}
        {needsL.length === 0 && darkL.length === 0 && (
          <div className="text-sm text-muted-foreground">Everyone here has been seen recently. 🌞</div>
        )}
      </div>

      <p className="mt-4 text-xs text-faint">
        Centre = your attention · orbit = when last seen · float &amp; beacon = calling for notice ·
        size = how urgently they need it
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
