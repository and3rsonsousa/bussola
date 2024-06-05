import { useLoaderData } from "@remix-run/react";
import {
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { act, useEffect, useLayoutEffect } from "react";
import { CATEGORIES } from "~/lib/constants";
import { createClient } from "~/lib/supabase";

// import "./app/globals.css";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { headers, supabase } = createClient(request);

  const searchParams = new URL(request.url).searchParams;
  const range = searchParams.get("range")?.split("---");
  const id = searchParams.get("partner_id");

  if (!(range && id)) {
    return redirect("/dashboard");
  }

  const [{ data: actions }, { data: partner }] = await Promise.all([
    supabase
      .from("actions")
      .select("*")
      .match({ partner_id: id })
      .in("category_id", [CATEGORIES.post, CATEGORIES.video])
      .gte("date", range[0])
      .lte("date", range[1]),
    supabase.from("partners").select().match({ id }).single(),
  ]);

  return json({ actions, partner }, { headers });
};

export default function ReportPage() {
  const { actions, partner } = useLoaderData<typeof loader>();

  // useLayoutEffect(() => {
  //   document.body.classList.remove("dark");
  // }, []);

  return (
    <div className="p-4">
      <h5 className="mb-4 text-xs font-bold uppercase tracking-wider ">
        AGÊNCIA CNVT ®
      </h5>
      <h1 className="text-5xl font-bold tracking-tighter text-secondary-foreground">
        {partner?.title}
      </h1>
      <h5 className="text-sm font-bold uppercase tracking-wider">
        Aprovação de Conteúdo para o período
      </h5>
      <div className="mt-8 grid grid-cols-2 gap-2">
        {actions?.map((action) => (
          <div key={action.id} className="rounded-sm bg-secondary p-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-black uppercase tracking-wider">
                {action.category_id === CATEGORIES.post
                  ? "Imagem Estática"
                  : "Reels"}
              </div>
              <div>
                {format(action.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
            <div className="mb-2 text-2xl font-bold leading-none tracking-tighter">
              {action.title}
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: action.description || "" }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
}
