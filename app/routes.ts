import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Home page
  index("routes/home.tsx"),

  // Auth routes (with layout)
  layout("routes/_auth.tsx", [
    route("login", "routes/_auth.login.tsx"),
    route("register", "routes/_auth.register.tsx"),
    route("forgot-password", "routes/_auth.forgot-password.tsx"),
    route("reset-password", "routes/_auth.reset-password.tsx"),
  ]),

  // Logout route (no UI)
  route("logout", "routes/logout.tsx"),

  // Unauthorized page
  route("unauthorized", "routes/unauthorized.tsx"),

  // API routes (resource routes)
  route("api/upload", "routes/api.upload.tsx"),

  // Dashboard routes (protected)
  layout("routes/_dashboard.tsx", [
    route("dashboard", "routes/_dashboard._index.tsx", { index: true }),
    route("dashboard/assets", "routes/_dashboard.assets.tsx"),
    route("dashboard/assets/new", "routes/_dashboard.assets.new.tsx"),
    route("dashboard/assets/:id", "routes/_dashboard.assets.$id.tsx"),
    route("dashboard/users", "routes/_dashboard.users.tsx"),
    route("dashboard/users/:id", "routes/_dashboard.users.$id.tsx"),
    route("dashboard/companies", "routes/_dashboard.companies.tsx"),
    route("dashboard/companies/:id", "routes/_dashboard.companies.$id.tsx"),
    route(
      "dashboard/companies/:id/admins",
      "routes/_dashboard.companies.$id.admins.tsx",
    ),
    route("dashboard/assignments", "routes/_dashboard.assignments.tsx"),
    route("dashboard/assignments/new", "routes/_dashboard.assignments.new.tsx"),
    route("dashboard/assignments/:id", "routes/_dashboard.assignments.$id.tsx"),
    route("dashboard/my-assets", "routes/_dashboard.my-assets.tsx"),
    route("dashboard/requests", "routes/_dashboard.requests.tsx"),
    route("dashboard/user/assets/new", "routes/_dashboard.user.assets.new.tsx"),
    route(
      "dashboard/user/assignments/new",
      "routes/_dashboard.user.assignments.new.tsx",
    ),
    route("dashboard/profile", "routes/_dashboard.profile.tsx"),
    route("dashboard/settings", "routes/_dashboard.settings.tsx"),
  ]),
] satisfies RouteConfig;
