import { Outlet } from "@remix-run/react";

export const config = { runtime: "edge" };

export default function AdminPartners() {
  return <Outlet />;
}
