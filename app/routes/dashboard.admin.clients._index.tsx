import { LoaderFunctionArgs, json } from "@vercel/remix";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { Trash2Icon } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AvatarClient } from "~/lib/helpers";
import { SupabaseServerClient } from "~/lib/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { supabase, headers } = await SupabaseServerClient({ request });

	const { data: clients } = await supabase
		.from("clients")
		.select("*")
		.order("title", { ascending: true });

	return json({ clients, headers });
};

export default function AdminClients() {
	const { clients } = useLoaderData<typeof loader>();
	return (
		<div className="overflow-hidden">
			<ScrollArea className="h-full w-full px-4 md:px-8">
				<div className="pt-16"></div>
				<div className="grid py-4 sm:grid-cols-2 lg:grid-cols-3">
					{clients?.map((client) => (
						<div
							className="group flex items-center justify-between  rounded-xl px-6 py-4 font-medium   hover:bg-gray-900"
							key={client.id}
						>
							<div className="flex items-center gap-2">
								<AvatarClient client={client} size="lg" />
								<Link
									to={`/dashboard/admin/clients/${client.slug}`}
									className="text-2xl"
								>
									{client.title}
								</Link>
							</div>
							<Form>
								<input
									name="id"
									value={client.id}
									type="hidden"
								/>
								<button className="opacity-0 group-hover:opacity-100">
									<Trash2Icon className="h-6 w-6 opacity-75" />
								</button>
							</Form>
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
