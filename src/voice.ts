/*
 * Population Genetics Coach
 * Copyright © 2026 Dr. Tahir Ali
 * All rights reserved. See LICENSE.
 */

import { useEffect, useState } from "react";

export type VoicePreferences = {
  enabled: boolean;
  autoRead: boolean;
  rate: "slow" | "normal";
};

const KEY = "pg-voice-preferences";
const defaults: VoicePreferences = {
  enabled: true,
  autoRead: false,
  rate: "normal",
};

export function loadVoicePreferences(): VoicePreferences {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(KEY) || "{}"),
    };
  } catch {
    return defaults;
  }
}

export function useVoicePreferences() {
  const [prefs, setPrefs] = useState(loadVoicePreferences);

  useEffect(() => {
    const refresh = () => setPrefs(loadVoicePreferences());
    window.addEventListener("pg-voice-change", refresh);
    return () => window.removeEventListener("pg-voice-change", refresh);
  }, []);

  const update = (patch: Partial<VoicePreferences>) => {
    const next = { ...prefs, ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    setPrefs(next);
    window.dispatchEvent(new Event("pg-voice-change"));
  };

  return { prefs, update };
}

type DictationOptions = {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
};

let recognition: any = null;

export function startDictation(options: DictationOptions): boolean {
  const speechWindow = window as any;
  const Recognition =
    speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

  if (!Recognition) return false;

  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // Ignore an already-stopped recognition instance.
    }
  }

  const instance = new Recognition();
  recognition = instance;
  instance.lang = "en-GB";
  instance.continuous = true;
  instance.interimResults = true;
  instance.maxAlternatives = 1;

  instance.onresult = (event: any) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0]?.transcript || "";
      if (event.results[i].isFinal) final += transcript;
      else interim += transcript;
    }

    options.onInterim(interim.trim());
    if (final.trim()) options.onFinal(final.trim());
  };

  instance.onerror = (event: any) =>
    options.onError(event.error || "Speech recognition error.");

  instance.onend = () => {
    recognition = null;
    options.onEnd();
  };

  const stop = () => {
    try {
      instance.stop();
    } catch {
      // Ignore an already-stopped recognition instance.
    }
  };

  window.addEventListener("pg-stop-dictation", stop, { once: true });
  instance.start();
  return true;
}

function replaceLatexFractions(text: string): string {
  let output = text;
  const fraction = /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g;

  for (let i = 0; i < 5; i += 1) {
    const next = output.replace(fraction, "$1 divided by $2");
    if (next === output) break;
    output = next;
  }

  return output;
}

export function prepareTextForSpeech(input: string): string {
  let text = input || "";

  text = text
    .replace(/```[\s\S]*?```/g, " Code example omitted. ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*([-*_])(?:\s*\1){2,}\s*$/gm, " ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
    .replace(/\$([^$\n]+)\$/g, "$1")
    .replace(/\\\((.*?)\\\)/g, "$1");

  text = replaceLatexFractions(text);

  text = text
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, "square root of $1")
    .replace(/\\sum\b/g, "sum")
    .replace(/\\times\b|\\cdot\b/g, " times ")
    .replace(/\\leq\b/g, " less than or equal to ")
    .replace(/\\geq\b/g, " greater than or equal to ")
    .replace(/\\neq\b/g, " not equal to ")
    .replace(/\\approx\b/g, " approximately ")
    .replace(/\\rightarrow\b|\\to\b/g, " leads to ")
    .replace(/\\infty\b/g, " infinity ")
    .replace(/\\Delta\b/g, " delta ")
    .replace(/\\theta\b|θ/g, " theta ")
    .replace(/\\pi\b|π/g, " nucleotide diversity ")
    .replace(/\\mu\b|μ/g, " mutation rate ")
    .replace(/\\rho\b|ρ/g, " rho ")
    .replace(/\\lambda\b|λ/g, " lambda ")
    .replace(/\bF[\s_-]*\{?ST\}?\b/gi, "F S T")
    .replace(/\bN[\s_-]*\{?e\}?\b/g, "effective population size")
    .replace(/\bTajima(?:'s|’s)?\s+D\b/gi, "Tajima's D")
    .replace(/\bH[\s_-]*\{?e\}?\b/g, "expected heterozygosity")
    .replace(/\bH[\s_-]*\{?o\}?\b/g, "observed heterozygosity")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}]/g, "")
    .replace(/^\s*[-*+]\s+/gm, ". ")
    .replace(/^\s*\d+[.)]\s+/gm, ". ")
    .replace(/[*#$>`~|]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.!?])(?=[A-Z])/g, "$1 ")
    .trim();

  return text;
}

let current: SpeechSynthesisUtterance | null = null;
let status = { speaking: false, id: null as string | null };
const listeners = new Set<() => void>();

const publish = (next: typeof status) => {
  status = next;
  listeners.forEach((listener) => listener());
};

export const getSpeechStatus = () => status;

export const subscribeSpeechStatus = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
  current = null;
  publish({ speaking: false, id: null });
}

function chooseEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"));

  return (
    voices.find(
      (voice) =>
        voice.localService && voice.lang.toLowerCase().startsWith("en-gb"),
    ) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb")) ||
    voices.find((voice) => voice.default) ||
    voices[0] ||
    null
  );
}

export function speakText(
  text: string,
  prefs: VoicePreferences,
  id: string,
): void {
  if (!prefs.enabled || !text.trim() || !("speechSynthesis" in window)) return;

  const spokenText = prepareTextForSpeech(text);
  if (!spokenText) return;

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(spokenText);
  current = utterance;
  utterance.lang = "en-GB";
  utterance.rate = prefs.rate === "slow" ? 0.78 : 0.94;
  utterance.pitch = 1;
  utterance.voice = chooseEnglishVoice();

  utterance.onstart = () => publish({ speaking: true, id });
  utterance.onend = () => {
    current = null;
    publish({ speaking: false, id: null });
  };
  utterance.onerror = () => {
    current = null;
    publish({ speaking: false, id: null });
  };

  window.speechSynthesis.speak(utterance);
}
