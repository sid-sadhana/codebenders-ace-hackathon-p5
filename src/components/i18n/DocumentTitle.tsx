"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LocalizedString } from "@/lib/i18n/types";

/**
 * Keeps the browser tab title in the selected language. The server renders
 * the Telugu title through page metadata; this swaps it on the client.
 * Next can write the metadata title after hydration or a client-side
 * navigation, so the title is re-applied whenever the head changes.
 */
export function DocumentTitle({ title }: { title: LocalizedString }) {
  const { t } = useLanguage();
  const text = t(title);

  useEffect(() => {
    const apply = () => {
      if (document.title !== text) document.title = text;
    };
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [text]);

  return null;
}
