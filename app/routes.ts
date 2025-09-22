import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/dashboard", "./dashboard/dashboard.tsx"),
] satisfies RouteConfig;
