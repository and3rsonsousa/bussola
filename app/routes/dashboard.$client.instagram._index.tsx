import { LoaderFunctionArgs } from "@vercel/remix"
import { useLoaderData, useMatches } from "@remix-run/react"
import { GridOfActions, ListOfActions } from "~/components/structure/Action"
import { getInstagramActions } from "~/lib/helpers"
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
  const { categories, priorities, states } = matches[1]
    .data as DashboardDataType

  const instagramActions = getInstagramActions({ actions })

  return (
    <div className="flex gap-8 overflow-hidden">
      <div className="mt-2 w-1/2">
        <div className="mb-8">
          <div className="flex justify-between py-2">
            <h2 className="mb-2 text-xl font-medium">
              Ações para o Instagram ({instagramActions?.length})
            </h2>
          </div>

          <ListOfActions
            categories={categories}
            priorities={priorities}
            states={states}
            actions={instagramActions}
            showCategory
          />
        </div>
      </div>
      <div className="mt-4 w-1/2">
        <GridOfActions
          categories={categories}
          priorities={priorities}
          states={states}
          actions={instagramActions}
        />
      </div>
    </div>
  )
}
