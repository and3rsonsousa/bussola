import { Outlet, useOutletContext } from "@remix-run/react";

export const config = { runtime: "edge" };

export default function Partner() {
  const { setShowFeed, showFeed } = useOutletContext() as ContextType;
  return <Outlet context={{ setShowFeed, showFeed }} />;
}
