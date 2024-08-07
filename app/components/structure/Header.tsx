import {
  Link,
  useFetchers,
  useMatches,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import {
  ArrowLeftIcon,
  HandshakeIcon,
  HelpCircle,
  LogOutIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  Users2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, Bussola } from "~/lib/helpers";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Loader from "./Loader";

export default function Header() {
  const matches = useMatches();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"dark" | "light">("dark");

  const { partners, person } = matches[1].data as DashboardDataType;
  const { partner } = matches[1].params;

  const fetchers = useFetchers();

  useEffect(() => {
    if (mode === "dark") {
      document.querySelector("body")?.classList.add("dark");
    } else {
      document.querySelector("body")?.classList.remove("dark");
    }
  }, [mode]);

  return (
    <header
      className={`flex flex-shrink-0 flex-grow items-center justify-between p-4 md:px-8`}
    >
      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          unstable_viewTransition
          className="-ml-2 rounded px-2 outline-none ring-ring ring-offset-background focus:ring-2"
        >
          <Bussola />
        </Link>
        <Button
          size="icon"
          variant={"ghost"}
          onClick={() => {
            navigate(-1);
          }}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>

        {(navigation.state !== "idle" ||
          fetchers.filter((f) => f.formData).length > 0) && (
          <Loader size="md" />
        )}
      </div>
      <div className="flex items-center justify-end gap-2 text-sm font-medium">
        <DropdownMenu>
          <DropdownMenuTrigger className="mr-2 rounded-lg px-2 py-1 outline-none ring-ring focus-within:ring-2">
            {partner
              ? partners.find(
                  (currentPartner) => currentPartner.slug === partner,
                )?.title
              : "Parceiros"}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-content">
            {partners.map((partner) => (
              <DropdownMenuItem
                className="bg-item"
                onSelect={() => navigate(`/dashboard/${partner.slug}`)}
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
            <DropdownMenuTrigger className="-mr-1 rounded-full outline-none ring-ring ring-offset-2 ring-offset-background focus-within:ring-2">
              <Avatar
                size="md"
                item={{
                  image: person.image,
                  short: person.initials!,
                }}
              />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="bg-content">
              <DropdownMenuItem
                className="bg-item"
                onSelect={() => {
                  setMode((mode) => (mode === "dark" ? "light" : "dark"));
                }}
              >
                {mode === "light" ? (
                  <>
                    <MoonIcon className="size-4 opacity-50" />
                    <span>Modo escuro</span>
                  </>
                ) : (
                  <>
                    <SunIcon className="size-4 opacity-50" />
                    <span>Modo claro</span>
                  </>
                )}
              </DropdownMenuItem>

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
                  <DropdownMenuSeparator className="-mx-1 my-2 h-[1px] bg-border" />
                  <DropdownMenuItem
                    className="bg-item"
                    id="partners"
                    onSelect={() => navigate("/dashboard/admin/partners")}
                  >
                    <HandshakeIcon className="size-4 opacity-50" />
                    <div>Parceiros</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="bg-item"
                    id="new-partner"
                    onSelect={() => navigate("/dashboard/admin/partners/new")}
                  >
                    <PlusIcon className="size-4 opacity-50" />
                    <div>Novo parceiro</div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="-mx-1 my-2 h-[1px] bg-border" />
                  <DropdownMenuItem
                    className="bg-item"
                    id="users"
                    onSelect={() => navigate("/dashboard/admin/users/")}
                  >
                    <Users2Icon className="size-4 opacity-50" />
                    <div>Usuários</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="bg-item"
                    id="new-user"
                    onSelect={() => navigate("/dashboard/admin/users/new")}
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
    </header>
  );
}
