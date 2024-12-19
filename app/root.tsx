import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import { json, LoaderFunctionArgs } from "@vercel/remix";

import {
  NonFlashOfWrongThemeEls,
  Theme,
  ThemeProvider,
  useTheme,
} from "~/lib/theme-provider";

import "./globals.css";
import clsx from "clsx";
import { useState } from "react";
import { getThemeSession } from "./lib/theme.server";

export type LoaderData = {
  theme: Theme | null;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const themeSession = await getThemeSession(request);

  return json(
    {
      theme: themeSession.getTheme(),
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL!,
        SUPABASE_KEY: process.env.SUPABASE_KEY!,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
        CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET!,
      },
    },
    200,
  );
}

export function App() {
  const [theme] = useTheme();
  const [showFeed, setShowFeed] = useState(false);
  const [isTransitioning, setTransitioning] = useState(false);
  const [stateFilter, setStateFilter] = useState<State>();
  const [categoryFilter, setCategoryFilter] = useState<Category[]>([]);

  const data = useLoaderData<typeof loader>();

  return (
    <html lang="pt-br" className={clsx(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"
        />

        <link rel="icon" href="/favicon.ico" />
        <Meta />

        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <NonFlashOfWrongThemeEls ssrTheme={Boolean(data.theme)} />
        <Links />
      </head>
      <body className="selection:bg-foreground selection:text-background">
        <Outlet
          context={{
            showFeed,
            isTransitioning,
            stateFilter,
            categoryFilter,
            setShowFeed,
            setTransitioning,
            setStateFilter,
            setCategoryFilter,
          }}
        />
        <ScrollRestoration />
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>();
  return (
    <ThemeProvider specifyedTheme={data.theme}>
      <App />
    </ThemeProvider>
  );
}
