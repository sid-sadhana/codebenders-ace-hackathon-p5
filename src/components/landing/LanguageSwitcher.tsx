"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Lang, LocalizedString } from "@/lib/i18n/types";

type LanguageSwitcherProps = {
  groupLabel: LocalizedString;
  options: { te: LocalizedString; en: LocalizedString };
};

const CODES: Lang[] = ["te", "en"];

export function LanguageSwitcher({ groupLabel, options }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t(groupLabel)}
      className="inline-flex rounded-full border bg-card p-0.5"
    >
      {CODES.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(code)}
            className={[
              "min-h-11 min-w-11 px-3 rounded-full text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            ].join(" ")}
          >
            {t(options[code])}
          </button>
        );
      })}
    </div>
  );
}
