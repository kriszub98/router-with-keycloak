import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/dashboard", "./dashboard/dashboard.tsx"),
  route("/login", "routes/login.tsx"),
  route("/infinite", "routes/infinite-list.tsx"),
  route("/infiniteApi", "routes/infinite-api.tsx"),
  route("/accordion", "accordion.tsx"),
  route("/fileUpload", "routes/file-upload.tsx"),
] satisfies RouteConfig;
