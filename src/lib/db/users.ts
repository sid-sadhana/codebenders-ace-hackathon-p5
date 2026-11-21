import "server-only";
import bcrypt from "bcryptjs";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "./mongo";
import {
  publicUserSchema,
  type PublicUser,
  type SessionUser,
  type UserDoc,
} from "@/lib/auth/types";

// Compared against when the username doesn't exist, so a wrong username
// takes about as long as a wrong password.
const DUMMY_HASH = "$2b$10$VkP.wemB16MgCL7NEHIBdO3c3Zcho.1.d2J1YTgsUNNVa.9moUgvi";

async function usersCollection(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}

function toPublicUser(doc: WithId<UserDoc>): PublicUser {
  return publicUserSchema.parse({
    id: doc._id.toHexString(),
    username: doc.username,
    role: doc.role,
    group: doc.group,
    displayName: doc.displayName,
    avatarInitials: doc.avatarInitials,
    useCase: doc.useCase,
    profile: doc.profile,
  });
}

export function toSessionUser(user: PublicUser): SessionUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.displayName,
    initials: user.avatarInitials,
  };
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await usersCollection()).findOne({ _id: new ObjectId(id) });
  return doc ? toPublicUser(doc) : null;
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<PublicUser | null> {
  const doc = await (await usersCollection()).findOne({ username });
  const matches = await bcrypt.compare(password, doc?.passwordHash ?? DUMMY_HASH);
  return doc && matches ? toPublicUser(doc) : null;
}
