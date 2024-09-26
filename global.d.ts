import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "database";
import type { DateRange } from "react-day-picker";

declare global {
  type OutletContextType = {
    supabase: SupabaseClient;
  };

  type Partner = Database["public"]["Tables"]["partners"]["Row"];
  type Person = Database["public"]["Tables"]["people"]["Row"];
  type Category = Database["public"]["Tables"]["categories"]["Row"];
  type State = Database["public"]["Tables"]["states"]["Row"];
  type Priority = Database["public"]["Tables"]["priorities"]["Row"];
  type Action = Database["public"]["Tables"]["actions"]["Row"];
  type Area = Database["public"]["Tables"]["areas"]["Row"];
  type Sprint = Database["public"]["Tables"]["sprints"]["Row"];

  type ActionFull = Action & {
    state: State;
    category: Category;
    priority: Priority;
    partner: Partner;
  };

  type DashboardRootType = {
    url: URL;
    partners: Partner[];
    people: Person[];
    categories: Category[];
    states: State[];
    person: Person;
    user: User;
    priorities: Priority[];
    areas: Area[];
    sprints: Sprint[];
  };

  type ActionChart = { category: string; date: string; state: string };

  type DashboardIndexType = {
    actions: Action[];
    actionsChart: ActionChart[];
  };

  type DashboardPartnerType = {
    actions: Action[];
    partner: Partner;
    person: Person;
  };

  type RawAction = {
    title: string;
    description: string;
    partner?: string;
    category: string;
    state: string;
    date: Date;
    user_id: string;
    responsibles: string[];
    color: string;
    time: number;
  };

  type GenericItem = {
    id: string;
    slug: string;
    title: string;
    href?: string;
    onSelect?: () => void;
  };

  type PRIORITIES = "low" | "mid" | "high";

  type THEME = "dark" | "light";

  type ContextType = {
    showFeed: boolean;
    setShowFeed: React.Dispatch<React.SetStateAction<boolean>>;
    isTransitioning: boolean;
    setTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
  };
}
