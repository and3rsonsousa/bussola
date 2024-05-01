/* eslint-disable jsx-a11y/no-autofocus */
import { useMatches } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

export default function Search() {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState("");
	const matches = useMatches();
	const partners = (matches[1].data as DashboardDataType).partners;

	const [sections, setSections] = useState<
		Array<{
			name: string;
			items: { id: string | number; title: string; href: string }[];
		}>
	>([
		{
			name: "Parceiros",
			items: partners.map((partner) => ({
				id: partner.id,
				title: partner.title,
				href: `/dashboard/${partner.slug}`,
			})),
		},
		{
			name: "Ações",
			items: [],
		},
	]);

	const { env } = matches[0].data as {
		env: { SUPABASE_URL: string; SUPABASE_KEY: string };
	};

	const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_KEY);

	useEffect(() => {
		const keyDown = (event: KeyboardEvent) => {
			if (event.metaKey && event.key === "k") {
				setOpen(true);
			}
		};

		document.addEventListener("keydown", keyDown);

		return () => document.removeEventListener("keydown", keyDown);
	}, []);

	useEffect(() => {
		if (supabase) {
			supabase
				.from("actions")
				.select("*")
				.then((value) => {
					const s = sections;
					const actions = value.data
						? value.data.map((action: Action) => ({
								id: action.id,
								title: action.title,
								href: `/dashboard/action/${action.id}`,
						  }))
						: [];
					s[1].items = actions;
					setSections(s);
				});
		}
	}, [supabase]);

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ComboBox className="relative w-96 rounded-md" aria-label="Search">
				<Input
					className={`w-full rounded-md bg-background px-6 py-4 text-xl font-light antialiased outline-none ring-2 ring-primary  `}
					value={value}
					onChange={(event) => setValue(event.target.value)}
					autoFocus={true}
				/>

				<Popover className="scrollbars scrollbars-thin  top-0 -mt-1 w-[--trigger-width] overflow-auto rounded-md bg-background/50 p-2 ring-1 ring-white/10 backdrop-blur-xl entering:animate-in entering:slide-out-to-bottom-2">
					<ListBox
						items={sections}
						onAction={(key) => {
							console.log({ key });
						}}
						selectionBehavior="toggle"
					>
						{(section) => (
							<Section id={section.name}>
								<Header className="px-4 py-2">
									{section.name}
								</Header>
								<Collection items={section.items}>
									{(item) => (
										<ListBoxItem
											className="block w-full rounded-sm px-4 py-2 text-sm text-gray-400 transition"
											key={item.id}
											href={item.href}
										>
											{item.title}
										</ListBoxItem>
									)}
								</Collection>
							</Section>
						)}
					</ListBox>
				</Popover>
			</ComboBox>
		</Modal>
	);
}
