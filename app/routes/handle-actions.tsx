import { type ActionFunctionArgs, json } from "@vercel/remix";
import { INTENTS, PRIORITIES, TIMES } from "~/lib/constants";
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

      category: values["category"].toString(),
      state: values["state"].toString(),

      priority: PRIORITIES.medium,
      date: values["date"].toString(),
      instagram_date: values["instagram_date"].toString(),
      time:
        Number(values["time"]) || (TIMES as any)[values["category"].toString()],

      description: values["description"].toString(),
      title: values["title"].toString(),
      responsibles: values["responsibles"].toString().split(","),
      partners: values["partners"].toString().split(","),
      user_id: values["user_id"].toString(),
      color: values["color"].toString(),
      caption: "",
    };

    const { data, error } = await supabase
      .from("actions")
      .insert(actionToInsert)
      .select()
      .single();
    if (error) console.log({ error });

    return { data, error };
  } else if (intent === INTENTS.updateAction) {
    if (!id) throw new Error("No id was provided");

    // delete values.priority;
    // delete values.category;
    // delete values.state;
    // delete values.partner;
    // delete values.slug;
    delete values.archived;

    if (values.color === "" || values.color === null) delete values.color;

    if (values["files"] !== "null") {
      //@ts-ignore
      values["files"] = values["files"].toString().split(",");
    } else {
      //@ts-ignore
      values["files"] = null;
    }
    if (values["responsibles"] !== "null") {
      //@ts-ignore
      values["responsibles"] = values["responsibles"].toString().split(",");
    }

    //@ts-ignore
    values["partners"] = values["partners"].toString().split(",");

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
    const data = await supabase
      .from("actions")
      .update({ archived: true })
      .eq("id", id);

    return { data };
  } else if (intent === INTENTS.recoverAction) {
    const data = await supabase
      .from("actions")
      .update({ archived: false })
      .eq("id", id);

    return { data };
  } else if (intent === INTENTS.destroyAction) {
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
  } else if (intent === INTENTS.updatePartner) {
    if (!id) throw new Error("No id was provided");

    if (values.users_ids) {
      //@ts-ignore
      values["users_ids"] = String(values["users_ids"]).split(",");
    }

    const { data, error } = await supabase
      .from("partners")
      .update({
        ...values,
      })
      .eq("id", id);

    if (error) console.log({ error });

    return { data, error };
  } else if (intent === INTENTS.setSprint) {
    const sprint = {
      id: id.toString(),
      created_at: values["created_at"].toString(),
      action_id: values["action_id"].toString(),
      user_id: values["user_id"].toString(),
    };

    const { data, error } = await supabase
      .from("sprints")
      .insert({ ...sprint })
      .select()
      .single();

    if (error) console.log({ error });

    return { data, error };
  } else if (intent === INTENTS.unsetSprint) {
    const sprint = {
      action_id: values["action_id"].toString(),
      user_id: values["user_id"].toString(),
    };

    const { data, error } = await supabase
      .from("sprints")
      .delete()
      .match(sprint)
      .select()
      .single();

    if (error) console.log({ error });

    return { data, error };
  }

  return {};
};
