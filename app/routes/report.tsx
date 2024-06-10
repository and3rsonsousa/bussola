import { MetaFunction, useLoaderData } from "@remix-run/react";
import {
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { format, isSameMonth, isSameYear } from "date-fns";
import { ptBR } from "date-fns/locale";
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

  const [{ data: actions }, { data: partner }, { data: categories }] =
    await Promise.all([
      supabase
        .from("actions")
        .select("*")
        .match({ partner_id: id })
        .in("category_id", [
          CATEGORIES.post,
          CATEGORIES.video,
          CATEGORIES.carousel,
          CATEGORIES.stories,
        ])
        .gte("date", range[0])
        .lte("date", range[1])
        .order("date", { ascending: true }),
      supabase.from("partners").select().match({ id }).single(),
      supabase.from("categories").select(),
    ]);

  return json({ actions, partner, categories, range }, { headers });
};

export const meta: MetaFunction = ({ data }) => {
  const partner = (data as { partner: Partner }).partner;

  return [{ title: "Relatório de " + partner.title }];
};

export default function ReportPage() {
  const { actions, partner, categories, range } =
    useLoaderData<typeof loader>();

  return (
    <div className="min-h-[100vh] bg-slate-100 p-4 text-center text-gray-500 antialiased">
      <h5 className="mb-4 text-xs font-bold uppercase tracking-wider ">
        AGÊNCIA CNVT ®
      </h5>
      <h1 className="mb-2 text-5xl font-extrabold tracking-tighter text-gray-950">
        {partner?.title}
      </h1>

      <h5 className="text-lg font-medium leading-none">
        <div style={{ fontStretch: "75%" }}>
          Aprovação de Conteúdo para o período de
        </div>
        <div className="text-2xl font-bold tracking-tighter text-gray-950">
          {`${format(range[0], "d".concat(!isSameMonth(range[0], range[1]) ? " 'de' MMMM".concat(!isSameYear(range[0], range[1]) ? " 'de' yyyy" : "") : ""), { locale: ptBR })} a
        ${format(range[1], "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
        </div>
      </h5>
      <div className="mx-auto mt-8 flex max-w-lg flex-col gap-2 text-left">
        {actions?.map((action) => (
          <div key={action.id} className="rounded-sm bg-white p-8">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-black/10 pb-4 text-lg">
              <div className="first-letter:capitalize">
                {format(action.date, "E, d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </div>
              <div className="text-sm font-black uppercase tracking-wider">
                {
                  categories?.filter(
                    (category) => category.id === action.category_id,
                  )[0].title
                }
              </div>
            </div>
            <div className="mb-4 text-2xl font-bold leading-none tracking-tighter text-gray-950">
              {action.title}
            </div>
            {action.files ? (
              action.files.length === 1 ? (
                <div className="overflow-hidden rounded-sm">
                  {/.(png|jpe?g)/gi.test(action.files[0]) ? (
                    <img src={action.files[0]} />
                  ) : (
                    <video
                      src={action.files[0]}
                      controls
                      loop
                      playsInline
                      width={"100%"}
                      height={"100%"}
                    />
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {action.files.map((file, i) => (
                    <div className="overflow-hidden rounded-sm" key={i}>
                      <img src={file} />
                    </div>
                  ))}
                </div>
              )
            ) : null}
            <div
              className="mt-4"
              dangerouslySetInnerHTML={{ __html: action.description || "" }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
}
