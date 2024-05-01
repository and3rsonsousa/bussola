import { useLoaderData, useMatches } from "@remix-run/react";
import { type LoaderFunctionArgs } from "@vercel/remix";
import { BlockOfActions, GridOfActions } from "~/components/structure/Action";
import { getInstagramActions } from "~/lib/helpers";
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

	const instagramActions = getInstagramActions({ actions });

	return (
		<div className="md:flex gap-8 overflow-hidden">
			<div className="mt-2 md:w-1/2">
				<div className="mb-8">
					<div className="flex justify-between py-2">
						<h2 className="mb-2 text-xl font-medium">
							Ações para o Instagram ({instagramActions?.length})
						</h2>
					</div>

					<BlockOfActions
						categories={categories}
						priorities={priorities}
						states={states}
						actions={instagramActions}
						partners={partners}
					/>
					{/* <ListOfActions
            categories={categories}
            priorities={priorities}
            states={states}
            actions={instagramActions}
            showCategory
          /> */}
				</div>
			</div>
			<div className="mt-4 md:w-1/2">
				<GridOfActions
					categories={categories}
					priorities={priorities}
					states={states}
					actions={instagramActions}
				/>
			</div>
		</div>
	);
}
