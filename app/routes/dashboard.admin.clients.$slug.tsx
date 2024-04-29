/* eslint-disable jsx-a11y/no-autofocus */
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
	redirect,
} from "@vercel/remix";
import { Form, Link, useLoaderData, useMatches } from "@remix-run/react";
import invariant from "tiny-invariant";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AvatarClient } from "~/lib/helpers";
import { SupabaseServerClient } from "~/lib/supabase";
import { Button } from "~/components/ui/button";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const { supabase, headers } = await SupabaseServerClient({ request });

	const slug = params["slug"];

	invariant(slug);

	const { data: client } = await supabase
		.from("clients")
		.select("*")
		.eq("slug", slug)
		.single();

	if (!client) throw redirect("/dashboard/admin/clients");

	return json({ client, headers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const { supabase } = SupabaseServerClient({ request });

	const formData = await request.formData();

	const id = String(formData.get("id"));

	const data = {
		title: String(formData.get("title")),
		short: String(formData.get("short")),
		slug: String(formData.get("slug")),
		bgColor: String(formData.get("bgColor")),
		fgColor: String(formData.get("fgColor")),
		user_ids: String(formData.getAll("user_id")).split(","),
	};

	const { error } = await supabase.from("clients").update(data).eq("id", id);

	if (error) {
		console.log(error);
	} else {
		return redirect(`/dashboard/admin/clients`);
	}

	return { ok: true };
};

export default function AdminClients() {
	const matches = useMatches();

	const { client } = useLoaderData<typeof loader>();
	const { people } = matches[1].data as DashboardDataType;

	return (
		<div className="overflow-hidden">
			<ScrollArea className="h-full w-full">
				<div className="pt-16"></div>
				<div className="px-4 md:px-8">
					<div
						className="flex items-center gap-2 rounded py-4 font-medium "
						key={client.id}
					>
						<AvatarClient client={client} size="lg" />
						<Link
							to={`/dashboard/${client.slug}`}
							className="text-2xl"
						>
							{client.title}
						</Link>
					</div>
					<Form className="mx-auto max-w-md" method="post">
						<input type="hidden" value={client.id} name="id" />
						<div className="mb-4">
							<Label className="mb-2 block">Nome</Label>
							<Input
								defaultValue={client.title}
								name="title"
								type="text"
								tabIndex={0}
								autoFocus
							/>
						</div>
						<div className="mb-4">
							<Label className="mb-2 block">Slug</Label>
							<Input defaultValue={client.slug} name="slug" />
						</div>
						<div className="mb-4">
							<Label className="mb-2 block">Short</Label>
							<Input defaultValue={client.short} name="short" />
						</div>
						<div className="mb-4">
							<Label className="mb-2 block">Usuários</Label>

							{people.map((person) => (
								<div
									key={person.id}
									className="mb-2 flex gap-4"
								>
									<Checkbox
										value={person.user_id}
										name="user_id"
										defaultChecked={
											client.user_ids.indexOf(
												person.user_id
											) >= 0
										}
									>
										{person.name}
									</Checkbox>
									<Label>{person.name}</Label>
								</div>
							))}
						</div>
						<div className="mb-4">
							<Label className="mb-2 block">
								Background Color
							</Label>
							<Input
								defaultValue={client.bgColor}
								name="bgColor"
								type="color"
							/>
						</div>
						<div className="mb-4">
							<Label className="mb-2 block">
								Foreground Color
							</Label>
							<Input
								defaultValue={client.fgColor}
								name="fgColor"
								type="color"
							/>
						</div>
						<div className="mb-4 text-right">
							<Button type="submit">Adicionar</Button>
						</div>
					</Form>

					<pre>{JSON.stringify(client, undefined, 2)}</pre>
				</div>
			</ScrollArea>
		</div>
	);
}
