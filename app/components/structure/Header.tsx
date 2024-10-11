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

export default function Header() {
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
    <div
      className={`group fixed bottom-0 left-1/2 z-50 block -translate-x-1/2 pb-6 ${isActionPage ? "translate-y-[90px] transition-transform duration-500 focus-within:translate-y-0 hover:translate-y-0" : ""}`}
    >
      {/* Handle */}
      {isActionPage && (
        <div className="left-1/2 mx-auto mb-4 h-1.5 w-32 rounded-full bg-foreground/15 transition group-hover:opacity-0"></div>
      )}
      <header
        className={`glass z-10 flex items-center justify-between gap-2 rounded-[28px] p-2`}
      >
        {/* Voltar */}
        <Button
          size="icon"
          variant={"ghost"}
          className="-mr-4"
          onClick={() => {
            navigate(-1);
          }}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        {/* Logo */}
        <Link
          to="/dashboard"
          unstable_viewTransition
          className="rounded-lg p-4 outline-none ring-ring ring-offset-background focus:ring-2"
        >
          <Bussola className="md:hidden" size="md" short />
          <Bussola className="hidden md:block" size="xs" />
        </Link>
        {/* Atrasados */}
        {lateActions.length > 0 && (
          <Link
            unstable_viewTransition
            to={`/dashboard/${partner ? partner.slug.concat("/") : ""}late/`}
            className="-ml-2 grid size-5 place-content-center rounded-full bg-error-600 text-xs font-bold text-white"
          >
            {lateActions.length}
          </Link>
        )}

        {/* parceiros         */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={"ghost"}
              className={
                partner ? "rounded-full p-1" : `text-ellipsis whitespace-nowrap`
              }
            >
              {partner ? (
                <div className="relative" tabIndex={-1}>
                  <Avatar
                    item={{
                      bg: partner.colors[0],
                      fg: partner.colors[1],
                      short: partner.short,
                    }}
                    size="md"
                  />
                  <CircularProgress actions={actions} />
                </div>
              ) : (
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

        {/* Revisão e Instagram */}

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

        {/* Botão de criar ação */}

        {/* {!isActionPage && <CreateAction mode="plus" />} */}
        <CreateAction mode="plus" />
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
                  <div className="absolute right-0 top-0">
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
                id="account"
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
      </header>
    </div>
  );
}
