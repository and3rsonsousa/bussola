import { useLoaderData } from "@remix-run/react";
import {
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { MetaFunction } from "@vercel/remix";
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameYear,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CATEGORIES } from "~/lib/constants";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { headers, supabase } = createClient(request);

  const searchParams = new URL(request.url).searchParams;
  const range =
    searchParams.get("range") !== null
      ? searchParams.get("range")!.split("---")
      : [
          format(startOfWeek(startOfMonth(new Date())), "yyyy-MM-dd"),
          format(endOfWeek(endOfMonth(new Date())), "yyyy-MM-dd"),
        ];

  const id = searchParams.get("partner_id");

  if (!id) {
    return redirect("/dashboard");
  }

  let [start, end] = [
    format(
      new Date(
        Number(range[0].split("-")[0]),
        Number(range[0].split("-")[1]) - 1,
        Number(range[0].split("-")[2]),
      ),
      "yyyy-MM-dd 00:00:00",
    ),
    format(
      new Date(
        Number(range[1].split("-")[0]),
        Number(range[1].split("-")[1]) - 1,
        Number(range[1].split("-")[2]),
      ),
      "yyyy-MM-dd 23:59:59",
    ),
  ];
  const [
    { data: actions },
    { data: partner },
    { data: categories },
    { data: states },
  ] = await Promise.all([
    supabase
      .from("actions")
      .select("*")
      .match({ partner_id: id })
      .in("category_id", [
        CATEGORIES.post,
        CATEGORIES.reels,
        CATEGORIES.carousel,
        CATEGORIES.stories,
      ])
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true }),
    supabase.from("partners").select().match({ id }).single(),
    supabase.from("categories").select(),
    supabase.from("states").select(),
  ]);

  return json(
    {
      actions,
      partner,
      categories,
      range: [range[0].replace(/-/g, "/"), range[1].replace(/-/g, "/")],
      states,
    },
    { headers },
  );
};

export const meta: MetaFunction = ({ data }) => {
  const partner = (data as { partner: Partner }).partner;

  return [{ title: "Relatório de " + partner.title }];
};

export default function ReportPage() {
  const { actions, partner, range } = useLoaderData<typeof loader>();

  console.log(range);

  return (
    <div className="min-h-[100vh] bg-slate-100 p-4 text-center text-gray-500 antialiased">
      <h5 className="mb-4 text-xs font-bold uppercase tracking-wider">
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
        {actions?.map((action) => <ActionReport action={action} />)}
      </div>
    </div>
  );
}

const ActionReport = ({ action }: { action: Action }) => {
  const { categories, states } = useLoaderData<typeof loader>();

  const state = states!.find((state) => state.id === action.state_id);
  const category = categories!.find(
    (category) => category.id === action.category_id,
  );

  return (
    <div key={action.id} className="rounded-sm bg-white p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-black/10 pb-4 text-sm leading-none">
        <div className="first-letter:capitalize">
          {format(action.date, "E, d 'de' MMMM 'de' yyyy", {
            locale: ptBR,
          })}
        </div>
        <div className="flex items-center text-xs font-bold uppercase tracking-wider text-white">
          <div className={`rounded-l py-1 pl-3 pr-2 bg-${category?.slug}`}>
            {category?.title}
          </div>
          <div>
            <div
              className={`rounded-r py-1 pl-2 pr-3 text-xs font-bold uppercase bg-${state?.slug}`}
            >
              {state?.title}
            </div>
          </div>
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
            ) : /https:\/\/iframe/.test(action.files[0]) ? (
              <div className="relative h-80 w-full">
                <iframe
                  id="bunny-stream-embed"
                  src={action.files[0]}
                  className="absolute bottom-0 left-0 right-0 top-0 h-full w-full"
                  allowFullScreen={true}
                ></iframe>
              </div>
            ) : (
              <video
                src={action.files[0]}
                className="h-80 w-full bg-black"
                controls
              />
            )}
          </div>
        ) : (
          <div className="snap-x snap-mandatory overflow-hidden overflow-x-auto">
            <div
              className={`flex gap-1`}
              style={{ width: action.files.length * 90 + "%" }}
            >
              {action.files.map((file, i) => (
                <div
                  className="snap-center overflow-hidden rounded-sm border border-black/5"
                  key={i}
                >
                  <img src={file} />
                </div>
              ))}
            </div>
          </div>
        )
      ) : null}
      <h5 className="mt-4 text-sm font-bold uppercase tracking-normal text-gray-950">
        Legenda
      </h5>

      <div
        className="mt-4"
        dangerouslySetInnerHTML={{
          __html: action.caption?.replace(/\n/gi, "<br>") || "",
        }}
      ></div>
      {/* <div
        className="mt-4"
        dangerouslySetInnerHTML={{
          __html:
            action.category_id === CATEGORIES.stories
              ? action.description || ""
              : action.caption?.replace(/\n/gi, "<br>") || "",
        }}
      ></div> */}
    </div>
  );
};
