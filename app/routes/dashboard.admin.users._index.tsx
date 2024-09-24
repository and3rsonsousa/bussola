import { Form, Link, useLoaderData } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@vercel/remix";
import { Edit3Icon, ListIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Avatar } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { supabase, headers } = await createClient(request);

  const { data: people } = await supabase
    .from("people")
    .select("*")
    .order("name", { ascending: true });

  return json({ people, headers });
};

export default function AdminPartners() {
  const { people } = useLoaderData<typeof loader>();
  return (
    <div className="overflow-hidden">
      <ScrollArea className="h-full w-full px-4 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people?.map((person: Person) => (
            <div className="flex flex-col gap-4 p-4" key={person.id}>
              <div key={person.user_id} className="flex items-center gap-4">
                <Avatar
                  item={{
                    image: person.image,
                    short: person.initials!,
                  }}
                  size="lg"
                />
                <div className="text-2xl font-bold tracking-tighter">
                  {`${person.name} ${person.surname}`}
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild size={"sm"} variant={"secondary"}>
                  <Link
                    className="items-center gap-4 rounded-xl px-6 py-4"
                    to={`/dashboard/admin/users/actions/${person.user_id}`}
                  >
                    Ver Ações
                    <ListIcon className="size-4" />
                  </Link>
                </Button>
                <Button asChild size={"sm"} variant={"secondary"}>
                  <Link
                    className="items-center gap-4 rounded-xl px-6 py-4"
                    to={`/dashboard/admin/users/${person.user_id}`}
                  >
                    Editar
                    <Edit3Icon className="size-4" />
                    {/* <Form>
                  <input name="id" value={person.user_id} type="hidden" />
                  <button className="opacity-0 group-hover:opacity-100">
                    <Trash2Icon className="h-6 w-6 opacity-75" />
                  </button>
                </Form> */}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
