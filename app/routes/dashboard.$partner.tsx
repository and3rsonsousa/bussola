import {
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
	redirect,
} from "@vercel/remix";
import { Link, Outlet, useLoaderData, useMatches } from "@remix-run/react";
import { CalendarDaysIcon, Grid3X3Icon, ListTodoIcon } from "lucide-react";
import Progress from "~/components/structure/Progress";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AvatarPartner } from "~/lib/helpers";

import { createClient } from "~/lib/supabase";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const { headers, supabase } = createClient(request);

	const { data: partner } = await supabase
		.from("partners")
		.select("*")
		.eq("slug", params["partner"] as string)
		.single();

	if (partner) {
		return json(
			{ partner, instagram: request.url.indexOf("/instagram") },
			{ headers }
		);
	} else {
		return redirect("/", 400);
	}
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{
			title: data?.partner?.title,
		},
	];
};

export default function Partner() {
	const { partner } = useLoaderData<typeof loader>();
	const matches = useMatches();

	const { states } = matches[1].data as DashboardDataType;
	const { actions } = matches[3].data as { actions: Action[] | null };

	return (
		<div className="flex flex-col overflow-y-hidden">
			<ScrollArea className="px-4 pb-4 md:px-8" id="scrollarea">
				<div className="pt-16"></div>
				<div className="flex justify-between pt-2">
					<Link
						to={`/dashboard/${partner.slug}`}
						className="flex items-center gap-4 "
					>
						<AvatarPartner partner={partner} size="lg" />
						<div className="text-2xl font-extrabold text-gray-100 tracking-tight">
							<div>{partner?.title}</div>
							<Progress
								total={actions?.length || 1}
								values={states.map((state) => ({
									id: state.id,
									title: state.title,
									value: actions?.filter(
										(action) => action.state_id === state.id
									).length,
									color: `bg-${state.slug}`,
								}))}
							/>
						</div>
					</Link>
					<div className="flex items-center gap-2">
						<Button
							asChild
							size="sm"
							variant="ghost"
							className="flex gap-2 font-medium"
						>
							<Link to={`/dashboard/${partner?.slug}/`}>
								<CalendarDaysIcon className="h-4 w-4" />
								<div className="hidden md:block">
									Calendário
								</div>
							</Link>
						</Button>
						<Button
							asChild
							size="sm"
							variant="ghost"
							className="flex gap-2 font-medium"
						>
							<Link to={`/dashboard/${partner?.slug}/instagram`}>
								<Grid3X3Icon className="h-4 w-4" />
								<div className="hidden md:block">Instagram</div>
							</Link>
						</Button>
						<Button
							asChild
							size="sm"
							variant="ghost"
							className="flex gap-2 font-medium"
						>
							<Link to={`/dashboard/${partner?.slug}/actions`}>
								<ListTodoIcon className="h-4 w-4" />
								<div className="hidden md:block">Ações</div>
							</Link>
						</Button>
					</div>
				</div>

				<Outlet />
			</ScrollArea>
		</div>
	);
}
