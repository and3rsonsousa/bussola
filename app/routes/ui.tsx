import { useLoaderData } from "@remix-run/react";
import {
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Loader from "~/components/structure/Loader";
import { Button } from "~/components/ui/button";
import { Avatar, Icons } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

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
  const [mode, setMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (mode === "dark") {
      document.querySelector("body")?.classList.add("dark");
    } else {
      document.querySelector("body")?.classList.remove("dark");
    }
  }, [mode]);

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex justify-between">
        <h1 className="text-5xl font-bold" style={{ fontStretch: "125%" }}>
          UI
        </h1>
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setMode((mode) => (mode === "dark" ? "light" : "dark"));
            }}
          >
            {mode === "light" ? (
              <>
                <MoonIcon className="size-6" />
              </>
            ) : (
              <>
                <SunIcon className="size-6" />
              </>
            )}
          </Button>
        </div>
      </div>
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
      <div className="flex gap-4 text-white">
        {[
          {
            className: "bg-idea",
            text: "Lorem ipsum dolor sit amet consectetur",
          },
          { className: "bg-do", text: "adipisicing elit" },
          {
            className: "bg-doing",
            text: "Odio ratione placeat voluptas itaque.",
          },
          {
            className: "bg-review",
            text: "unde similique fugiat consequuntur officia",
          },
          { className: "bg-done", text: "provident eos quisquam" },
          {
            className: "bg-finished",
            text: "ipsum dolor ab debitis dignissimos. Dolorem.",
          },
        ].map((item, i) => (
          <div
            className={`${item.className} flex items-center rounded-sm border border-white/20 p-4 text-sm font-semibold leading-none tracking-tight`}
            key={i}
          >
            {item.text}
          </div>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h1 className="mb-4 text-3xl font-bold">Loaders</h1>
          <div className="flex justify-between">
            <div>
              <Loader size="sm" />
            </div>
            <div>
              <Loader size="md" />
            </div>
            <div>
              <Loader size="lg" />
            </div>
          </div>
        </div>

        <div>
          <h1 className="mb-4 text-3xl font-bold">Focus Ring</h1>
          <Button>Focus Ring on use</Button>
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Buttons</h1>
      </div>
      <div className="flex gap-4 *:w-full">
        <Button variant={"default"}>Default</Button>
        <Button variant={"accent"}>Accent</Button>
        <Button variant={"destructive"}>Descructive</Button>
        <Button variant={"ghost"}>Ghost</Button>
        <Button variant={"link"}>Link</Button>
        <Button variant={"outline"}>Outline</Button>
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
