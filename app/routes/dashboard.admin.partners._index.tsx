import { Form, Link, useLoaderData } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@vercel/remix";
import { Trash2Icon } from "lucide-react";
import { AvatarPartner } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { supabase, headers } = await createClient(request);

	const { data: partners } = await supabase
		.from("partners")
		.select("*")
		.order("title", { ascending: true });

	return json({ partners, headers });
};

export default function AdminPartners() {
	const { partners } = useLoaderData<typeof loader>();
	return (
		<div className="overflow-hidden">
			<div className="scrollbars px-2">
				<div className="pt-16"></div>
				<div className="grid py-4 sm:grid-cols-2 lg:grid-cols-3">
					{partners?.map((partner) => (
						<Link
							to={`/dashboard/admin/partners/${partner.slug}`}
							className="group flex items-center justify-between  rounded-xl px-6 py-4 font-semibold tracking-tight transition hover:bg-gray-900 hover:text-gray-100 focus-within:ring-2 ring-primary"
							key={partner.id}
							tabIndex={-1}
						>
							<div className="flex items-center gap-4">
								<AvatarPartner partner={partner} size="lg" />
								<div className="text-2xl leading-none outline-none">
									{partner.title}
								</div>
							</div>
							<Form>
								<input
									name="id"
									value={partner.id}
									type="hidden"
								/>
								<button className="opacity-0 group-hover:opacity-100">
									<Trash2Icon className="h-6 w-6 opacity-75" />
								</button>
							</Form>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
