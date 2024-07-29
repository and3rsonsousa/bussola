import { Form, Link, useLoaderData, useMatches } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@vercel/remix";
import { Trash2Icon } from "lucide-react";
import { Avatar, getResponsibles } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { supabase, headers } = await createClient(request);

  const { data: partners } = await supabase
    .from("partners")
    .select("*")
    .order("title", { ascending: true });

  return json({ partners, headers });
};

export default function AdminPartners() {
  const matches = useMatches();

  const { partners } = useLoaderData<typeof loader>();

  const { people } = matches[1].data as DashboardDataType;

  return (
    <div className="overflow-hidden">
      <div className="scrollbars px-2">
        <div className="grid items-center py-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners?.map((partner: Partner) => (
            <Link
              to={`/dashboard/admin/partners/${partner.slug}`}
              className="group flex justify-between rounded-xl px-6 py-4 tracking-tight ring-ring transition focus-within:ring-2 hover:bg-secondary"
              key={partner.id}
              tabIndex={-1}
            >
              <div className="flex gap-4">
                <Avatar
                  item={{
                    short: partner.short,
                    bg: partner.bg,
                    fg: partner.fg,
                  }}
                  size="lg"
                />
                <div>
                  <div className="text-2xl font-bold leading-none outline-none">
                    {partner.title}
                  </div>
                  <div className="text-xs font-medium tracking-wide text-gray-500">
                    {partner.slug}
                  </div>
                  <div className="mt-2 flex">
                    {getResponsibles(people, partner.users_ids).map(
                      (person) => (
                        <Avatar
                          key={person.id}
                          item={{
                            image: person.image,
                            short: person.initials!,
                          }}
                          group
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
              <Form>
                <input name="id" value={partner.id} type="hidden" />
                <button className="opacity-0 group-hover:opacity-100">
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
