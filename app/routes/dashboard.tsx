import { type LoaderFunctionArgs, json, redirect } from "@vercel/remix";
import { Outlet } from "@remix-run/react";
import { createClient } from "~/lib/supabase";
import Layout from "~/components/structure/Layout";

export async function loader({ request }: LoaderFunctionArgs) {
	const { supabase } = createClient(request);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	const [
		{ data: partners },
		{ data: people },
		{ data: categories },
		{ data: states },
		{ data: priorities },
	] = await Promise.all([
		supabase
			.from("partners")
			.select("*")
			.contains("users_ids", [user.id])
			.order("title", { ascending: true }),
		supabase.from("people").select("*").order("name", { ascending: true }),
		supabase
			.from("categories")
			.select("*")
			.order("order", { ascending: true }),
		supabase.from("states").select("*").order("order", { ascending: true }),
		supabase
			.from("priorities")
			.select("*")
			.order("order", { ascending: true }),
	]);

	const person = people?.find(
		(person) => person.user_id === user.id
	) as Person;

	return json(
		{
			partners,
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
