import { Outlet } from "@remix-run/react";

export const config = { runtime: "edge" };

export default function AdminUsers() {
  return <Outlet />;
}
