import { createCollectionStore, delay } from "@/lib/demo-store";
import type { DemoSession } from "@/types";

/**
 * DEMO AUTH ONLY. There is no real authentication: any well-formed credentials
 * create a local "session" so the UI flows can be exercised. Replace with the
 * real auth API (tokens / cookies) in Phase 2.
 */
export const sessionStore = createCollectionStore<DemoSession>("session", []);

export const authService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async login(email: string, _password: string): Promise<DemoSession> {
    await delay(700);
    // Demo-only failure path so the error state can be seen.
    if (email.toLowerCase().startsWith("fail@")) {
      throw new Error("These credentials don't match our records.");
    }
    const session: DemoSession = {
      name: email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      role: "admin",
    };
    sessionStore.set([session]);
    return session;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async register(name: string, email: string, _password: string): Promise<DemoSession> {
    await delay(900);
    if (email.toLowerCase().startsWith("taken@")) {
      throw new Error("An account with this email already exists.");
    }
    const session: DemoSession = { name, email, role: "member" };
    sessionStore.set([session]);
    return session;
  },

  async logout(): Promise<void> {
    await delay(150);
    sessionStore.set([]);
  },
};
