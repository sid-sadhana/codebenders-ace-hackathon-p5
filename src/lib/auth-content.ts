import { z } from "zod";
import { localizedStringSchema } from "@/lib/i18n/types";
import authJson from "@/data/auth.json";

const s = localizedStringSchema;

const pageSchema = z.object({ title: s, metaTitle: s });

const authSchema = z.object({
  login: z.object({
    metaTitle: s,
    title: s,
    subtitle: s,
    benefits: z.array(s).length(3),
    demoNotice: s,
    quickLoginHeading: s,
    groups: z.object({
      student: s,
      senior: s,
      farmer: s,
      women: s,
      family: s,
      staff: s,
    }),
    formHeading: s,
    usernameLabel: s,
    passwordLabel: s,
    showPassword: s,
    hidePassword: s,
    submit: s,
    submitting: s,
    hint: s,
    errors: z.object({ invalid: s, tooMany: s, unavailable: s }),
    guestNote: s,
    guestCta: s,
  }),
  account: z.object({
    menuLabel: s,
    myTracker: s,
    admin: s,
    logout: s,
    roles: z.object({ citizen: s, volunteer: s, admin: s }),
  }),
  pages: z.object({
    placeholder: s,
    welcome: s,
    check: pageSchema,
    about: pageSchema,
    tracker: pageSchema,
    admin: pageSchema,
  }),
});

export type AuthContent = z.infer<typeof authSchema>;
export type LoginContent = AuthContent["login"];
export type AccountContent = AuthContent["account"];
export type PageCopy = z.infer<typeof pageSchema>;

export const authContent: AuthContent = authSchema.parse(authJson);
