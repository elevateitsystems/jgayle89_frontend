import { createCollectionStore, delay } from "@/lib/demo-store";
import { userService } from "@/services/user-service";
import type { AppUser, ProfileLike, SessionRecord } from "@/types";

/**
 * DEMO AUTH ONLY. There is no real authentication: the password is not checked
 * (the form still requires 8+ characters). A "session" is just the id of a local
 * demo account. Replace with the real auth API (tokens / cookies) — and remember
 * the backend, not this code, is what must enforce roles and permissions.
 */
export const sessionStore = createCollectionStore<SessionRecord>("session", []);

export const authService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async login(email: string, _password: string): Promise<AppUser> {
    await delay(700);
    const user = userService.findByEmail(email);
    if (!user || email.toLowerCase().startsWith("fail@")) {
      throw new Error("These credentials don't match our records.");
    }
    if (user.status === "suspended") {
      throw new Error("This account is suspended. Please contact support.");
    }
    sessionStore.set([{ userId: user.id }]);
    return user;
  },

  async register(input: ProfileLike & { email: string }): Promise<AppUser> {
    const user = await userService.register(input);
    sessionStore.set([{ userId: user.id }]);
    return user;
  },

  async logout(): Promise<void> {
    await delay(150);
    sessionStore.set([]);
  },
};
