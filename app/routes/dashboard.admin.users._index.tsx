import { Form, Link, useLoaderData } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@vercel/remix";
import { Trash2Icon } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Avatar } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { supabase, headers } = await createClient(request);

	const { data: people } = await supabase
		.from("people")
		.select("*")
		.order("name", { ascending: true });

	return json({ people, headers });
};

export default function AdminPartners() {
	const { people } = useLoaderData<typeof loader>();
	return (
		<div className="overflow-hidden">
			<ScrollArea className="h-full w-full px-4 md:px-8">
				<div className="pt-16"></div>
				<div className="grid py-4 sm:grid-cols-2 lg:grid-cols-3">
					{people?.map((person: Person) => (
						<Link
							className="group transition flex items-center gap-4 rounded-xl px-6 py-4  hover:bg-gray-900"
							key={person.id}
							to={`/dashboard/admin/users/${person.id}`}
						>
							<Avatar
								item={{
									image: person.image,
									short: person.initials!,
								}}
								size="lg"
							/>
							<div className="text-2xl tracking-tighter font-bold">
								{`${person.name} ${person.surname}`}
							</div>

							<Form>
								<input
									name="id"
									value={person.id}
									type="hidden"
								/>
								<button className="opacity-0 group-hover:opacity-100">
									<Trash2Icon className="h-6 w-6 opacity-75" />
								</button>
							</Form>
						</Link>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
