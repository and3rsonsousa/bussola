import {
  Link,
  useFetchers,
  useLocation,
  useMatches,
  useNavigate,
  useNavigation,
  useOutletContext,
} from "@remix-run/react";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  Grid3x3Icon,
  HandshakeIcon,
  HelpCircle,
  LogOutIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
  Users2Icon,
} from "lucide-react";
import { SOW } from "~/lib/constants";
import {
  Avatar,
  Bussola,
  getDelayedActions,
  ReportReview,
} from "~/lib/helpers";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import CreateAction from "./CreateAction";
import Loader from "./Loader";
import { CircularProgress } from "./Progress";
import { ThemeToggle } from "./ThemeToggle";

export default function Header({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const matches = useMatches();
  const navigation = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const fetchers = useFetchers();
  const { showFeed, setShowFeed } = useOutletContext() as ContextType;

  const { partners, person } = matches[1].data as DashboardRootType;
  let { actions, actionsChart, partner } = (
    matches[3] ? matches[3].data : {}
  ) as {
    actions: Action[];
    actionsChart: ActionChart[];
    partner: Partner;
  };

  actionsChart = matches[2].data
    ? (matches[2].data as DashboardIndexType).actionsChart
    : actionsChart;

  partner =
    matches[2].data && !partner
      ? (matches[2].data as { partner: Partner }).partner
      : partner;

  const lateActions = getDelayedActions({ actions: actionsChart });
  const isActionPage = /\/dashboard\/action\//.test(location.pathname);

  return (
    <header
      className={`border-foreground flex items-center justify-between gap-4 border-b-2 px-6 py-4`}
    >
      {/* Voltar */}
      {/* <Button
        size="icon"
        variant={"ghost"}
        className="-mr-4"
        onClick={() => {
          navigate(-1);
        }}
      >
        <ArrowLeftIcon className="size-4" />
      </Button> */}
      {/* Logo */}
      <div className="flex items-center gap-1">
        <Link
          to="/dashboard"
          viewTransition
          className="ring-ring ring-offset-background rounded p-4 outline-hidden focus:ring-2"
        >
          <Bussola className="md:hidden" size="md" short />
          <Bussola className="hidden md:block" size="sm" />
        </Link>
        {/* Atrasados */}
        {lateActions.length > 0 && (
          <Link
            viewTransition
            to={`/dashboard/${partner ? partner.slug.concat("/") : ""}late/`}
            className="-ml-4 grid -translate-y-4 place-content-center rounded bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white"
          >
            {lateActions.length}
          </Link>
        )}
      </div>
      <div className="flex items-center gap-1 md:gap-4">
        {/* Revisão e Instagram */}
        <div className="flex items-center gap-1">
          {partner ? (
            <>
              <ReportReview partner={partner} />
              <Button
                variant={showFeed ? "default" : "ghost"}
                onClick={() => {
                  setShowFeed((value) => !value);
                }}
                size={"icon"}
              >
                <Grid3x3Icon className="size-6" />
              </Button>
            </>
          ) : null}

          {/* Busca Search */}

          <Button
            variant={"ghost"}
            onClick={() => {
              setOpen((value) => !value);
            }}
            size={"icon"}
          >
            <SearchIcon className="size-6" />
          </Button>
        </div>

        {/* Botão de criar ação */}

        <CreateAction mode="plus" shortcut />

        {/* parceiros         */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={"ghost"}
              className={
                partner
                  ? "rounded-full px-4 py-2"
                  : `text-ellipsis whitespace-nowrap`
              }
            >
              {partner ? (
                <>
                  <span className="hidden text-2xl font-bold tracking-tight md:block">
                    {partner.title}
                  </span>
                  <span className="text-lg font-bold tracking-wide uppercase md:hidden">
                    {partner.short}
                  </span>
                </>
              ) : (
                // <div className="relative" tabIndex={-1}>
                //   <Avatar
                //     item={{
                //       bg: partner.colors[0],
                //       fg: partner.colors[1],
                //       short: partner.short,
                //     }}
                //     size="md"
                //   />
                //   <CircularProgress actions={actions} />
                // </div>
                "Parceiros"
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass mr-8">
            <DropdownMenuLabel className="bg-label">
              Consultoria de Marketing
            </DropdownMenuLabel>
            {partners.map(
              (partner) =>
                partner.sow === SOW.marketing && (
                  <DropdownMenuItem
                    className="bg-item"
                    onSelect={() => navigate(`/dashboard/${partner.slug}`)}
                    key={partner.slug}
                    id={partner.slug}
                  >
                    {partner.title}
                  </DropdownMenuItem>
                ),
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="bg-label">
              Social Media
            </DropdownMenuLabel>
            {partners.map(
              (partner) =>
                partner.sow === SOW.socialmedia && (
                  <DropdownMenuItem
                    className="bg-item"
                    onSelect={() => navigate(`/dashboard/${partner.slug}`)}
                    key={partner.slug}
                    id={partner.slug}
                  >
                    {partner.title}
                  </DropdownMenuItem>
                ),
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="bg-label">Demanda</DropdownMenuLabel>
            {partners.map(
              (partner) =>
                partner.sow === SOW.demand && (
                  <DropdownMenuItem
                    className="bg-item"
                    onSelect={() => navigate(`/dashboard/${partner.slug}`)}
                    key={partner.slug}
                    id={partner.slug}
                  >
                    {partner.title}
                  </DropdownMenuItem>
                ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* menu de ações */}
        {person && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="relative rounded-full p-1" variant={"ghost"}>
                <Avatar
                  size="md"
                  item={{
                    image: person.image,
                    short: person.initials!,
                  }}
                />
                {(navigation.state !== "idle" ||
                  fetchers.filter((f) => f.formData).length > 0) && (
                  <div className="absolute top-0 right-0">
                    <Loader size="lgs" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="glass">
              <ThemeToggle
                element="dropdownmenuitem"
                className="bg-item"
                hasText
              />

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="bg-item"
                id="archived"
                onSelect={() => navigate(`/dashboard/me`)}
              >
                <UserIcon className="size-4 opacity-50" />
                <div>Minha conta</div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="bg-item"
                id="archived"
                onSelect={() =>
                  navigate(
                    `/dashboard/${partner ? partner.slug.concat("/") : ""}archived`,
                  )
                }
              >
                <ArchiveIcon className="size-4 opacity-50" />
                <div>Arquivados</div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="bg-item"
                id="help"
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
                  <DropdownMenuSeparator />
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

                  <DropdownMenuSeparator />
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
