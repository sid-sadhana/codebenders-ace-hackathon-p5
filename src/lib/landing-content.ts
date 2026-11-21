import { z } from "zod";
import { localizedStringSchema } from "@/lib/i18n/types";
import landingJson from "@/data/landing.json";

const iconValues = [
  "GraduationCap",
  "HeartHandshake",
  "Sprout",
  "Users",
  "Home",
] as const;

const titledTextSchema = z.object({
  title: localizedStringSchema,
  text: localizedStringSchema,
});

const useCaseIconSchema = z.enum(iconValues);
const groupIconSchema = z.enum(iconValues);

const useCaseSchema = z.object({
  id: z.enum(["student", "senior", "farmer", "women", "family"]),
  icon: useCaseIconSchema,
  chipLabel: localizedStringSchema,
  placeholder: localizedStringSchema,
});

export type HeroUseCase = z.infer<typeof useCaseSchema>;
export type UseCaseId = HeroUseCase["id"];
export type UseCaseIcon = z.infer<typeof useCaseIconSchema>;
export type GroupIcon = z.infer<typeof groupIconSchema>;

const exampleStatusSchema = z.enum(["likely", "maybe", "announced"]);
export type ExampleStatus = z.infer<typeof exampleStatusSchema>;

const exampleWhySchema = z.object({
  kind: z.enum(["ok", "question"]),
  text: localizedStringSchema,
});

const questionRowSchema = z
  .object({
    question: localizedStringSchema,
    options: z.array(localizedStringSchema).length(3),
  })
  .nullable();

const exampleSourceSchema = z
  .object({
    url: z.string().url(),
    host: z.string().min(1),
  })
  .nullable();

const exampleCardSchema = z.object({
  id: z.enum(["student", "senior", "farmer", "women", "family", "honesty"]),
  groupLabel: localizedStringSchema,
  schemeName: localizedStringSchema,
  status: exampleStatusSchema,
  statusLabel: localizedStringSchema,
  why: z.array(exampleWhySchema),
  questionRow: questionRowSchema,
  benefit: localizedStringSchema.nullable(),
  statusLine: localizedStringSchema.nullable(),
  source: exampleSourceSchema,
  pendingVerification: z.boolean(),
  note: localizedStringSchema.nullable(),
});

export type ExampleCard = z.infer<typeof exampleCardSchema>;

const audienceGroupSchema = z.object({
  id: z.enum(["students", "senior", "farmers", "women", "families"]),
  icon: groupIconSchema,
  title: localizedStringSchema,
  schemes: z.array(localizedStringSchema).length(3),
});

const landingSchema = z.object({
  meta: z.object({
    title: localizedStringSchema,
    description: localizedStringSchema,
  }),
  ui: z.object({
    skipToContent: localizedStringSchema,
    languageGroupLabel: localizedStringSchema,
    languageOptions: z.object({
      te: localizedStringSchema,
      en: localizedStringSchema,
    }),
    mobileMenuOpen: localizedStringSchema,
    mobileMenuTitle: localizedStringSchema,
    opensNewTab: localizedStringSchema,
  }),
  nav: z.object({
    brandName: localizedStringSchema,
    links: z
      .array(
        z.object({
          href: z.string(),
          label: localizedStringSchema,
        }),
      )
      .length(3),
    demoPill: localizedStringSchema,
    loginLabel: localizedStringSchema,
  }),
  hero: z.object({
    headline: localizedStringSchema,
    subtext: localizedStringSchema,
    demoLabel: localizedStringSchema,
    primaryCta: localizedStringSchema,
    trustLine: localizedStringSchema,
    useCases: z.array(useCaseSchema).length(5),
  }),
  problem: z.object({
    title: localizedStringSchema,
    intro: localizedStringSchema,
    items: z.array(titledTextSchema).length(3),
  }),
  how: z.object({
    title: localizedStringSchema,
    intro: localizedStringSchema,
    steps: z.array(titledTextSchema).length(4),
  }),
  features: z.object({
    title: localizedStringSchema,
    intro: localizedStringSchema,
    items: z.array(titledTextSchema).length(8),
    adminNote: localizedStringSchema,
  }),
  example: z.object({
    title: localizedStringSchema,
    intro: localizedStringSchema,
    badge: localizedStringSchema,
    whyTitle: localizedStringSchema,
    cards: z.array(exampleCardSchema).length(6),
    illustrativeNote: localizedStringSchema,
    sourceLabel: localizedStringSchema,
    verifiedLabel: localizedStringSchema,
    pendingLabel: localizedStringSchema,
  }),
  audience: z.object({
    title: localizedStringSchema,
    intro: localizedStringSchema,
    groups: z.array(audienceGroupSchema).length(5),
  }),
  faq: z.object({
    title: localizedStringSchema,
    intro: localizedStringSchema,
    items: z
      .array(
        z.object({
          question: localizedStringSchema,
          answer: localizedStringSchema,
        }),
      )
      .length(6),
  }),
  cta: z.object({
    title: localizedStringSchema,
    text: localizedStringSchema,
    primaryCta: localizedStringSchema,
  }),
  footer: z.object({
    disclaimer: localizedStringSchema,
    aboutLabel: localizedStringSchema,
    loginLabel: localizedStringSchema,
    freeLine: localizedStringSchema,
    projectNotice: localizedStringSchema,
  }),
  hrefs: z.object({
    check: z.string(),
    about: z.string(),
    login: z.string(),
  }),
});

export type LandingContent = z.infer<typeof landingSchema>;

export const landingContent: LandingContent = landingSchema.parse(landingJson);
