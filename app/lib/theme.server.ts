import { createCookie } from "react-router";

export type Theme = "light" | "dark" | "system";

const themeCookie = createCookie("__theme", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
});

/**
 * Get the theme from the request cookies.
 * Defaults to "system" if not set.
 */
export async function getTheme(request: Request): Promise<Theme> {
  const cookieHeader = request.headers.get("Cookie");
  const theme = await themeCookie.parse(cookieHeader);
  
  if (theme === "light" || theme === "dark" || theme === "system") {
    return theme;
  }
  
  return "system";
}

/**
 * Serialize the theme into a cookie string.
 */
export async function setTheme(theme: Theme): Promise<string> {
  return themeCookie.serialize(theme);
}
