import { users as seed } from "@/data/users";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { sanitizePermissions } from "@/lib/permissions";
import { newId } from "@/lib/slug";
import type { AppUser, Permission, ProfileLike } from "@/types";

/**
 * User data-access layer (demo implementation).
 *
 * NOTE: nothing here is a security boundary — it all runs in the browser. The
 * real API must authenticate every request and check the caller's role and
 * permissions server-side (e.g. only admins may create/modify staff or users).
 */
export const userStore = createCollectionStore<AppUser>("users", seed);

const normEmail = (e: string) => e.trim().toLowerCase();
const today = () => new Date().toISOString().slice(0, 10);

export type ProfileInput = ProfileLike;

export interface StaffInput {
  name: string;
  email: string;
  permissions: Permission[];
}

export const userService = {
  findByEmail(email: string): AppUser | undefined {
    return userStore.getSnapshot().find((u) => normEmail(u.email) === normEmail(email));
  },

  /** Public self-registration. Always creates a standard registered user — never staff/admin. */
  async register(input: ProfileLike & { email: string }): Promise<AppUser> {
    await delay(700);
    if (userService.findByEmail(input.email)) throw new Error("An account with this email already exists.");
    const user: AppUser = {
      id: newId("usr"),
      name: input.name.trim(),
      email: normEmail(input.email),
      role: "user",
      userType: input.userType,
      branch: input.userType === "veteran" ? input.branch : undefined,
      permissions: [],
      status: "active",
      createdAt: today(),
    };
    userStore.set([...userStore.getSnapshot(), user]);
    return user;
  },

  /** A member editing their own profile. Role, permissions and email are not editable here. */
  async updateProfile(id: string, input: ProfileInput): Promise<AppUser> {
    await delay(400);
    return patch(id, {
      name: input.name.trim(),
      userType: input.userType,
      branch: input.userType === "veteran" ? input.branch : undefined,
    });
  },

  /** Business Owners (and anyone who only needs a rename) — no account-type fields involved. */
  async updateName(id: string, name: string): Promise<AppUser> {
    await delay(400);
    return patch(id, { name: name.trim() });
  },

  async setStatus(id: string, status: AppUser["status"]): Promise<AppUser> {
    await delay(300);
    const target = userStore.getSnapshot().find((u) => u.id === id);
    if (target?.role === "admin") throw new Error("Administrator accounts can't be suspended.");
    return patch(id, { status });
  },

  async removeUser(id: string): Promise<void> {
    await delay(300);
    const target = userStore.getSnapshot().find((u) => u.id === id);
    if (target?.role === "admin") throw new Error("Administrator accounts can't be deleted.");
    userStore.set(userStore.getSnapshot().filter((u) => u.id !== id));
  },

  async createStaff(input: StaffInput): Promise<AppUser> {
    await delay(500);
    if (userService.findByEmail(input.email)) throw new Error("An account with this email already exists.");
    const user: AppUser = {
      id: newId("usr"),
      name: input.name.trim(),
      email: normEmail(input.email),
      role: "staff",
      permissions: sanitizePermissions(input.permissions),
      status: "active",
      createdAt: today(),
    };
    userStore.set([...userStore.getSnapshot(), user]);
    return user;
  },

  async updateStaff(id: string, input: Partial<StaffInput>): Promise<AppUser> {
    await delay(400);
    const current = userStore.getSnapshot().find((u) => u.id === id);
    if (!current || current.role !== "staff") throw new Error("Staff member not found.");
    return patch(id, {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.permissions !== undefined && { permissions: sanitizePermissions(input.permissions) }),
    });
  },

  reset() {
    userStore.reset();
  },
};

function patch(id: string, changes: Partial<AppUser>): AppUser {
  const all = userStore.getSnapshot();
  const current = all.find((u) => u.id === id);
  if (!current) throw new Error("User not found.");
  const next = { ...current, ...changes };
  userStore.set(all.map((u) => (u.id === id ? next : u)));
  return next;
}
