import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return createRouter({
    routeTree,
    ...(base ? { basepath: base } : {}),
    defaultErrorComponent: AppErrorComponent,
  });
}
