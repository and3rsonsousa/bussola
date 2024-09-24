import { Form, useMatches } from "@remix-run/react";
import { type ActionFunctionArgs, redirect } from "@vercel/remix";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase } = createClient(request);

  const formData = await request.formData();

  const data = {
    title: String(formData.get("title")),
    short: String(formData.get("short")),
    slug: String(formData.get("slug")),
    colors: String(formData.get("colors")).split(","),
    sow: String(formData.get("sow")),
    context: String(formData.get("context")),
    users_ids: String(formData.getAll("user_id")).split(","),
  };

  const { data: partner, error } = await supabase
    .from("partners")
    .insert(data)
    .select()
    .single();

  if (partner) {
    return redirect(`/dashboard/${partner.slug}`);
  } else {
    console.log(error);
  }

  return { ok: true };
};

export default function NewPartners() {
  const matches = useMatches();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const { people } = matches[1].data as DashboardRootType;

  return (
    <div className="overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div className="px-4 md:px-8">
          <h1 className="gap-2 rounded py-4 text-2xl font-medium">
            Novo Parceiro
          </h1>
          <Form className="mx-auto max-w-md" method="post">
            <div className="mb-4">
              <Label className="mb-2 block">Nome</Label>
              <Input
                name="title"
                type="text"
                tabIndex={0}
                value={name}
                onChange={(event) => {
                  setName(() => event.target.value);
                  setSlug(() => name.replace(/ /g, "").toLowerCase());
                }}
                autoFocus
              />
            </div>
            <div className="mb-4">
              <Label className="mb-2 block">Slug</Label>
              <Input
                name="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
            </div>
            <div className="mb-4">
              <Label className="mb-2 block">Short</Label>
              <Input name="short" />
            </div>
            <div className="mb-4">
              <Label className="mb-2 block">Usuários</Label>

              {people.map((person) => (
                <div key={person.id} className="mb-2 flex gap-4">
                  <Checkbox value={person.user_id} name="user_id">
                    {person.name}
                  </Checkbox>
                  <Label>{person.name}</Label>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <Label className="mb-2 block">Background Color</Label>
              <Input defaultValue={"#ffffff"} name="bg" type="color" />
            </div>
            <div className="mb-4">
              <Label className="mb-2 block">Foreground Color</Label>
              <Input defaultValue={"#000000"} name="fg" type="color" />
            </div>
            <div className="mb-4 text-right">
              <Button type="submit">Adicionar</Button>
            </div>
          </Form>
        </div>
      </ScrollArea>
    </div>
  );
}
