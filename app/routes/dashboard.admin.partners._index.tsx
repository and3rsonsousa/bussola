import { LoaderFunctionArgs, json } from "@vercel/remix";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { Trash2Icon } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AvatarPartner } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const supabase = await createClient(request);

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
			<ScrollArea className="h-full w-full px-4 md:px-8">
				<div className="pt-16"></div>
				<div className="grid py-4 sm:grid-cols-2 lg:grid-cols-3">
					{partners?.map((partner) => (
						<div
							className="group flex items-center justify-between  rounded-xl px-6 py-4 font-medium   hover:bg-gray-900"
							key={partner.id}
						>
							<div className="flex items-center gap-2">
								<AvatarPartner partner={partner} size="lg" />
								<Link
									to={`/dashboard/admin/partners/${partner.slug}`}
									className="text-2xl"
								>
									{partner.title}
								</Link>
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
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
