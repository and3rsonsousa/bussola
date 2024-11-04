import { Outlet, useOutletContext } from "@remix-run/react";
import { LogOut } from "lucide-react";

export const config = { runtime: "edge" };

export default function Partner() {
  const {
    showFeed,
    stateFilter,
    categoryFilter,
    setShowFeed,
    setStateFilter,
    setCategoryFilter,
  } = useOutletContext() as ContextType;

  return (
    <Outlet
      context={{
        setShowFeed,
        showFeed,
        categoryFilter,
        setCategoryFilter,
        stateFilter,
        setStateFilter,
      }}
    />
  );
}
