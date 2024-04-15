import {
	Link,
	useFetchers,
	useMatches,
	useNavigate,
	useNavigation,
} from "@remix-run/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function Header() {
	const matches = useMatches();
	const navigation = useNavigation();
	const navigate = useNavigate();

	const { clients, person } = matches[1].data as DashboardDataType;
	const { client } = matches[1].params;

	const fetchers = useFetchers();

	return (
		<header className="fixed left-0 right-0 top-0 z-20 mx-auto flex h-16 flex-shrink-0 flex-grow items-center justify-between bg-background/25 px-4 backdrop-blur-xl md:px-8">
			<div className="flex items-center gap-2">
				<Link to="/dashboard" unstable_viewTransition>
					<img src="/logo.png" className="h-4 w-auto" alt="Bússola" />
				</Link>

				{(navigation.state !== "idle" ||
					fetchers.filter((f) => f.formData).length > 0) && (
					<div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-b-primary/50"></div>
				)}
			</div>
			<div className="flex items-center justify-end gap-2 text-sm font-semibold">
				<DropdownMenu>
					<DropdownMenuTrigger className="outline-none focus-within:ring-2 ring-primary rounded-lg px-2 py-1 mr-2">
						{client
							? clients.find(
									(currentClient) =>
										currentClient.slug === client
							  )?.title
							: "Parceiros"}
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{clients.map((client) => (
							<DropdownMenuItem
								onSelect={() =>
									navigate(`/dashboard/${client.slug}`)
								}
								key={client.id}
								id={client.slug}
							>
								{client.title}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				<DropdownMenu>
					<DropdownMenuTrigger className="outline-none focus-within:ring-2 ring-primary rounded-full p-1 -mr-1">
						<div className="size-6 overflow-hidden rounded-full">
							<img src={person.image} alt={person.name} />
						</div>
					</DropdownMenuTrigger>

					<DropdownMenuContent>
						<DropdownMenuItem
							id="account"
							onSelect={() => navigate("/dashboard/account")}
						>
							Minha Conta
						</DropdownMenuItem>
						<DropdownMenuItem
							id="logout"
							onSelect={() => navigate("/logout")}
						>
							Sair
						</DropdownMenuItem>
						<DropdownMenuSeparator className="-mx-1 my-2 h-[1px] bg-white/20" />
						<DropdownMenuItem
							id="partners"
							onSelect={() =>
								navigate("/dashboard/admin/clients")
							}
						>
							Parceiros
						</DropdownMenuItem>
						<DropdownMenuItem
							id="new-partner"
							onSelect={() =>
								navigate("/dashboard/admin/clients/new")
							}
						>
							Novo parceiro
						</DropdownMenuItem>

						<DropdownMenuSeparator className="-mx-1 my-2 h-[1px] bg-white/20" />
						<DropdownMenuItem
							id="users"
							onSelect={() => navigate("/dashboard/admin/users/")}
						>
							Usuários
						</DropdownMenuItem>
						<DropdownMenuItem
							id="new-user"
							onSelect={() =>
								navigate("/dashboard/admin/users/new")
							}
						>
							Novo usuário
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="absolute bottom-0 h-[1px] w-full bg-gradient-to-r  from-transparent via-gray-700"></div>
		</header>
	);
}
