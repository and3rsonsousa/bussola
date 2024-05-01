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
import { AvatarPartner } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";
import { Button } from "~/components/ui/button";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const { supabase, headers } = await createClient(request);

	const slug = params["slug"];

	invariant(slug);

	const { data: partner } = await supabase
		.from("partners")
		.select("*")
		.eq("slug", slug)
		.single();

	if (!partner) throw redirect("/dashboard/admin/partners");

	return json({ partner, headers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const { supabase } = createClient(request);

	const formData = await request.formData();

	const id = String(formData.get("id"));

	const data = {
		title: String(formData.get("title")),
		short: String(formData.get("short")),
		slug: String(formData.get("slug")),
		bg: String(formData.get("bg")),
		fg: String(formData.get("fg")),
		user_ids: String(formData.getAll("user_id")).split(","),
	};

	const { error } = await supabase.from("partners").update(data).eq("id", id);

	if (error) {
		console.log(error);
	} else {
		return redirect(`/dashboard/admin/partners`);
	}

	return { ok: true };
};

export default function AdminPartners() {
	const matches = useMatches();

	const { partner } = useLoaderData<typeof loader>();
	const { people } = matches[1].data as DashboardDataType;

	return (
		<div className="overflow-hidden">
			<ScrollArea className="h-full w-full">
				<div className="pt-16"></div>
				<div className="px-4 md:px-8">
					<div
						className="flex items-center gap-2 rounded py-4 font-medium "
						key={partner.id}
					>
						<AvatarPartner partner={partner} size="lg" />
						<Link
							to={`/dashboard/${partner.slug}`}
							className="text-2xl"
						>
							{partner.title}
						</Link>
					</div>
					<Form className="mx-auto max-w-md" method="post">
						<input type="hidden" value={partner.id} name="id" />
						<div className="mb-4">
							<Label className="mb-2 block">Nome</Label>
							<Input
								defaultValue={partner.title}
								name="title"
								type="text"
								tabIndex={0}
								autoFocus
							/>
						</div>
						<div className="mb-4">
							<Label className="mb-2 block">Slug</Label>
							<Input defaultValue={partner.slug} name="slug" />
						</div>
						<div className="mb-4">
							<Label className="mb-2 block">Short</Label>
							<Input defaultValue={partner.short} name="short" />
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
											partner.user_ids.indexOf(
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
								defaultValue={partner.bg}
								name="bg"
								type="color"
							/>
						</div>
						<div className="mb-4">
							<Label className="mb-2 block">
								Foreground Color
							</Label>
							<Input
								defaultValue={partner.fg}
								name="fg"
								type="color"
							/>
						</div>
						<div className="mb-4 text-right">
							<Button type="submit">Adicionar</Button>
						</div>
					</Form>

					<pre>{JSON.stringify(partner, undefined, 2)}</pre>
				</div>
			</ScrollArea>
		</div>
	);
}
