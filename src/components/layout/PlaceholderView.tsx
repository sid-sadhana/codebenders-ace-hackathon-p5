"use client";

import { Construction } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LocalizedString } from "@/lib/i18n/types";

type PlaceholderViewProps = {
  title: LocalizedString;
  text: LocalizedString;
  welcome?: LocalizedString;
  name?: LocalizedString;
};

export function PlaceholderView({ title, text, welcome, name }: PlaceholderViewProps) {
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {welcome && name && (
          <p className="mb-2 text-lg font-medium text-primary">
            {t(welcome).replace("{name}", t(name))}
          </p>
        )}
        <h1 className="text-3xl font-bold sm:text-4xl">{t(title)}</h1>
        <div className="mt-6 flex max-w-xl items-center gap-3 rounded-2xl border bg-card p-5 shadow-sm">
          <Construction aria-hidden="true" className="size-6 shrink-0 text-warning" />
          <p className="text-lg">{t(text)}</p>
        </div>
      </div>
    </section>
  );
}
