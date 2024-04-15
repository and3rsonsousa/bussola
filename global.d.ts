import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "database";
import type { DateRange } from "react-day-picker";

declare global {
	type OutletContextType = {
		supabase: SupabaseClient;
	};

	type Client = Database["public"]["Tables"]["clients"]["Row"];
	type Person = Database["public"]["Tables"]["people"]["Row"];
	type People = Person[];
	type Category = Database["public"]["Tables"]["categories"]["Row"];
	type State = Database["public"]["Tables"]["states"]["Row"];
	type Priority = Database["public"]["Tables"]["priority"]["Row"];
	type Action = Database["public"]["Tables"]["actions"]["Row"];

	type DashboardDataType = {
		clients: Client[];
		people: People;
		categories: Category[];
		states: State[];
		person: Person;
		user: User;
		priorities: Priority[];
	};

	type DashboardClientType = {
		actions: Action[];
		client: Client;
		range: DateRange;
	};

	type DashboardClientCalendarType = {
		isMonth: boolean;
		actions: Action[];
		client: Client;
		range: DateRange;
	};

	type RawAction = {
		title: string;
		description: string;
		client_id?: number;
		category_id: number;
		state_id: number;
		date: Date;
		user_id: string;
		responsibles: string[];
	};

	type GenericItem = {
		id: string | number;
		slug: string;
		title: string;
		href?: string;
		onSelect?: () => void;
	};

	type PRIORITIES = "low" | "mid" | "high";
}
