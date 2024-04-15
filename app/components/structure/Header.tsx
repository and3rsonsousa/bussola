import {
	Link,
	useFetchers,
	useMatches,
	useNavigate,
	useNavigation,
} from "@remix-run/react";

export default function Header() {
	const matches = useMatches();
	const navigation = useNavigation();
	const navigate = useNavigate();

	const { clients, user } = matches[1].data as DashboardDataType;
	const { client } = matches[1].params;

	const fetchers = useFetchers();

	return (
		<header className="fixed left-0 right-0 top-0 z-20 mx-auto flex h-16 flex-shrink-0 flex-grow items-center justify-between bg-background/25 px-4 backdrop-blur-xl md:px-8">
			<div className="flex items-center gap-2">
				<Link to="/dashboard" unstable_viewTransition>
					<img
						src="/theruller.png"
						className="w-28"
						alt="The Ruller"
					/>
				</Link>

				{(navigation.state !== "idle" ||
					fetchers.filter((f) => f.formData).length > 0) && (
					<div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-b-primary/50"></div>
				)}
			</div>
			<div className="flex items-center justify-end gap-2 text-sm font-medium">
				<MenuTrigger>
					<Button size={"sm"} variant={"ghost"}>
						{client
							? clients.find(
									(currentClient) =>
										currentClient.slug === client
							  )?.title
							: "Parceiros"}
					</Button>
					<Popover>
						<Menu
							className="outline-none"
							onAction={(key) => {
								navigate(`/dashboard/${key}`);
							}}
						>
							{clients.map((client) => (
								<MenuItem key={client.id} id={client.slug}>
									{client.title}
								</MenuItem>
							))}
						</Menu>
					</Popover>
				</MenuTrigger>

				<MenuTrigger>
					<Button variant={"ghost"} size={"icon-sm"}>
						<div className="size-6 overflow-hidden rounded-full">
							<img src={user.image} alt={user.name} />
						</div>
					</Button>
					<Popover>
						<Menu className="outline-none">
							<MenuItem id="account" href="/dashboard/account">
								Minha Conta
							</MenuItem>
							<MenuItem id="logout" href="/logout">
								Sair
							</MenuItem>
							<Separator className="-mx-1 my-2 h-[1px] bg-white/20" />
							<MenuItem
								id="partners"
								href="/dashboard/admin/clients"
							>
								Parceiros
							</MenuItem>
							<MenuItem
								id="new-partner"
								href="/dashboard/admin/clients/new"
							>
								Novo parceiro
							</MenuItem>
							<Separator className="-mx-1 my-2 h-[1px] bg-white/20" />
							<MenuItem id="users" href="/dashboard/admin/users/">
								Usuários
							</MenuItem>
							<MenuItem
								id="new-user"
								href="/dashboard/admin/users/new"
							>
								Novo usuário
							</MenuItem>
						</Menu>
					</Popover>
				</MenuTrigger>

				{/* 
            <DropdownMenuItem
              onSelect={() => supabase.auth.signOut()}
              className="bg-item focus:bg-primary"
            >
              Sair
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-300/20" />
            <DropdownMenuLabel className="mx-2">Clientes</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => supabase.auth.signOut()}
              className="bg-item focus:bg-primary"
            >
              Ver todos os Clientes
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => supabase.auth.signOut()}
              className="bg-item focus:bg-primary"
            >
              Adicionar novo Cliente
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-300/20" />
            <DropdownMenuLabel className="mx-2">Usuários</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => supabase.auth.signOut()}
              className="bg-item focus:bg-primary"
            >
              Ver todos os Usuários
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => supabase.auth.signOut()}
              className="bg-item focus:bg-primary"
            >
              Adicionar novo Usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </MenuTrigger> */}
			</div>

			<div className="absolute bottom-0 h-[1px] w-full bg-gradient-to-r  from-transparent via-gray-700"></div>
		</header>
	);
}
