import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "database";
import type { DateRange } from "react-day-picker";

declare global {
  type OutletContextType = {
    supabase: SupabaseClient;
  };

  type Partner = Database["public"]["Tables"]["partners"]["Row"];
  type Person = Database["public"]["Tables"]["people"]["Row"];
  type People = Person[];
  type Category = Database["public"]["Tables"]["categories"]["Row"];
  type State = Database["public"]["Tables"]["states"]["Row"];
  type Priority = Database["public"]["Tables"]["priorities"]["Row"];
  type Action = Database["public"]["Tables"]["actions"]["Row"];
  type ActionComplete =
    Database["public"]["Views"]["get_actions_for_partners"]["Row"];

  type DashboardDataType = {
    partners: Partner[];
    people: People;
    categories: Category[];
    states: State[];
    person: Person;
    user: User;
    priorities: Priority[];
  };

  type DashboardPartnerType = {
    actions: Action[];
    partner: Partner;
    person: Person;
  };

  type RawAction = {
    title: string;
    description: string;
    partner_id?: string;
    category_id: string;
    state_id: string;
    date: Date;
    user_id: string;
    responsibles: string[];
  };

  type GenericItem = {
    id: string;
    slug: string;
    title: string;
    href?: string;
    onSelect?: () => void;
  };

  type PRIORITIES = "low" | "mid" | "high";
}
