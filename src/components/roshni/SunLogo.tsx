import { cn } from "@/lib/utils";

/** The Roshni mark: a small glowing, gently morphing blob of light. Roshni means "light". */
export function SunMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("sun-blob-wrap shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="sun-blob-glow" />
      <span
        className="sun-blob blob-shape blob-breathe"
        style={{
          background: `radial-gradient(circle at 32% 30%, var(--gold-soft), var(--gold) 55%, var(--gold-deep))`,
        }}
      />
    </span>
  );
}

export function Wordmark({
  className,
  size = 28,
  textClass = "text-3xl",
}: {
  className?: string;
  size?: number;
  textClass?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <SunMark size={size} />
      <span className={cn("hand leading-none text-foreground", textClass)}>Roshni</span>
    </span>
  );
}
