import { createServerClient, parse, serialize } from "@supabase/ssr";
import { type Database } from "database";

export function createClient(request: Request) {
	const cookies = parse(request.headers.get("Cookie") ?? "");
	const headers = new Headers();

	return {
		supabase: createServerClient<Database>(
			process.env.SUPABASE_URL!,
			process.env.SUPABASE_KEY!,
			{
				cookies: {
					get(key) {
						return cookies[key];
					},
					set(key, value, options) {
						headers.append(
							"Set-Cookie",
							serialize(key, value, options)
						);
					},
					remove(key, options) {
						headers.append(
							"Set-Cookie",
							serialize(key, "", options)
						);
					},
				},
			}
		),
		headers,
	};
}
