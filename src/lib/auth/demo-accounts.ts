import { z } from "zod";
import seedJson from "@/data/seed/users.seed.json";
import { seedUserSchema, type SeedUser } from "./types";

export const seedUsers: SeedUser[] = z.array(seedUserSchema).parse(seedJson);

/** The login page only ever shows usernames, grouped for easier scanning. */
export type DemoAccount = Pick<SeedUser, "username" | "group">;

export const demoAccounts: DemoAccount[] = seedUsers.map(({ username, group }) => ({
  username,
  group,
}));
