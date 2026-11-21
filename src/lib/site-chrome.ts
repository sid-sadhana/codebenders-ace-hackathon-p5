import { landingContent, type LandingContent } from "@/lib/landing-content";

/** The parts of the landing content that every page's header and footer need. */
export type SiteChrome = Pick<LandingContent, "ui" | "nav" | "hrefs" | "footer">;

export function getSiteChrome(): SiteChrome {
  const { ui, nav, hrefs, footer } = landingContent;
  return { ui, nav, hrefs, footer };
}
