import { useLoaderData } from "@remix-run/react";
import {
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { Divide } from "lucide-react";
import { Avatar, Icons } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const [
    { data: partners },
    { data: people },
    { data: categories },
    { data: states },
    { data: priorities },
  ] = await Promise.all([
    supabase
      .from("partners")
      .select("*")
      .contains("users_ids", [user.id])
      .order("title", { ascending: true }),
    supabase.from("people").select("*").order("name", { ascending: true }),
    supabase.from("categories").select("*").order("order", { ascending: true }),
    supabase.from("states").select("*").order("order", { ascending: true }),
    supabase.from("priorities").select("*").order("order", { ascending: true }),
  ]);

  const person = people?.find((person) => person.user_id === user.id) as Person;

  return json(
    {
      partners,
      people,
      categories,
      user,
      states,
      priorities,
      person,
    } as DashboardDataType,
    200,
  );
}

export default function UI() {
  const { categories } = useLoaderData<typeof loader>() as DashboardDataType;
  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-5xl font-bold" style={{ fontStretch: "125%" }}>
        UI
      </h1>
      <div className="h-2 overflow-hidden rounded-sm">
        <div className="flex w-[110%] -translate-y-8 blur-xl">
          {[
            "bg-idea",
            "bg-do",
            "bg-doing",
            "bg-review",
            "bg-done",
            "bg-finished",
          ].map((bg) => (
            <div key={bg} className={`${bg} h-20 grow -translate-x-8`}></div>
          ))}
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Cores</h1>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="grid place-content-center rounded-lg border bg-background p-4 text-foreground">
            <div>.bg-background</div>
            <div>.text-foreground</div>
          </div>
          <div className="grid place-content-center rounded-lg border bg-card p-4 text-card-foreground">
            <div>.bg-card</div>
            <div>.text-card-foreground</div>
          </div>
          <div className="grid place-content-center rounded-lg border bg-popover p-4 text-popover-foreground">
            <div>.bg-popover</div>
            <div>.text-popover-foreground</div>
          </div>
          <div className="grid place-content-center rounded-lg bg-primary p-4 text-primary-foreground">
            <div>.bg-primary</div>
            <div>.text-primary-foreground</div>
          </div>
          <div className="grid place-content-center rounded-lg bg-secondary p-4 text-secondary-foreground">
            <div>.bg-secondary</div>
            <div>.text-secondary-foreground</div>
          </div>
          <div className="grid place-content-center rounded-lg bg-muted p-4 text-muted-foreground">
            <div>.bg-muted</div>
            <div>.text-muted-foreground</div>
          </div>
          <div className="grid place-content-center rounded-lg bg-accent p-4 text-accent-foreground">
            <div>.bg-accent</div>
            <div>.text-accent-foreground</div>
          </div>
          <div className="grid place-content-center rounded-lg bg-destructive p-4 text-destructive-foreground">
            <div>.bg-destructive</div>
            <div>.text-destructive-foreground</div>
          </div>
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Avatar</h1>
        <div className="mt-4 flex gap-2">
          <Avatar item={{ short: "cnvt" }} size="xs" />
          <Avatar item={{ short: "brenda" }} size="xs" />
          <Avatar item={{ short: "arc" }} size="xs" />
          <Avatar item={{ short: "smart" }} size="xs" />
          <div className="flex">
            <Avatar item={{ short: "cnvt" }} group size="xs" />
            <Avatar item={{ short: "brenda" }} group size="xs" />
            <Avatar item={{ short: "arc" }} group size="xs" />
            <Avatar item={{ short: "smart" }} group size="xs" />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Avatar item={{ short: "cnvt" }} />
          <Avatar item={{ short: "brenda" }} />
          <Avatar item={{ short: "arc" }} />
          <Avatar item={{ short: "smart" }} />
          <div className="flex">
            <Avatar item={{ short: "cnvt" }} group />
            <Avatar item={{ short: "brenda" }} group />
            <Avatar item={{ short: "arc" }} group />
            <Avatar item={{ short: "smart" }} group />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Avatar item={{ short: "cnvt" }} size="md" />
          <Avatar item={{ short: "brenda" }} size="md" />
          <Avatar item={{ short: "arc" }} size="md" />
          <Avatar item={{ short: "smart" }} size="md" />
          <div className="flex">
            <Avatar item={{ short: "cnvt" }} group size="md" />
            <Avatar item={{ short: "brenda" }} group size="md" />
            <Avatar item={{ short: "arc" }} group size="md" />
            <Avatar item={{ short: "smart" }} group size="md" />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Avatar item={{ short: "cnvt" }} size="lg" />
          <Avatar item={{ short: "brenda" }} size="lg" />
          <Avatar item={{ short: "arc" }} size="lg" />
          <Avatar item={{ short: "smart" }} size="lg" />
          <div className="flex">
            <Avatar item={{ short: "cnvt" }} group size="lg" />
            <Avatar item={{ short: "brenda" }} group size="lg" />
            <Avatar item={{ short: "arc" }} group size="lg" />
            <Avatar item={{ short: "smart" }} group size="lg" />
          </div>
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Categorias</h1>
        <div className="mt-4 grid grid-cols-3 gap-8">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-4 text-2xl font-light"
            >
              <div
                className={`bg-${category.slug} size-8 rounded-full border-8`}
              ></div>
              <Icons className="size-8" id={category.slug} />
              <div>{category.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
