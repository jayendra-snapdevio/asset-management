import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { destroySession } from "~/lib/session.server";

// Only action - no UI needed
export async function action({ request }: Route.ActionArgs) {
  const cookie = await destroySession();
  return redirect("/login", {
    headers: { "Set-Cookie": cookie },
  });
}

// Loader redirects GET requests to home
export async function loader() {
  return redirect("/");
}
