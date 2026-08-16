import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Speech-to-text for the Notice composer.
 *
 * The audio is ephemeral: it arrives as base64, is forwarded straight to the
 * Lovable AI transcription gateway and is never written to storage or the
 * database. Only the returned text ever reaches the app.
 */
export const transcribeNoticing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { audio: string; mime: string; lang: "en" | "hi" | "kn" }) => {
    if (typeof input?.audio !== "string" || input.audio.length < 100) {
      throw new Error("empty-audio");
    }
    // ~12 MB of base64 ≈ 9 MB of audio — plenty for a spoken noticing.
    if (input.audio.length > 12_000_000) throw new Error("audio-too-long");
    return {
      audio: input.audio,
      mime: typeof input.mime === "string" ? input.mime : "audio/wav",
      lang: (["en", "hi", "kn"] as const).includes(input.lang) ? input.lang : "en",
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) throw new Error("transcription-unconfigured");

    const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
    const ext = data.mime.includes("mp4")
      ? "mp4"
      : data.mime.includes("webm")
        ? "webm"
        : data.mime.includes("mpeg")
          ? "mp3"
          : "wav";

    const form = new FormData();
    form.append("model", "openai/gpt-4o-transcribe");
    form.append("file", new Blob([bytes], { type: data.mime }), `noticing.${ext}`);
    // A language hint helps Indian-language accuracy; code-mixed speech is
    // still transcribed as spoken.
    form.append("language", data.lang);
    form.append(
      "prompt",
      "A schoolteacher in India speaking a short observation about a student. Speech may mix English with Hindi or Kannada. Keep names as spoken.",
    );

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("transcription failed", res.status, detail.slice(0, 500));
      if (res.status === 429) throw new Error("transcription-busy");
      if (res.status === 402) throw new Error("transcription-credits");
      throw new Error("transcription-failed");
    }

    const json = (await res.json()) as { text?: string };
    return { text: (json.text ?? "").trim() };
  });
