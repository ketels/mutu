import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicPage = createRouteMatcher(["/login", "/join/(.*)"]);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    const authed = await convexAuth.isAuthenticated();
    if (request.nextUrl.pathname === "/login" && authed) {
      return nextjsMiddlewareRedirect(request, "/");
    }
    if (!isPublicPage(request) && !authed) {
      return nextjsMiddlewareRedirect(request, "/login");
    }
  },
  // Utan maxAge blir auth-kakan en session-kaka som dör med webbläsaren.
  // 30 dagar matchar Convex Auths backend-session (totalDurationMs).
  { cookieConfig: { maxAge: 60 * 60 * 24 * 30 } },
);

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
