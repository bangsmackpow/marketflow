import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.PROD
    ? window.location.origin
    : "http://localhost:3001",
  plugins: [organizationClient()],
});
