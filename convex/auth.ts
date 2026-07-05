import Resend from "@auth/core/providers/resend";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

// Magic link via Resend är den riktiga inloggningen.
// Password-providern finns för lokal utveckling och Playwright (seedade konton).
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: process.env.EMAIL_FROM ?? "Mutu <onboarding@resend.dev>",
    }),
    Password,
  ],
});
