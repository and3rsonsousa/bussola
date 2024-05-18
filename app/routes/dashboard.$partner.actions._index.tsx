import { redirect, useLoaderData } from "@remix-run/react";
import { type LoaderFunctionArgs } from "@vercel/remix";
import { ListOfActions } from "~/components/structure/Action";
import { getDelayedActions, sortActions } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const { supabase } = createClient(request);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	const { data: partner } = await supabase
		.from("partners")
		.select("*")
		.eq("slug", params["partner"] as string)
		.single();

	const { data: actions } = await supabase
		.from("actions")
		.select("*")
		.contains("responsibles", [user.id]);

	return { actions, partner };
};

export default function Actions() {
	const { actions } = useLoaderData<typeof loader>() || {};

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
						actions={lateActions}
						showCategory={true}
						date={{ dateFormat: 1 }}
					/>
				</div>
			) : null}

			<div className="flex justify-between py-2">
				<h2 className="mb-2 text-xl font-medium">
					Todas as Ações ({actions?.length})
				</h2>
			</div>
			<ListOfActions
				actions={sortActions(actions)}
				showCategory={true}
				date={{ dateFormat: 1 }}
			/>
		</div>
	);
}
