/* eslint-disable jsx-a11y/no-autofocus */
import { Form, Link, useLoaderData, useMatches } from "@remix-run/react";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@vercel/remix";
import invariant from "tiny-invariant";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Avatar } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

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
    users_ids: String(formData.getAll("users_ids")).split(","),
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
      <div className="scrollbars">
        <div className="px-4 md:px-8">
          <div
            className="flex items-center gap-2 rounded py-4 font-extrabold tracking-tighter"
            key={partner.id}
          >
            <Avatar
              item={{
                short: partner.short,
                bg: partner.bg,
                fg: partner.fg,
              }}
              size="lg"
            />
            <Link to={`/dashboard/${partner.slug}`} className="text-2xl">
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
              <div className="flex items-center gap-4">
                {people.map((person) => (
                  <label
                    key={person.id}
                    className={`relative mb-2 flex items-center`}
                  >
                    <input
                      type="checkbox"
                      value={person.user_id}
                      name="users_ids"
                      className={`peer absolute opacity-0`}
                      defaultChecked={
                        partner.users_ids?.find(
                          (user_id) => person.user_id === user_id,
                        )
                          ? true
                          : false
                      }
                    />
                    <div
                      className={`rounded-full ring-ring ring-offset-2 ring-offset-background transition peer-checked:ring-2`}
                    >
                      <Avatar
                        item={{
                          image: person.image,
                          short: person.initials!,
                        }}
                        size="lg"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="gap-2 md:flex">
              <div className="mb-4 w-full">
                <Label className="mb-2 block">Background Color</Label>
                <Input defaultValue={partner.bg} name="bg" type="color" />
              </div>
              <div className="mb-4 w-full">
                <Label className="mb-2 block">Foreground Color</Label>
                <Input defaultValue={partner.fg} name="fg" type="color" />
              </div>
            </div>
            <div className="mb-4 text-right">
              <Button type="submit">Atualizar</Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
