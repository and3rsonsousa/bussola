import { Form, useMatches } from "@remix-run/react";
import {
  type ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@vercel/remix";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SOW } from "~/lib/constants";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return {};
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase } = createClient(request);

  const formData = await request.formData();

  const data = {
    title: String(formData.get("title")),
    short: String(formData.get("short")),
    slug: String(formData.get("slug")),
    colors: [String(formData.get("bg")), String(formData.get("fg"))],
    sow: String(formData.get("sow")),
    context: String(formData.get("context")),
    users_ids: String(formData.getAll("user_id")).split(","),
    archived: false,
  } as Partner;

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

  useEffect(() => {
    setSlug(() => name.replace(/ /g, "").toLowerCase());
  }, [name]);

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
                }}
                autoFocus
              />
            </div>
            <div className="mb-4 flex w-full gap-4">
              <div className="w-full">
                <Label className="mb-2 block">Slug</Label>
                <Input
                  name="slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                />
              </div>
              <div className="w-full">
                <Label className="mb-2 block">Short</Label>
                <Input name="short" />
              </div>
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
            <div className="mb-4 flex w-full gap-4">
              <div className="w-1/4">
                <Label className="mb-2 block">BG </Label>
                <Input defaultValue={"#ffffff"} name="bg" type="color" />
              </div>
              <div className="w-1/4">
                <Label className="mb-2 block">FG</Label>
                <Input defaultValue={"#000000"} name="fg" type="color" />
              </div>
              <div className="w-full">
                <Label className="mb-2 block">Serviço Contratado</Label>
                <Select name="sow">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SOW.marketing}>
                      Consultoria de Marketing
                    </SelectItem>
                    <SelectItem value={SOW.socialmedia}>
                      Social Media
                    </SelectItem>
                    <SelectItem value={SOW.demand}>Demanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
