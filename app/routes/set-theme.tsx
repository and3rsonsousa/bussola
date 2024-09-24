import type { ActionFunction } from "@vercel/remix";
import { json } from "@vercel/remix";

import { isTheme } from "~/lib/theme-provider";
import { getThemeSession } from "~/lib/theme.server";

export const config = { runtime: "edge" };

export const action: ActionFunction = async ({ request }) => {
  const themeSession = await getThemeSession(request);
  const requestText = await request.text();
  const form = new URLSearchParams(requestText);
  const theme = form.get("theme");

  if (!isTheme(theme)) {
    return json({
      success: false,
      message: `theme value of ${theme} is not a valid theme`,
    });
  }

  themeSession.setTheme(theme);
  return json(
    { success: true },
    { headers: { "Set-Cookie": await themeSession.commit() } },
  );
};
