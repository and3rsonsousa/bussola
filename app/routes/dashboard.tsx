import { type LoaderFunctionArgs, json, redirect } from "@vercel/remix";
import { Outlet } from "@remix-run/react";
import { SupabaseServerClient } from "~/lib/supabase";
import Layout from "~/components/structure/Layout";

export async function loader({ request }: LoaderFunctionArgs) {
	const { supabase } = SupabaseServerClient({ request });

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	const [
		{ data: clients },
		{ data: people },
		{ data: categories },
		{ data: states },
		{ data: priorities },
	] = await Promise.all([
		supabase
			.from("clients")
			.select("*")
			.order("title", { ascending: true }),
		supabase.from("people").select("*").order("name", { ascending: true }),
		supabase
			.from("categories")
			.select("*")
			.order("priority", { ascending: true }),
		supabase.from("states").select("*").order("order", { ascending: true }),
		supabase
			.from("priority")
			.select("*")
			.order("order", { ascending: true }),
	]);

	const person = people?.find(
		(person) => person.user_id === user.id
	) as Person;

	return json(
		{
			clients,
			people,
			categories,
			user,
			states,
			priorities,
			person,
		} as DashboardDataType,
		200
	);
}

export default function Dashboard() {
	return (
		<Layout>
			<Outlet />
		</Layout>
	);
}
