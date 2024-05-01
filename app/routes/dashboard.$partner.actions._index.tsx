import { LoaderFunctionArgs } from "@vercel/remix";
import { useLoaderData, useMatches } from "@remix-run/react";
import { ListOfActions } from "~/components/structure/Action";
import { getDelayedActions, sortActions } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const { supabase } = createClient(request);

	const { data: partner } = await supabase
		.from("partners")
		.select("*")
		.eq("slug", params["partner"] as string)
		.single();

	const { data: actions } = await supabase
		.from("actions")
		.select("*")
		.eq("partner_id", partner!.id);

	return { actions, partner };
};

export default function Actions() {
	const matches = useMatches();
	const { actions } = useLoaderData<typeof loader>() || {};
	const { categories, priorities, states, partners } = matches[1]
		.data as DashboardDataType;

	const lateActions = getDelayedActions({ actions: actions as Action[] });

	return (
		<div className="overflow-hidden">
			{lateActions?.length ? (
				<div className="mb-4">
					<div className="flex justify-between py-8">
						<h2 className="text-3xl font-medium tracking-tight">
							Atrasados ({lateActions?.length})
						</h2>
					</div>

					<ListOfActions
						categories={categories}
						priorities={priorities}
						states={states}
						actions={lateActions}
						showCategory={true}
						date={{ dateFormat: 1 }}
						partners={partners}
					/>
				</div>
			) : null}

			<div className="flex justify-between py-2">
				<h2 className="mb-2 text-xl font-medium">
					Todas as Ações ({actions?.length})
				</h2>
			</div>
			<ListOfActions
				categories={categories}
				priorities={priorities}
				states={states}
				actions={sortActions(actions)}
				showCategory={true}
				date={{ dateFormat: 1 }}
				partners={partners}
			/>
		</div>
	);
}
