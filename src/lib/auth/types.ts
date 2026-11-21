import { z } from "zod";
import { localizedStringSchema } from "@/lib/i18n/types";
import { profileSchema } from "@/types/profile";

export const ROLES = ["citizen", "volunteer", "admin"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const STAFF_ROLES: readonly Role[] = ["volunteer", "admin"];

export const GROUPS = ["student", "senior", "farmer", "women", "family"] as const;
export const groupSchema = z.enum(GROUPS);
export type Group = z.infer<typeof groupSchema>;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9_.-]+$/);

/** Fields shared by the seed file, the database document and the public user. */
const userBaseSchema = z.object({
  username: usernameSchema,
  role: roleSchema,
  group: groupSchema.nullable(),
  displayName: localizedStringSchema,
  avatarInitials: z.string().min(1).max(3),
  useCase: localizedStringSchema,
  profile: profileSchema.nullable(),
});

/** One entry in src/data/seed/users.seed.json (no password, no hash). */
export const seedUserSchema = userBaseSchema;
export type SeedUser = z.infer<typeof seedUserSchema>;

/** Shape stored in the users collection (the _id is added by MongoDB). */
export const userDocSchema = userBaseSchema.extend({
  passwordHash: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserDoc = z.infer<typeof userDocSchema>;

/** Safe to send to the browser: never includes the password hash. */
export const publicUserSchema = userBaseSchema.extend({
  id: z.string().min(1),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

/** The small, signed identity carried in the session cookie. */
export const sessionUserSchema = z.object({
  id: z.string().min(1),
  username: usernameSchema,
  role: roleSchema,
  name: localizedStringSchema,
  initials: z.string().min(1).max(3),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;
