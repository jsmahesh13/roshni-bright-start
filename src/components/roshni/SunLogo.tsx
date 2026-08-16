import { Link } from "@tanstack/react-router";

import { useUser } from "@/hooks/useSession";
import { useT } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

/** The Roshni mark: a warm glass orb, catching and slowly turning its own light. Roshni means "light". */
export function SunMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("sun-orb-wrap shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="sun-orb-glow" />
      <span className="sun-orb">
        <span className="sun-orb-base" />
        <span className="sun-orb-band" />
        <span className="sun-orb-band b2" />
        <span className="sun-orb-shade" />
        <span className="sun-orb-spec" />
        <span className="sun-orb-rim" />
        <span className="sun-orb-grain" />
      </span>
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
