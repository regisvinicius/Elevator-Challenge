import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { RootLayout } from "./routes/__root";
import { ConcurrencyPage } from "./routes/concurrency";
import { EasyPage } from "./routes/easy";
import { EnterprisePage } from "./routes/enterprise";
import { MediumPage } from "./routes/medium";

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => redirect({ to: "/easy" }),
});

const easyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/easy",
  component: EasyPage,
});

const mediumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/medium",
  component: MediumPage,
});

const enterpriseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/enterprise",
  component: EnterprisePage,
});

const concurrencyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/concurrency",
  component: ConcurrencyPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  easyRoute,
  mediumRoute,
  enterpriseRoute,
  concurrencyRoute,
]);

export const router = createRouter({ routeTree });
