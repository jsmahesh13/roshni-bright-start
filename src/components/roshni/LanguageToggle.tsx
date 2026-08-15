import { LANGS, useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

/** EN / हिं / ಕನ್ನಡ. Both the landing page and the app sidebar use this. */
export function LanguageToggle({ className, full }: { className?: string; full?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className={cn("flex gap-1 rounded-xl border border-border bg-card p-1", className)}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
            full && "flex-1",
            lang === l.code
              ? "bg-gold-soft text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
