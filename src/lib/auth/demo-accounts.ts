import { z } from "zod";
import seedJson from "@/data/seed/users.seed.json";
import { seedUserSchema, type SeedUser } from "./types";

export const seedUsers: SeedUser[] = z.array(seedUserSchema).parse(seedJson);

/** What the login page needs to draw the one-click demo buttons. */
export type DemoAccount = Pick<
  SeedUser,
  "username" | "role" | "group" | "displayName" | "avatarInitials" | "useCase"
>;

export const demoAccounts: DemoAccount[] = seedUsers.map(
  ({ username, role, group, displayName, avatarInitials, useCase }) => ({
    username,
    role,
    group,
    displayName,
    avatarInitials,
    useCase,
  }),
);

const demoUsernames = new Set(seedUsers.map((user) => user.username));

export function isDemoUsername(username: string): boolean {
  return demoUsernames.has(username);
}
