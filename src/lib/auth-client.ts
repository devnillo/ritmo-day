import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { Auth } from "@/server/auth/auth";

// Mesmo domínio do app: não precisa de baseURL.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<Auth>()],
});
