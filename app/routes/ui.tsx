import { useLoaderData } from "@remix-run/react";
import {
	json,
	redirect,
	type LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { Avatar, Icons } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

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

export default function UI() {
	const { categories } = useLoaderData<typeof loader>() as DashboardDataType;
	return (
		<div className="p-8 flex flex-col gap-8">
			<h1 className="text-5xl font-bold" style={{ fontStretch: "125%" }}>
				UI
			</h1>
			<div>
				<h1 className="text-3xl font-bold">Avatar</h1>
				<div className="flex gap-2 mt-4">
					<Avatar item={{ short: "cnvt" }} size="xs" />
					<Avatar item={{ short: "brenda" }} size="xs" />
					<Avatar item={{ short: "arc" }} size="xs" />
					<Avatar item={{ short: "smart" }} size="xs" />
					<div className="flex">
						<Avatar item={{ short: "cnvt" }} group size="xs" />
						<Avatar item={{ short: "brenda" }} group size="xs" />
						<Avatar item={{ short: "arc" }} group size="xs" />
						<Avatar item={{ short: "smart" }} group size="xs" />
					</div>
				</div>

				<div className="flex gap-2 mt-4">
					<Avatar item={{ short: "cnvt" }} />
					<Avatar item={{ short: "brenda" }} />
					<Avatar item={{ short: "arc" }} />
					<Avatar item={{ short: "smart" }} />
					<div className="flex">
						<Avatar item={{ short: "cnvt" }} group />
						<Avatar item={{ short: "brenda" }} group />
						<Avatar item={{ short: "arc" }} group />
						<Avatar item={{ short: "smart" }} group />
					</div>
				</div>

				<div className="flex gap-2 mt-4">
					<Avatar item={{ short: "cnvt" }} size="md" />
					<Avatar item={{ short: "brenda" }} size="md" />
					<Avatar item={{ short: "arc" }} size="md" />
					<Avatar item={{ short: "smart" }} size="md" />
					<div className="flex">
						<Avatar item={{ short: "cnvt" }} group size="md" />
						<Avatar item={{ short: "brenda" }} group size="md" />
						<Avatar item={{ short: "arc" }} group size="md" />
						<Avatar item={{ short: "smart" }} group size="md" />
					</div>
				</div>

				<div className="flex gap-2 mt-4">
					<Avatar item={{ short: "cnvt" }} size="lg" />
					<Avatar item={{ short: "brenda" }} size="lg" />
					<Avatar item={{ short: "arc" }} size="lg" />
					<Avatar item={{ short: "smart" }} size="lg" />
					<div className="flex">
						<Avatar item={{ short: "cnvt" }} group size="lg" />
						<Avatar item={{ short: "brenda" }} group size="lg" />
						<Avatar item={{ short: "arc" }} group size="lg" />
						<Avatar item={{ short: "smart" }} group size="lg" />
					</div>
				</div>
			</div>
			<div>
				<h1 className="text-3xl font-bold">Categorias</h1>
				<div className="grid gap-8 mt-4 grid-cols-3">
					{categories.map((category) => (
						<div
							key={category.id}
							className="flex gap-4 items-center text-2xl font-light"
						>
							<div
								className={`bg-${category.slug} border-8 size-8 rounded-full`}
							></div>
							<Icons className="size-8" id={category.slug} />
							<div>{category.title}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
