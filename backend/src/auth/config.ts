import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "../db";
import {
  user,
  session,
  account,
  verification,
  organization as orgTable,
  member,
  invitation,
  company,
} from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user,
      session,
      account,
      verification,
      organization: orgTable,
      member,
      invitation,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationHooks: {
        afterCreateOrganization: async ({ organization: org }) => {
          await db
            .insert(company)
            .values({
              id: org.id,
              name: org.name,
              slug: org.slug,
              productContext: null,
            })
            .run();
        },
      },
      async sendInvitationEmail(data) {
        const link = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        console.log(`[MarketFlow] Invitation sent to ${data.email}: ${link}`);
      },
    }),
  ],
  advanced: {
    crossSubDomainCookies: { enabled: true },
  },
});
