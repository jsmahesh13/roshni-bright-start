import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLang, useT } from "@/hooks/useLang";
import { transcribeNoticing } from "@/lib/transcribe.functions";

type State = "idle" | "recording" | "transcribing";

/** Concatenate captured PCM, downsample to 16 kHz mono, write a complete WAV. */
function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let at = 0;
  for (const c of chunks) {
    merged.set(c, at);
    at += c.length;
  }

  const target = 16000;
  const ratio = sampleRate / target;
  const outLength = Math.floor(merged.length / ratio);
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) out[i] = merged[Math.floor(i * ratio)] ?? 0;

  const buffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + outLength * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, outLength * 2, true);
  for (let i = 0; i < outLength; i++) {
    const s = Math.max(-1, Math.min(1, out[i] ?? 0));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-failed"));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Records a spoken noticing and hands the transcript back to the composer
 * textarea. Nothing is stored — the audio lives only in memory until the
 * transcript comes back.
 */
export function VoiceCapture({ onTranscript }: { onTranscript: (text: string) => void }) {
  const t = useT();
  const { lang } = useLang();
  const transcribe = useServerFn(transcribeNoticing);

  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pcmRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => teardown(), []);

  function teardown() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    nodeRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    void ctxRef.current?.close().catch(() => undefined);
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
  }

  async function start() {
    setNotice(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setNotice(t("vc_nomic"));
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setNotice(t("vc_nomic"));
      return;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const node = ctx.createScriptProcessor(4096, 1, 1);
    pcmRef.current = [];
    node.onaudioprocess = (e) => {
      pcmRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };
    source.connect(node);
    node.connect(ctx.destination);

    ctxRef.current = ctx;
    streamRef.current = stream;
    sourceRef.current = source;
    nodeRef.current = node;

    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setState("recording");
  }

  async function stop() {
    const ctx = ctxRef.current;
    const chunks = pcmRef.current;
    const rate = ctx?.sampleRate ?? 48000;
    teardown();
    setState("transcribing");

    const blob = encodeWav(chunks, rate);
    if (blob.size < 4096) {
      setState("idle");
      setNotice(t("vc_tooshort"));
      return;
    }

    try {
      const audio = await blobToBase64(blob);
      const { text } = await transcribe({ data: { audio, mime: "audio/wav", lang } });
      if (!text) {
        setNotice(t("vc_empty"));
        setState("idle");
        return;
      }
      onTranscript(text);
      toast.success(t("vc_added"));
      setState("idle");
    } catch {
      setNotice(t("vc_failed"));
      setState("idle");
    }
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {state === "idle" && (
        <Button type="button" variant="outline" className="bg-card" onClick={() => void start()}>
          <Mic className="mr-2 h-4 w-4" aria-hidden />
          {t("vc_record")}
        </Button>
      )}

      {state === "recording" && (
        <Button
          type="button"
          variant="outline"
          className="border-concern/60 bg-concern/10 text-concern hover:bg-concern/15"
          onClick={() => void stop()}
        >
          <span className="relative mr-2 flex h-3 w-3" aria-hidden>
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-concern/60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-concern" />
          </span>
          {t("vc_stop")} · {mmss}
          <Square className="ml-2 h-3.5 w-3.5" aria-hidden />
        </Button>
      )}

      {state === "transcribing" && (
        <Button type="button" variant="outline" className="bg-card" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          {t("vc_transcribing")}
        </Button>
      )}

      {notice && <span className="text-xs text-concern">{notice}</span>}
      {!notice && state === "idle" && (
        <span className="text-xs text-faint">{t("vc_hint")}</span>
      )}
    </div>
  );
}
