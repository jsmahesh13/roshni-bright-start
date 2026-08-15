import { cn } from "@/lib/utils";

/** The Roshni mark: a small glowing sun. Roshni means "light". */
export function SunMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("inline-block shrink-0 rounded-full sun-glow", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 30%, var(--gold-soft), var(--gold) 55%, var(--gold-deep))`,
      }}
      aria-hidden="true"
    />
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
