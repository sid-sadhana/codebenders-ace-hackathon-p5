"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LocalizedString } from "@/lib/i18n/types";

export function SectionHeader({
  id,
  title,
  intro,
}: {
  id: string;
  title: LocalizedString;
  intro?: LocalizedString;
}) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 id={id} className="text-2xl font-bold sm:text-3xl lg:text-4xl">
        {t(title)}
      </h2>
      {intro ? (
        <p className="mt-4 text-base text-muted-foreground lg:text-lg">
          {t(intro)}
        </p>
      ) : null}
    </div>
  );
}
