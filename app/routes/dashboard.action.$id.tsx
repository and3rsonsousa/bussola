import {
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
} from "@vercel/remix";
import { Link, useLoaderData, useMatches, useSubmit } from "@remix-run/react";
import { format, formatDistanceToNow, parseISO } from "date-fns";

import { ptBR } from "date-fns/locale";
import {
	CalendarDaysIcon,
	CalendarIcon,
	Grid3X3Icon,
	ListTodoIcon,
} from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { INTENTS } from "~/lib/constants";
import { AvatarClient, Icons } from "~/lib/helpers";
import { SupabaseServerClient } from "~/lib/supabase";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const { headers, supabase } = SupabaseServerClient({ request });
	const { id } = params;

	if (!id) throw new Error("$id não foi definido");

	const { data: action } = await supabase
		.from("actions")
		.select("*")
		.eq("id", id)
		.single();

	return json({ headers, action });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{
			title: `${data?.action?.title} / ʀᴜʟeʀ`,
		},
	];
};

export default function ActionPage() {
	const { action: baseAction } = useLoaderData<typeof loader>();
	const [action, setAction] = useState(baseAction as Action);
	const submit = useSubmit();

	const { categories, clients, people, priorities, states } = useMatches()[1]
		.data as DashboardDataType;

	const client = clients.find(
		(client) => client.id === action.client_id
	) as Client;
	const category = categories.find(
		(category) => category.id === action.category_id
	) as Category;
	const state = states.find((state) => state.id === action.state_id) as State;
	const priority = priorities.find(
		(priority) => priority.id === action.priority_id
	) as Priority;
	const responsibles: Person[] = [];
	action.responsibles?.filter((user_id) =>
		responsibles.push(
			people.find((person) => person.user_id === user_id) as Person
		)
	);
	const date = parseISO(action.date);

	const handleActions = (data: {
		[key: string]: string | number | string[] | null;
	}) => {
		submit(
			{ ...data },
			{
				action: "/handle-actions",
				method: "post",
				navigate: false,
			}
		);
	};

	return (
		<div className="mx-auto flex h-full w-full max-w-xl flex-col overflow-hidden">
			<div className="pt-16"></div>
			<div className="flex shrink grow-0 items-center justify-between p-4 text-sm">
				<div className="flex items-center gap-2 ">
					<AvatarClient
						client={client}
						style={{
							viewTransitionName: "avatar-client",
						}}
					/>
					<div>
						<Link
							to={`/dashboard/${client.slug}`}
							className="font-extrabold uppercase tracking-wider text-gray-300 transition hover:text-gray-200"
						>
							{client.title}
						</Link>
						<div className="text-[11px] leading-none tracking-wide text-gray-500">
							{format(
								parseISO(baseAction?.updated_at as string),
								"yyyy-MM-dd HH:mm:ss"
							) ===
							format(
								parseISO(baseAction?.created_at as string),
								"yyyy-MM-dd HH:mm:ss"
							)
								? "Criado "
								: "Atualizado "}
							{formatDistanceToNow(
								parseISO(baseAction?.updated_at as string),
								{
									locale: ptBR,
									addSuffix: true,
								}
							)}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button asChild size={"icon"} variant="ghost">
						<Link to={`/dashboard/${client.slug}/actions`}>
							<ListTodoIcon className="h-4 w-4" />
						</Link>
					</Button>
					<Button size={"icon"} variant="ghost">
						<Link to={`/dashboard/${client.slug}/instagram`}>
							<Grid3X3Icon className="h-4 w-4" />
						</Link>
					</Button>
					<Button size={"icon"} variant="ghost">
						<Link to={`/dashboard/${client.slug}/calendar`}>
							<CalendarDaysIcon className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>

			<div className="flex shrink grow flex-col gap-4 overflow-hidden px-4 text-gray-300">
				{/* Título */}
				<div
					contentEditable="true"
					dangerouslySetInnerHTML={{
						__html: action?.title as string,
					}}
					onBlur={(e) =>
						setAction({
							...action,
							title: e.currentTarget.innerText,
						})
					}
					className="bg-transparent  text-5xl font-extrabold tracking-tighter outline-none transition"
					onPaste={(e) => {
						e.stopPropagation();
						e.preventDefault();
						setAction({
							...action,
							title: e.clipboardData.getData("text"),
						});
					}}
				/>
				{/* Descrição */}
				<div className="flex shrink grow flex-col overflow-hidden">
					<div className="mb-2 flex items-center gap-4 text-xs font-medium uppercase tracking-wider">
						<div>Descrição</div>
					</div>
					{/* <textarea
            name="description"
            id="description"
            className="scrollbars shrink grow bg-transparent text-xl font-normal leading-normal outline-none transition"
            rows={10}
            onBlur={(e) =>
              setAction({
                ...action,
                description: e.currentTarget.innerHTML,
              })
            }
          >
            {action?.description}
          </textarea> */}
					<div
						id="description"
						contentEditable="true"
						dangerouslySetInnerHTML={{
							__html: action?.description as string,
						}}
						onBlur={(e) =>
							setAction({
								...action,
								description: e.currentTarget.innerHTML,
							})
						}
						className="scrollbars shrink grow bg-transparent text-xl font-normal leading-normal outline-none transition"
						onPaste={(e) => {
							e.stopPropagation();
							e.preventDefault();
							const text = e.clipboardData.getData("text/plain");
							const range = window.getSelection()?.getRangeAt(0);
							range?.insertNode(document.createTextNode(text));

							// setAction({
							//   ...action,
							//   description: action.description?.concat(
							//     e.clipboardData.getData("text")
							//   ) as string,
							// })
						}}
					/>
				</div>
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
					{/* Clientes */}
					<div>
						<DropdownMenu>
							<DropdownMenuTrigger className="-ml-2 flex h-auto w-auto items-center gap-4 rounded-xl border-none p-2 outline-none ring-primary focus:ring-2 focus:ring-offset-0">
								<AvatarClient client={client} size="lg" />
								{/* <span className="font-medium">
									{client.title}
								</span> */}
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-content">
								{clients.map((client) => (
									<DropdownMenuItem
										key={client.id}
										className="bg-item flex items-center gap-2"
										textValue={client.title}
										onSelect={async () => {
											if (
												client.id !== action.client_id
											) {
												await handleActions({
													id: action.id,
													intent: INTENTS.updateAction,
													client_id: Number(
														client.id
													),
												});

												setAction({
													...action,
													client_id: Number(
														client.id
													),
												});
											}
										}}
									>
										<AvatarClient client={client} />
										<span>{client.title}</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					{/* Categoria */}
					<div>
						<DropdownMenu>
							<DropdownMenuTrigger className="flex h-auto  w-auto items-center gap-2 rounded-xl border-none p-2 outline-none ring-primary focus:ring-2 focus:ring-offset-0">
								<div className="grid h-12 w-12 place-content-center rounded-full bg-gray-900">
									<Icons id={category.slug} />
								</div>
								{/* <span className="font-medium">
									{category.title}
								</span> */}
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-content">
								{categories.map((category) => (
									<DropdownMenuItem
										key={category.id}
										className="bg-item flex items-center gap-2 focus:bg-primary"
										textValue={category.title}
										onSelect={() =>
											setAction({
												...action,
												category_id: Number(
													category.id
												),
											})
										}
									>
										<Icons
											id={category.slug}
											className="h-4 w-4 opacity-75"
										/>
										<span>{category.title}</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					{/* States */}
					<div>
						<DropdownMenu>
							<DropdownMenuTrigger className="-ml-2 flex h-auto w-auto items-center gap-4 rounded-xl border-none p-2 outline-none ring-primary focus:ring-2 focus:ring-offset-0">
								<div className="grid h-12 w-12 place-content-center rounded-full bg-gray-900">
									<div
										className={`h-6 w-6 rounded-full border-4 border-${state.slug}`}
									></div>
								</div>
								{/* <span className="font-medium">
									{state.title}
								</span> */}
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-content">
								{states.map((state) => (
									<DropdownMenuItem
										key={state.id}
										className="bg-item flex items-center gap-2 focus:bg-primary"
										textValue={state.title}
										onSelect={() =>
											setAction({
												...action,
												state_id: Number(state.id),
											})
										}
									>
										<div
											className={`my-1 h-3 w-3 rounded-full border-2 border-${state.slug}`}
										></div>
										<span>{state.title}</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					{/* Prioridade */}
					<div>
						<DropdownMenu>
							<DropdownMenuTrigger className="-ml-2 flex h-auto w-auto items-center gap-4 rounded-xl border-none p-2 outline-none ring-primary focus:ring-2 focus:ring-offset-0">
								<div className="grid h-12 w-12 place-content-center rounded-full bg-gray-900">
									<Icons id={priority.slug} type="priority" />
								</div>
								{/* <span className="font-medium">
									{priority.title}
								</span> */}
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-content">
								{priorities.map((priority) => (
									<DropdownMenuItem
										key={priority.id}
										className="bg-item flex items-center gap-2 focus:bg-primary"
										textValue={priority.title}
										onSelect={() =>
											setAction({
												...action,
												priority_id: priority.id,
											})
										}
									>
										<Icons
											id={priority.slug}
											type="priority"
											className="h-4 w-4"
										/>
										<span>{priority.title}</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					{/* Responsáveis */}
					<div>
						<DropdownMenu>
							<DropdownMenuTrigger className="-ml-2 flex h-auto w-auto items-center gap-4 rounded-xl border-none p-2 outline-none ring-primary focus:ring-2 focus:ring-offset-0">
								<div className="flex rounded-full bg-gray-900 p-2 pl-3">
									{responsibles.map((person) => (
										<Avatar
											key={person.id}
											className="-ml-1 h-8 w-8 border-l-2 border-background"
										>
											<AvatarImage src={person.image} />
										</Avatar>
									))}
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-content">
								{people.map((person) => (
									<DropdownMenuCheckboxItem
										key={person.id}
										className="bg-select-item flex items-center gap-2"
										textValue={person.name}
										checked={action.responsibles.includes(
											person.user_id
										)}
										onCheckedChange={(checked) => {
											if (
												!checked &&
												action.responsibles.length < 2
											) {
												alert(
													"É necessário ter pelo menos um responsável pala ação"
												);
												return false;
											}
											const tempResponsibles = checked
												? [
														...action.responsibles,
														person.user_id,
												  ]
												: action.responsibles.filter(
														(id) =>
															id !==
															person.user_id
												  );

											setAction({
												...action,
												responsibles: tempResponsibles,
											});
										}}
									>
										<Avatar
											key={person.id}
											className="h-4 w-4"
										>
											<AvatarImage src={person.image} />
										</Avatar>
										<span>{person.name}</span>
									</DropdownMenuCheckboxItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<div className="flex items-center justify-between pb-4">
					<div className="font-normal">
						<Popover>
							<PopoverTrigger asChild tabIndex={-7}>
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 flex items-center gap-2 font-normal focus-visible:ring-offset-0"
								>
									<CalendarIcon className="size-4" />
									<span>
										{format(
											date,
											"d 'de' MMMM 'de' yyyy 'às' H'h'".concat(
												date.getMinutes() > 0 ? "m" : ""
											),
											{
												locale: ptBR,
											}
										)}
									</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="bg-content">
								<Calendar
									mode="single"
									selected={parseISO(action.date)}
									locale={ptBR}
									onSelect={(date) => {
										if (date) {
											date?.setHours(
												parseISO(
													action.date
												).getHours(),
												parseISO(
													action.date
												).getMinutes()
											);

											setAction({
												...action,
												date: format(
													date,
													"yyyy-MM-dd'T'HH:mm"
												),
											});
										}
									}}
								/>
								<div className="mx-auto flex w-40 gap-2">
									<Select
										value={parseISO(action.date)
											.getHours()
											.toString()}
										onValueChange={(value) => {
											const date = parseISO(action.date);
											date.setHours(Number(value));
											setAction({
												...action,
												date: format(
													date,
													"yyyy-MM-dd'T'HH:mm"
												),
											});
										}}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Array(24)
												.fill(0)
												.map((i, j) => {
													return (
														<SelectItem
															value={j.toString()}
															key={j}
														>
															{j.toString()}
														</SelectItem>
													);
												})}
										</SelectContent>
									</Select>
									<Select
										value={parseISO(action.date)
											.getMinutes()
											.toString()}
										onValueChange={(value) => {
											const date = parseISO(action.date);
											date.setMinutes(Number(value));
											setAction({
												...action,
												date: format(
													date,
													"yyyy-MM-dd'T'HH:mm"
												),
											});
										}}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Array(60)
												.fill(0)
												.map((i, j) => {
													return (
														<SelectItem
															value={j.toString()}
															key={j}
														>
															{j.toString()}
														</SelectItem>
													);
												})}
										</SelectContent>
									</Select>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<div>
						<Button
							onClick={() => {
								handleActions({
									...action,
									responsibles: action.responsibles,
									intent: INTENTS.updateAction,
								});
							}}
						>
							Atualizar
						</Button>
					</div>
				</div>
			</div>
			{/* <pre className="text-xs leading-relaxed text-gray-600">
				
				{JSON.stringify(action, undefined, 2)}
			</pre> */}
		</div>
	);
}
