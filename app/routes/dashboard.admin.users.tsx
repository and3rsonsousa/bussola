import { Outlet } from "@remix-run/react";

export const loader = () => {
	return {};
};

export default function AdminUsers() {
	return <Outlet />;
}
