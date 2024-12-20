import { Link, useLoaderData } from "@remix-run/react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/server-runtime";
import { MetaFunction } from "@vercel/remix";
import { format } from "date-fns";
import { ListOfActions } from "~/components/structure/Action";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { supabase } = createClient(request);

  const partner_slug = params["partner"];

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

  const [{ data: actions }, { data: actionsChart }, { data: partner }] =
    await Promise.all([
      supabase
        .from("actions")
        .select("*")
        .is("archived", true)
        .like("partner", partner_slug || "%")
        .contains("responsibles", person?.admin ? [] : [user.id])
        .neq("state", "finished")
        .lte("date", format(new Date(), "yyyy-MM-dd HH:mm:ss"))
        .returns<Action[]>(),

      supabase
        .from("actions")
        .select("state, date")
        .is("archived", false)
        .like("partner", partner_slug || "%")
        .contains("responsibles", person?.admin ? [] : [user.id])
        .neq("state", "finished")
        .lte("date", format(new Date(), "yyyy-MM-dd HH:mm:ss"))
        .returns<{ state: string; date: string }[]>(),
      supabase
        .from("partners")
        .select()
        .eq("slug", params["partner"]!)
        .single(),
    ]);

  return { actions, actionsChart, partner };
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

export default function LatePage() {
  const { actions } = useLoaderData<typeof loader>();
  return (
    <div className="scrollbars">
      <div className="px-4 md:px-8">
        <h2 className="py-4 text-3xl font-bold tracking-tighter">
          <Link to={"/dashboard/admin/users"}>Ações em atraso</Link>
        </h2>
        <div className="mx-auto pb-32">
          <ListOfActions
            actions={actions}
            date={{ dateFormat: 4, timeFormat: 1 }}
            long
            orderBy="time"
            showCategory
          />
        </div>
      </div>
    </div>
  );
}
