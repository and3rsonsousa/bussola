/* eslint-disable jsx-a11y/no-autofocus */
import { Link, useLoaderData, useMatches, useSubmit } from "@remix-run/react";
import { MetaFunction, redirect, type LoaderFunctionArgs } from "@vercel/remix";
import { useState } from "react";
import { flushSync } from "react-dom";
import invariant from "tiny-invariant";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { INTENTS } from "~/lib/constants";
import { Avatar } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { supabase, headers } = await createClient(request);

  const id = params["id"];

  invariant(id);

  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", id)
    .single();

  if (!person) throw redirect("/dashboard/admin/users");

  return { person };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: `${data?.person.name} - BÚSSOLA`,
    },
  ];
};

export default function AdminUsersId() {
  const matches = useMatches();

  const { person } = useLoaderData<typeof loader>();
  const { partners } = matches[1].data as DashboardRootType;

  const [isAdmin, setIsAdmin] = useState(person.admin);

  const submit = useSubmit();

  function handleActions(data: {
    [key: string]: string | number | null | string[] | boolean;
  }) {
    submit(
      { ...data },
      {
        action: "/handle-actions",
        method: "post",
        navigate: false,
      },
    );
  }

  return (
    <div className="scrollbars px-4 md:px-8">
      <h2 className="py-4 text-3xl font-bold tracking-tighter">
        <Link to={"/dashboard/admin/users"}>Usuários</Link>
      </h2>
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2 py-4" key={person.id}>
          <Avatar
            item={{
              image: person.image,
              short: person.initials!,
            }}
            size="lg"
          />
          <div className="text-2xl font-semibold tracking-tighter">
            {`${person.name} ${person.surname}`}
          </div>
        </div>
        <input type="hidden" value={person.id} name="id" />
        <div className="mb-4 gap-2 md:flex">
          <div className="w-full">
            <Label className="mb-2 block">Nome</Label>
            <Input
              defaultValue={person.name}
              name="name"
              type="text"
              tabIndex={0}
              autoFocus
              onBlur={(e) => {
                if (person.name !== e.currentTarget.value)
                  handleActions({
                    id: person.id,
                    intent: INTENTS.updatePerson,
                    name: String(e.currentTarget.value),
                  });
              }}
            />
          </div>
          <div className="w-full">
            <Label className="mb-2 block">Sobrenome</Label>
            <Input
              defaultValue={person.surname || ""}
              name="surname"
              type="text"
              tabIndex={0}
              autoFocus
              onBlur={(e) => {
                if (person.surname !== e.currentTarget.value)
                  handleActions({
                    id: person.id,
                    intent: INTENTS.updatePerson,
                    surname: String(e.currentTarget.value),
                  });
              }}
            />
          </div>
        </div>
        <div className="mb-4 flex gap-2">
          <div className="w-full">
            <Label className="mb-2 block">Iniciais</Label>
            <Input
              maxLength={2}
              defaultValue={person.initials || ""}
              name="initials"
              onBlur={(e) => {
                if (person.initials !== e.currentTarget.value)
                  handleActions({
                    id: person.id,
                    intent: INTENTS.updatePerson,
                    initials: String(e.currentTarget.value),
                  });
              }}
            />
          </div>
          <div className="w-full">
            <Label className="mb-2 block">Abreviação</Label>
            <Input
              maxLength={6}
              defaultValue={person.short || ""}
              name="short"
              onBlur={(e) => {
                if (person.short !== e.currentTarget.value)
                  handleActions({
                    id: person.id,
                    intent: INTENTS.updatePerson,
                    short: String(e.currentTarget.value),
                  });
              }}
            />
          </div>
        </div>
        <div className="mb-4">
          <Label className="mb-2 block">É Admin?</Label>
          <Switch
            checked={isAdmin}
            onCheckedChange={(e) => {
              flushSync(() => {
                setIsAdmin(e);
              });

              handleActions({
                id: person.id,
                intent: INTENTS.updatePerson,
                admin: e,
              });
            }}
            name="admin"
          />
        </div>
        <div className="mb-4">
          <Label className="mb-1 block">Parceiros</Label>

          <div className="grid items-center gap-2 md:grid-cols-2">
            {partners.map((partner) => (
              <label
                key={partner.slug}
                className={`relative mb-2 flex cursor-pointer items-center gap-4`}
              >
                <input
                  type="checkbox"
                  name={"partner_id"}
                  className={`peer absolute opacity-0`}
                  checked={
                    partner.users_ids
                      ? partner.users_ids.indexOf(person.user_id) >= 0
                      : false
                  }
                  onChange={(e) => {
                    let users_ids = partner.users_ids;
                    if (!e.target.checked) {
                      users_ids = partner.users_ids.filter(
                        (user_id) => user_id !== person.user_id,
                      );
                    } else {
                      users_ids = [...users_ids, person.user_id];
                    }
                    handleActions({
                      id: partner.id,
                      intent: INTENTS.updatePartner,
                      users_ids,
                    });
                  }}
                />
                <div
                  className={`ring-ring ring-offset-background rounded-full ring-offset-2 peer-checked:ring-2`}
                >
                  <Avatar
                    item={{
                      short: partner.short,
                      bg: partner.colors[0],
                      fg: partner.colors[1],
                    }}
                    size="md"
                  />
                </div>

                <div className="text-muted peer-checked:text-foreground text-sm font-medium">
                  {partner.title}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
