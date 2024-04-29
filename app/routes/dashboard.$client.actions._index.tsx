import { LoaderFunctionArgs } from "@vercel/remix"
import { useLoaderData, useMatches } from "@remix-run/react"
import { ListOfActions } from "~/components/structure/Action"
import { getDelayedActions, sortActions } from "~/lib/helpers"
import { SupabaseServerClient } from "~/lib/supabase"

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { supabase } = SupabaseServerClient({ request })

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", params["client"] as string)
    .single()

  const { data: actions } = await supabase
    .from("actions")
    .select("*")
    .eq("client_id", client!.id)

  return { actions, client }
}

export default function Actions() {
  const matches = useMatches()
  const { actions } = useLoaderData<typeof loader>() || {}
  const { categories, priorities, states, clients } = matches[1]
    .data as DashboardDataType

  const lateActions = getDelayedActions({ actions: actions as Action[] })

  return (
    <div className="overflow-hidden">
      {lateActions?.length ? (
        <div className="mb-4">
          <div className="flex justify-between py-8">
            <h2 className="text-3xl font-medium tracking-tight">
              Atrasados ({lateActions?.length})
            </h2>
          </div>

          <ListOfActions
            categories={categories}
            priorities={priorities}
            states={states}
            actions={lateActions}
            showCategory={true}
            date={{ dateFormat: 1 }}
            clients={clients}
          />
        </div>
      ) : null}

      <div className="flex justify-between py-2">
        <h2 className="mb-2 text-xl font-medium">
          Todas as Ações ({actions?.length})
        </h2>
      </div>
      <ListOfActions
        categories={categories}
        priorities={priorities}
        states={states}
        actions={sortActions(actions)}
        showCategory={true}
        date={{ dateFormat: 1 }}
        clients={clients}
      />
    </div>
  )
}
