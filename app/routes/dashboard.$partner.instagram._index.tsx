import { redirect, useLoaderData, useMatches } from "@remix-run/react";
import { type LoaderFunctionArgs } from "@vercel/remix";
import { BlockOfActions, GridOfActions } from "~/components/structure/Action";
import { getInstagramActions } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const { supabase } = createClient(request);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	const { data: person } = await supabase
		.from("people")
		.select("*")
		.eq("user_id", user.id)
		.single();

	const { data: partner } = await supabase
		.from("partners")
		.select("*")
		.eq("slug", params["partner"] as string)
		.single();

	const { data: actions } = await supabase
		.from("actions")
		.select("*")
		.contains("responsibles", person?.admin ? [] : [user.id]);

	return { actions, partner };
};

export default function Actions() {
	const matches = useMatches();
	const { actions } = useLoaderData<typeof loader>() || {};
	const { categories, priorities, states } = matches[1]
		.data as DashboardDataType;

	const instagramActions = getInstagramActions({ actions });

	return (
		<div className="md:flex gap-8 overflow-hidden">
			<div className="mt-2 md:w-1/2 xl:w-full">
				<div className="mb-8">
					<div className="flex justify-between py-2">
						<h2 className="mb-2 text-xl font-medium">
							Ações para o Instagram ({instagramActions?.length})
						</h2>
					</div>

					<BlockOfActions actions={instagramActions} />
				</div>
			</div>
			<div className="mt-4 md:w-1/2 xl:max-w-xl">
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
