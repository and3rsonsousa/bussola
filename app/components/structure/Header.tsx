import {
	Link,
	useFetchers,
	useMatches,
	useNavigate,
	useNavigation,
} from "@remix-run/react";
import {
	HandshakeIcon,
	HelpCircle,
	LogOutIcon,
	PlusIcon,
	Users2Icon,
} from "lucide-react";
import { Avatar } from "~/lib/helpers";
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

	const { partners, person } = matches[1].data as DashboardDataType;
	const { partner } = matches[1].params;

	const fetchers = useFetchers();

	return (
		<header className="flex flex-shrink-0 flex-grow items-center justify-between p-4 backdrop-blur-xl md:px-8">
			<div className="flex items-center gap-2">
				<Link to="/dashboard" unstable_viewTransition>
					<img src="/logo.png" className="h-4 w-auto" alt="Bússola" />
				</Link>

				{(navigation.state !== "idle" ||
					fetchers.filter((f) => f.formData).length > 0) && (
					<div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-b-primary/50"></div>
				)}
			</div>
			<div className="flex items-center justify-end gap-2 text-sm font-medium">
				<DropdownMenu>
					<DropdownMenuTrigger className="outline-none focus-within:ring-2 ring-primary rounded-lg px-2 py-1 mr-2">
						{partner
							? partners.find(
									(currentPartner) =>
										currentPartner.slug === partner
							  )?.title
							: "Parceiros"}
					</DropdownMenuTrigger>
					<DropdownMenuContent className="bg-content">
						{partners.map((partner) => (
							<DropdownMenuItem
								className="bg-item"
								onSelect={() =>
									navigate(`/dashboard/${partner.slug}`)
								}
								key={partner.id}
								id={partner.slug}
							>
								{partner.title}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				{person && (
					<DropdownMenu>
						<DropdownMenuTrigger className="outline-none focus-within:ring-2 ring-primary rounded-full p-1 -mr-1">
							<Avatar
								size="md"
								item={{
									image: person.image,
									short: person.initials!,
								}}
							/>
						</DropdownMenuTrigger>

						<DropdownMenuContent>
							{/* <DropdownMenuItem
								className="bg-item"
								id="account"
								onSelect={() => navigate("/dashboard/account")}
							>
								<User2Icon className="size-4 opacity-50" />
								<div>Minha Conta</div>
							</DropdownMenuItem> */}
							<DropdownMenuItem
								className="bg-item"
								id="account"
								onSelect={() => navigate("/dashboard/help")}
							>
								<HelpCircle className="size-4 opacity-50" />
								<div>Ajuda</div>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="bg-item"
								id="ajuda"
								onSelect={() => navigate("/logout")}
							>
								<LogOutIcon className="size-4 opacity-50" />
								<div>Sair</div>
							</DropdownMenuItem>
							{person.admin && (
								<>
									<DropdownMenuSeparator className="-mx-1 my-2 h-[1px] bg-white/20" />
									<DropdownMenuItem
										className="bg-item"
										id="partners"
										onSelect={() =>
											navigate(
												"/dashboard/admin/partners"
											)
										}
									>
										<HandshakeIcon className="size-4 opacity-50" />
										<div>Parceiros</div>
									</DropdownMenuItem>
									<DropdownMenuItem
										className="bg-item"
										id="new-partner"
										onSelect={() =>
											navigate(
												"/dashboard/admin/partners/new"
											)
										}
									>
										<PlusIcon className="size-4 opacity-50" />
										<div>Novo parceiro</div>
									</DropdownMenuItem>

									<DropdownMenuSeparator className="-mx-1 my-2 h-[1px] bg-white/20" />
									<DropdownMenuItem
										className="bg-item"
										id="users"
										onSelect={() =>
											navigate("/dashboard/admin/users/")
										}
									>
										<Users2Icon className="size-4 opacity-50" />
										<div>Usuários</div>
									</DropdownMenuItem>
									<DropdownMenuItem
										className="bg-item"
										id="new-user"
										onSelect={() =>
											navigate(
												"/dashboard/admin/users/new"
											)
										}
									>
										<PlusIcon className="size-4 opacity-50" />
										<div>Novo usuário</div>
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			<div className="absolute bottom-0 h-[1px] w-full bg-gradient-to-r  from-transparent via-gray-700"></div>
		</header>
	);
}
