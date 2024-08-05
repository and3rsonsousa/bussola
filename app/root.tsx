import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import { json } from "@vercel/remix";

import "./globals.css";

export async function loader() {
  return json(
    {
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL!,
        SUPABASE_KEY: process.env.SUPABASE_KEY!,
      },
    },
    200,
  );
}

export function Layout() {
  return (
    <html lang="pt-br">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"
        />
        {/* <script
          type="text/javascript"
          src="//assets.mediadelivery.net/playerjs/player-0.1.0.min.js"
        ></script> */}
        <link rel="icon" href="/icon.png" />
        <Meta />
        <Links />
      </head>
      <body className="dark">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
