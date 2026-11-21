"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  HeartHandshake,
  Home,
  Mic,
  Sprout,
  Users,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { type LandingContent } from "@/lib/landing-content";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  HeartHandshake,
  Sprout,
  Users,
  Home,
};

const TYPE_MS = 28;
const HOLD_MS = 2500;
const FADE_MS = 250;
const LANG_FADE_MS = 150;
const REDUCED_MS = 5000;

type Stage = "lang" | "typing" | "holding" | "fading";

type SegmenterLike = { segment(input: string): Iterable<{ segment: string }> };
type SegmenterCtor = new (
  locales?: string,
  options?: { granularity: "grapheme" },
) => SegmenterLike;

function toGraphemes(text: string, lang: string): string[] {
  const Ctor = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
  if (!Ctor) return Array.from(text);
  return Array.from(
    new Ctor(lang, { granularity: "grapheme" }).segment(text),
    (s) => s.segment,
  );
}

export function HeroUseCases({
  content,
  hrefs,
}: {
  content: LandingContent["hero"];
  hrefs: LandingContent["hrefs"];
}) {
  const { t, lang } = useLanguage();
  const len = content.useCases.length;

  const [index, setIndex] = useState(0);
  const full = t(content.useCases[index].placeholder);
  const [shown, setShown] = useState(full);
  const [phase, setPhase] = useState<Stage>("holding");
  const [reduced, setReduced] = useState(false);

  const hoverRef = useRef(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lastLang = useRef(lang);
  const lastIndex = useRef(0);

  const cycleMs = HOLD_MS + FADE_MS + Array.from(full).length * TYPE_MS;
  const hideCaret = reduced || phase === "fading";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Main state machine: typing -> holding -> fading -> next index.
  useEffect(() => {
    const el = textRef.current;
    const langChanged = lastLang.current !== lang;
    lastLang.current = lang;
    const advanced = lastIndex.current !== index;
    lastIndex.current = index;

    if (reduced) {
      setShown(full);
      setPhase("holding");
      if (el) el.style.opacity = "1";
      let swap = 0;
      const hold = window.setTimeout(() => {
        if (el) el.style.opacity = "0";
        swap = window.setTimeout(() => setIndex((i) => (i + 1) % len), FADE_MS);
      }, REDUCED_MS);
      return () => {
        window.clearTimeout(hold);
        window.clearTimeout(swap);
      };
    }

    const items = toGraphemes(full, lang);
    let stage: Stage = langChanged ? "lang" : advanced ? "typing" : "holding";
    let stageMs = 0;
    let count = 0;
    let cancelled = false;
    let raf = 0;
    let last = performance.now();

    setPhase(stage === "typing" ? "typing" : stage === "lang" ? "fading" : "holding");
    if (stage === "typing") {
      setShown("");
      if (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      }
    } else if (stage === "holding") {
      setShown(full);
    } else if (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(-4px)";
    }

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = now - last;
      last = now;
      if (!hoverRef.current) stageMs += dt;

      if (stage === "typing") {
        const n = Math.min(items.length, Math.floor(stageMs / TYPE_MS));
        if (n !== count) {
          count = n;
          setShown(items.slice(0, n).join(""));
        }
        if (n >= items.length) {
          stage = "holding";
          stageMs = 0;
          setPhase("holding");
        }
      } else if (stage === "holding") {
        if (stageMs >= HOLD_MS) {
          stage = "fading";
          stageMs = 0;
          setPhase("fading");
          if (el) {
            el.style.opacity = "0";
            el.style.transform = "translateY(-4px)";
          }
        }
      } else if (stage === "fading") {
        if (stageMs >= FADE_MS) {
          cancelled = true;
          setShown("");
          setIndex((i) => (i + 1) % len);
          return;
        }
      } else if (stageMs >= LANG_FADE_MS) {
        stage = "holding";
        stageMs = 0;
        setShown(full);
        setPhase("holding");
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [index, lang, full, reduced, len]);

  // Restart the active progress bar each time the index changes.
  useEffect(() => {
    const bar = barRefs.current[index];
    if (!bar) return;
    bar.style.animation = "none";
    void bar.offsetWidth;
    bar.style.animation = "";
    bar.style.animationPlayState = hoverRef.current ? "paused" : "running";
  }, [index]);

  const onEnter = () => {
    hoverRef.current = true;
    const bar = barRefs.current[index];
    if (bar) bar.style.animationPlayState = "paused";
  };

  const onLeave = () => {
    hoverRef.current = false;
    const bar = barRefs.current[index];
    if (bar) bar.style.animationPlayState = "running";
  };

  return (
    <section aria-labelledby="hero-title" className="bg-secondary py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-2 md:items-center md:gap-10 lg:gap-16">
          <div className="min-w-0">
            <h1 id="hero-title" className="text-4xl font-bold sm:text-5xl lg:text-6xl">
              {t(content.headline)}
            </h1>
            <p className="mt-4 max-w-prose text-lg text-muted-foreground lg:text-xl">
              {t(content.subtext)}
            </p>
            <div aria-hidden="true" className="mt-6 flex flex-wrap gap-2">
              {content.useCases.map((useCase, i) => {
                const Icon = ICONS[useCase.icon] ?? Home;
                const active = i === index;
                return (
                  <span
                    key={useCase.id}
                    className={cn(
                      "relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-300",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground",
                    )}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {t(useCase.chipLabel)}
                    <span
                      ref={(node) => {
                        barRefs.current[i] = node;
                      }}
                      aria-hidden="true"
                      className={cn(
                        "absolute bottom-0 left-0 h-0.5 w-full origin-left bg-primary-foreground/70",
                        active ? "cwy-progress" : "cwy-progress-off",
                      )}
                      style={
                        active
                          ? { animationDuration: `${cycleMs}ms` }
                          : { transform: "scaleX(0)" }
                      }
                    />
                  </span>
                );
              })}
            </div>
          </div>

          <div className="min-w-0">
            <div
              role="img"
              aria-label={t(content.demoLabel)}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
              className="relative mt-6 h-48 cursor-default select-none overflow-hidden rounded-2xl border bg-card p-4 pr-12 text-base leading-relaxed shadow-sm sm:h-44 md:mt-0"
            >
              <Mic aria-hidden="true" className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
              <p
                aria-hidden="true"
                ref={textRef}
                style={{ transitionDuration: `${FADE_MS}ms` }}
                className="will-change-[opacity,transform] transition-[opacity,transform] duration-150"
              >
                {shown}
                <span
                  aria-hidden="true"
                  className="cwy-caret ml-0.5 inline-block h-[1em] w-0.5 bg-foreground align-text-bottom"
                  style={hideCaret ? { display: "none" } : undefined}
                />
              </p>
            </div>
            <Link href={hrefs.check} className={cn(buttonVariants({ size: "lg" }), "mt-4 h-11 w-full sm:w-auto")}>
              {t(content.primaryCta)}
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">{t(content.trustLine)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
