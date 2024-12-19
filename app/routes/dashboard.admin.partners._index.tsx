import { Form, Link, useLoaderData, useMatches } from "@remix-run/react";
import { json, MetaFunction, type LoaderFunctionArgs } from "@vercel/remix";
import { ArchiveIcon, StarIcon, Trash2Icon } from "lucide-react";
import { Heading } from "~/components/structure/Headings";
import { SOW } from "~/lib/constants";
import { Avatar, AvatarGroup, getResponsibles } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { supabase, headers } = await createClient(request);

  const { data: partners, error } = await supabase
    .from("partners")
    .select("*")
    .order("archived", { ascending: true })
    .order("title", { ascending: true });

  if (error) console.log({ error });

  return json({ partners, headers });
};

export const meta: MetaFunction = () => {
  return [
    { title: "Parceiros - ʙússoʟa" },
    {
      name: "description",
      content:
        "Aplicativo de Gestão de Projetos Criado e Mantido pela Agência Canivete. ",
    },
  ];
};

export default function AdminPartners() {
  // const matches = useMatches();

  const { partners } = useLoaderData<typeof loader>();

  // const { people } = matches[1].data as DashboardRootType;

  return (
    <div className="overflow-hidden">
      <div className="scrollbars px-4 py-2 md:px-8">
        <Heading>Parceiros</Heading>
        <div className="grid items-center gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners?.map((partner: Partner) => (
            <Link
              to={`/dashboard/admin/partners/${partner.slug}`}
              className="group bg-card ring-ring hover:bg-secondary relative flex justify-between overflow-hidden rounded-xl p-6 tracking-tight transition-colors duration-500 focus-within:ring-2"
              key={partner.slug}
              tabIndex={-1}
            >
              <div className="flex w-full gap-4">
                <Avatar
                  item={{
                    short: partner.short,
                    bg: partner.colors[0],
                    fg: partner.colors[1],
                  }}
                  size="lg"
                />
                <div className="w-full overflow-hidden">
                  <div className="mb-1 flex w-[90%] gap-2 overflow-hidden text-2xl leading-none font-bold outline-hidden">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {partner.title}
                    </div>
                    {partner.archived && <ArchiveIcon className="opacity-25" />}
                  </div>
                  <div className="text-xs font-medium tracking-wide opacity-50">
                    {partner.slug}
                  </div>
                  <div className="mt-4 flex w-full items-center justify-between gap-4">
                    <div>
                      <AvatarGroup
                        size="sm"
                        avatars={getResponsibles(partner.users_ids).map(
                          (r) => ({
                            item: {
                              image: r.image,
                              short: r.initials!,
                              title: r.name,
                            },
                          }),
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold tracking-wide uppercase opacity-50">
                      {partner.sow === "marketing"
                        ? "Consultoria de Marketing 360"
                        : partner.sow === "socialmedia"
                          ? "Gestão de Redes Sociais"
                          : "Serviços avulsos"}
                    </div>
                  </div>
                </div>
              </div>
              <Form className="absolute top-4 right-4">
                <input name="id" value={partner.id} type="hidden" />
                <button className="translate-x-12 transition-transform duration-500 group-hover:translate-x-0">
                  <Trash2Icon className="h-6 w-6 opacity-75" />
                </button>
              </Form>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
