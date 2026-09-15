import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_COOKIE_OPTS } from "./sessionCookie";

export { SESSION_COOKIE };

// Route Handlers can both read and write cookies via next/headers — this
// covers the request that middleware didn't get to attach a cookie to yet
// (e.g. a direct API call with no prior page load).
export async function getSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  store.set(SESSION_COOKIE, id, SESSION_COOKIE_OPTS);
  return id;
}
