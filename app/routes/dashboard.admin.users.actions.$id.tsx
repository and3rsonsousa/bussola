/* eslint-disable jsx-a11y/no-autofocus */

import { Link, useLoaderData } from "@remix-run/react";
import {
  MetaFunction,
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@vercel/remix";
import { CheckCircleIcon } from "lucide-react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { ListOfActions } from "~/components/structure/Action";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { supabase, headers } = await createClient(request);

  const id = params["id"];

  invariant(id);

  const [{ data: person }, { data: actions }] = await Promise.all([
    supabase.from("people").select("*").eq("user_id", id).single(),
    supabase
      .from("actions")
      .select("*")
      .is("archived", false)
      .contains("responsibles", [id])
      .order("date", { ascending: true }),
  ]);

  if (!person) throw redirect("/dashboard/admin/users");

  return json({ person, actions, headers });
};

export const meta: MetaFunction = () => {
  return [
    { title: "ʙússoʟa - Domine, Crie e Conquiste." },
    {
      name: "description",
      content:
        "Aplicativo de Gestão de Projetos Criado e Mantido pela Agência Canivete. ",
    },
  ];
};

export default function AdminPartners() {
  const { person, actions } = useLoaderData<typeof loader>();
  const [viewFinished, setViewFinished] = useState(false);

  return (
    <div className="overflow-hidden">
      <div className="scrollbars">
        <div className="px-4 md:px-8">
          <h2 className="py-4 text-3xl font-bold tracking-tighter">
            <Link to={"/dashboard/admin/users"}>Usuários</Link>
          </h2>
          <div className="mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 py-4" key={person.id}>
                <Avatar
                  item={{
                    image: person.image,
                    short: person.initials!,
                  }}
                  size="lg"
                />
                <div className="text-2xl font-bold tracking-tighter">
                  Ações de {`${person.name} ${person.surname}`}
                </div>
              </div>
              <div>
                <Button
                  variant={viewFinished ? "secondary" : "ghost"}
                  onClick={() => {
                    setViewFinished(!viewFinished);
                  }}
                  title="Filtre entre todas as ações ou apenas as que não foram finalizadas."
                >
                  <span className="hidden lg:block">
                    Mostrar ações concluídas
                  </span>
                  <span className="lg:hidden">
                    <CheckCircleIcon className="size-4" />
                  </span>
                </Button>
              </div>
            </div>

            <ListOfActions
              actions={actions?.filter((action) =>
                viewFinished ? true : action.state !== "finished",
              )}
              long
              orderBy="time"
              showCategory
              showPartner
            />
          </div>
        </div>
      </div>
    </div>
  );
}
