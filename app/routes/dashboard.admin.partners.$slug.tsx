/* eslint-disable jsx-a11y/no-autofocus */
import { Form, Link, useLoaderData, useMatches } from "@remix-run/react";
// @ts-ignore
import {
  json,
  MetaFunction,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@vercel/remix";
// @ts-ignore
import Color from "color";
import { Enums } from "database";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Textarea } from "~/components/ui/textarea";
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.partner?.title.concat(" - ʙússoʟa") },
    {
      name: "description",
      content:
        "Aplicativo de Gestão de Projetos Criado e Mantido pela Agência Canivete. ",
    },
  ];
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase } = createClient(request);

  const formData = await request.formData();

  const id = String(formData.get("id"));

  const data = {
    title: String(formData.get("title")),
    short: String(formData.get("short")),
    slug: String(formData.get("slug")),
    colors: String(formData.getAll("colors")).split(","),
    context: String(formData.get("context")),
    sow: formData.get("sow") as "marketing" | "socialmedia" | "demand",
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
  const { people } = matches[1].data as DashboardRootType;

  const [colors, setColors] = useState(partner.colors);

  return (
    <div className="overflow-hidden">
      <div className="scrollbars">
        <div className="px-4 md:px-8">
          <div
            className="flex items-center gap-2 rounded py-4 font-bold tracking-tighter"
            key={partner.slug}
          >
            <Avatar
              item={{
                short: partner.short,
                bg: partner.colors[0],
                fg: partner.colors[1],
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
            <div className="gap-2 md:flex">
              <div className="mb-4 w-full">
                <Label className="mb-2 block">Slug</Label>
                <Input defaultValue={partner.slug} name="slug" />
              </div>
              <div className="mb-4 w-full">
                <Label className="mb-2 block">Short</Label>
                <Input defaultValue={partner.short} name="short" />
              </div>
            </div>
            <div className="mb-4">
              <Label className="mb-2 block">Contexto</Label>
              <Textarea
                name="context"
                defaultValue={partner.context || ""}
                // @ts-ignore
                style={{ fieldSizing: "content" }}
              />
            </div>
            <div className="mb-8">
              <Label className="mb-2 block">Serviço Contratado</Label>
              <RadioGroup name="sow" defaultValue={partner.sow.toString()}>
                {[
                  { value: "marketing", title: "Consultoria de Marketing 360" },
                  { value: "socialmedia", title: "Gestão de Redes Sociais" },
                  { value: "demand", title: "Serviços avulsos" },
                ].map((p) => (
                  <div className="flex items-center gap-2" key={p.value}>
                    <RadioGroupItem value={p.value} id={`radio_${p.value}`} />
                    <Label htmlFor={`radio_${p.value}`}>{p.title}</Label>
                  </div>
                ))}
              </RadioGroup>
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
                      className={`rounded-full ring-ring ring-offset-2 ring-offset-background peer-checked:ring-2`}
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
                <Label className="mb-2 block">Cores</Label>
                <div className="flex flex-wrap gap-4">
                  {colors.map((color, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        className="h-16 w-20"
                        defaultValue={color}
                        name="colors"
                        type="color"
                      />
                      <Button
                        onClick={(event) => {
                          event.preventDefault();
                          setColors(colors.filter((c) => c !== color));
                        }}
                        variant={"ghost"}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant={"secondary"}
                    onClick={(event) => {
                      event.preventDefault();
                      setColors([
                        ...colors,
                        Color(colors[0])
                          .rotate(Math.random() * 220 + 30)
                          .hex(),
                      ]);
                    }}
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </div>
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
