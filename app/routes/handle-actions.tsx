import { type ActionFunctionArgs, json } from "@vercel/remix";
import { format } from "date-fns";
import { INTENTS, PRIORITIES } from "~/lib/constants";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

export const action = async ({ request }: ActionFunctionArgs) => {
  const { headers, supabase } = createClient(request);

  const formData = await request.formData();
  const { intent, id, ...values } = Object.fromEntries(formData.entries());

  if (!intent) throw new Error("No intent was defined");

  if (intent === INTENTS.createAction) {
    const actionToInsert = {
      id: id.toString(),
      created_at: values["created_at"].toString(),
      updated_at: values["updated_at"].toString(),

      category_id: values["category_id"].toString(),
      state_id: values["state_id"].toString(),
      partner_id: values["partner_id"].toString(),
      date: values["date"].toString(),
      description: values["description"].toString(),
      title: values["title"].toString(),
      responsibles: values["responsibles"].toString().split(","),
      user_id: values["user_id"].toString(),
      priority_id: PRIORITIES.medium,
      caption: "",
    };

    const { data, error } = await supabase
      .from("actions")
      .insert(actionToInsert)
      .select()
      .single();

    return json({ data, error }, { headers });
  } else if (intent === INTENTS.updateAction) {
    if (!id) throw new Error("No id was provided");

    delete values.priority;
    delete values.category;
    delete values.state;
    delete values.partner;
    delete values.slug;
    delete values.date_to_post;

    if (values["files"] !== "null") {
      values["files"] = values["files"].toString().split(",");
    } else {
      values["files"] = null;
    }
    if (values["responsibles"] !== "null") {
      values["responsibles"] = values["responsibles"].toString().split(",");
    }

    const { data, error } = await supabase
      .from("actions")
      .update({
        ...values,
      })
      .eq("id", id);

    if (error) console.log({ from: "UPDATE ACTION", error });

    return { data, error };
  } else if (intent === INTENTS.duplicateAction) {
    const { data: oldAction } = await supabase
      .from("actions")
      .select("*")
      .eq("id", id)
      .single();
    if (oldAction) {
      const newId = values["newId"].toString();
      const created_at = values["created_at"].toString();
      const updated_at = values["updated_at"].toString();
      const { data: newAction, error } = await supabase
        .from("actions")
        .insert({
          ...oldAction,
          id: newId,
          created_at,
          updated_at,
        })
        .select()
        .single();

      return { newAction, error };
    }
  } else if (intent === INTENTS.deleteAction) {
    const data = await supabase.from("actions").delete().eq("id", id);

    return { data };
  } else if (intent === INTENTS.updatePerson) {
    if (!id) throw new Error("No id was provided");
    const { data, error } = await supabase
      .from("people")
      .update({
        ...values,
      })
      .eq("id", id);

    if (error) console.log({ error });

    return { data, error };
  }

  return {};
};
