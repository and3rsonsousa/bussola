import { PopoverTrigger } from "@radix-ui/react-popover";
import { useLocation, useMatches, useSubmit } from "@remix-run/react";
import {
  format,
  formatDistance,
  formatDuration,
  isToday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BASE_COLOR, INTENTS, TIMES } from "~/lib/constants";
import {
  Avatar,
  AvatarGroup,
  getInstagramFeed,
  getPartners,
  Icons,
} from "~/lib/helpers";
import ButtonCNVT from "../structure/Button";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToast } from "../ui/use-toast";
import { Input } from "../ui/input";
import colors from "tailwindcss/colors";

export default function CreateAction({
  date,
  mode,
  shortcut,
}: {
  date?: string;
  mode: "fixed" | "day" | "button" | "plus";
  shortcut?: boolean;
}) {
  const { categories, states, partners, people, user, areas } = useMatches()[1]
    .data as DashboardRootType;
  const matches = useMatches()[3];
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const submit = useSubmit();
  const { toast } = useToast();

  const newDate = date ? parseISO(date) : new Date();

  if (isToday(newDate) && new Date().getHours() >= 11) {
    newDate.setHours(new Date().getHours() + 1, new Date().getMinutes());
  } else {
    newDate.setHours(11, 0);
  }

  let [partner, setPartner] = useState(
    matches && matches.data
      ? (matches.data as DashboardPartnerType).partner
      : undefined,
  );

  let rand = partner ? Math.floor(Math.random() * partner.colors.length) : 0;
  rand = rand === 1 ? 0 : rand;

  const cleanAction: RawAction = {
    category: "post",
    partner: partner ? partner.slug : undefined,
    date: newDate,
    description: "",
    responsibles: [user.id],
    partners: partner ? [partner.slug] : [],
    state: "idea",
    title: "",
    user_id: user.id,
    color: partner ? partner.colors[rand] : BASE_COLOR,
    time: TIMES.post,
  };

  const [action, setAction] = useState<RawAction>(cleanAction);

  const category = categories.find(
    (category) => category.slug === action.category,
  ) as Category;

  const state = states.find((state) => state.slug === action.state) as State;
  const responsibles: Person[] = [];
  action.responsibles.filter((user_id) =>
    responsibles.push(
      people.find((person) => person.user_id === user_id) as Person,
    ),
  );

  const actionPartners = getPartners(action.partners);

  useEffect(() => {
    if (action.partner) {
      const newPartner = partners.find((p) => p.slug === action.partner);
      if (newPartner) {
        setPartner(newPartner);
        setAction({ ...action, color: newPartner.colors[rand] });
      }
    }
  }, [action.partner]);

  useEffect(() => {
    setPartner(() =>
      matches && matches.data
        ? (matches.data as DashboardPartnerType).partner
        : undefined,
    );
  }, [location]);

  useEffect(() => {
    if (open) {
      setAction(cleanAction);
    }
  }, [open]);

  useEffect(() => {
    if (shortcut) {
      const keyDown = (event: KeyboardEvent) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.shiftKey &&
          event.key === "a"
        ) {
          event.preventDefault();
          setOpen((open) => !open);
        }
      };

      document.addEventListener("keydown", keyDown);
      return () => document.removeEventListener("keydown", keyDown);
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {mode === "day" ? (
          <Button size={"sm"} variant={"secondary"} className="h-6 w-6 p-0">
            <PlusIcon className="size-3" />
          </Button>
        ) : mode === "button" ? (
          <Button>
            Criar uma nova ação
            <PlusIcon className="ml-2 w-8" />
          </Button>
        ) : mode === "plus" ? (
          <ButtonCNVT className="rounded-full p-2" rounded>
            <PlusIcon className="z-10 size-6" />
          </ButtonCNVT>
        ) : (
          <ButtonCNVT className="fixed bottom-3 right-2 rounded-full" rounded>
            <PlusIcon className="z-10 w-8" />
          </ButtonCNVT>
        )}
      </PopoverTrigger>
      <PopoverContent className="mr-4 w-[90dvw] bg-background shadow-2xl md:max-w-[500px] md:px-6">
        {/* Título */}
        <textarea
          defaultValue={action.title}
          className="mb-1 w-full resize-none bg-transparent text-2xl font-semibold tracking-tighter text-foreground outline-none placeholder:text-muted-foreground"
          rows={1}
          onChange={(event) => {
            setAction({ ...action, title: event.target.value });
          }}
          // @ts-ignore
          style={{ fieldSizing: "content" }}
          placeholder="Qual o nome da sua ação?"
        />
        <textarea
          defaultValue={action.description}
          className="font-regular relative w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          rows={2}
          placeholder="Descreva brevemente a sua ação"
          onChange={(event) => {
            setAction({
              ...action,
              description: event.target.value,
            });
          }}
          // @ts-ignore
          style={{ fieldSizing: "content" }}
        />

        <hr className="-mx-4 mb-4 mt-2 border-t md:-mx-6" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* Partners */}
            <DropdownMenu>
              <DropdownMenuTrigger className="button-trigger">
                {action.partners?.length > 0 ? (
                  <AvatarGroup
                    avatars={actionPartners.map((partner) => ({
                      item: {
                        short: partner.short,
                        bg: partner.colors[0],
                        fg: partner.colors[1],
                      },
                    }))}
                  />
                ) : (
                  "Parceiros"
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass">
                {partners.map((partner) => (
                  <DropdownMenuCheckboxItem
                    key={partner.id}
                    checked={action.partners.includes(partner.slug)}
                    className="bg-select-item"
                    onCheckedChange={(checked) => {
                      const tempPartners = checked
                        ? [...action.partners, partner.slug]
                        : action.partners.filter((p) => p !== partner.slug);

                      setAction({
                        ...action,
                        partners: tempPartners,
                      });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        item={{
                          short: partner.short,
                          bg: partner.colors[0],
                          fg: partner.colors[1],
                        }}
                      />
                      <div>{partner.title}</div>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* <Select
              value={action.partner}
              onValueChange={(value) => {
                setAction({
                  ...action,
                  partner: value,
                });
              }}
            >
              <SelectTrigger
                className={`w-auto focus:ring-offset-0 ${
                  action.partner ? "-ml-1 p-1 pl-2" : "px-2 py-1"
                }`}
              >
                {action.partner ? (
                  <Avatar
                    item={(() => {
                      let partner = partners.find(
                        (p) => p.slug === action.partner,
                      ) as Partner;
                      return {
                        short: partner.short,
                        bg: partner.colors[0],
                        fg: partner.colors[1],
                      };
                    })()}
                  />
                ) : (
                  "Parceiros"
                )}
              </SelectTrigger>
              <SelectContent className="glass">
                {partners.map((partner) => (
                  <SelectItem
                    key={partner.slug}
                    value={`${partner.slug}`}
                    className="bg-select-item"
                  >
                    {partner.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}

            {/* Categoria */}
            <DropdownMenu>
              <DropdownMenuTrigger className="button-trigger">
                <Icons id={category.slug} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass">
                {areas.map((area, i) => (
                  <DropdownMenuGroup key={area.id}>
                    {i > 0 && <DropdownMenuSeparator />}
                    <h4 className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider opacity-50">
                      {area.title}
                    </h4>
                    {categories.map((category) =>
                      category.area_id === area.id ? (
                        <DropdownMenuItem
                          key={category.slug}
                          className="bg-item flex items-center gap-2"
                          onSelect={async () => {
                            if (category.slug !== action.category) {
                              setAction({
                                ...action,
                                category: category.slug,
                                time: (TIMES as any)[category.slug],
                              });
                            }
                          }}
                        >
                          <Icons
                            id={category.slug}
                            className={`size-4 opacity-50`}
                          />
                          <span>{category.title}</span>
                        </DropdownMenuItem>
                      ) : null,
                    )}
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* States */}
            <Select
              value={action.state.toString()}
              onValueChange={(value) =>
                setAction({
                  ...action,
                  state: value,
                })
              }
            >
              <SelectTrigger
                className={`h-7 w-auto rounded border-2 text-xs font-bold ring-offset-1`}
                style={{ borderColor: state.color }}
              >
                {state.title}
              </SelectTrigger>
              <SelectContent className="glass">
                {states.map((state) => (
                  <SelectItem
                    value={state.slug.toString()}
                    key={state.slug}
                    className="bg-select-item"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full`}
                        style={{ borderLeftColor: state.color }}
                      ></div>
                      <div>{state.title}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Responsáveis */}
            <DropdownMenu>
              <DropdownMenuTrigger className="button-trigger">
                <AvatarGroup
                  avatars={responsibles.map((person) => ({
                    item: {
                      image: person.image,
                      short: person.initials!,
                    },
                  }))}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass">
                {people.map((person) => (
                  <DropdownMenuCheckboxItem
                    key={person.id}
                    className="bg-select-item"
                    checked={action.responsibles.includes(person.user_id)}
                    onCheckedChange={(checked) => {
                      if (!checked && action.responsibles.length < 2) {
                        alert(
                          "É necessário ter pelo menos um responsável pela ação",
                        );
                        return false;
                      }
                      const tempResponsibles = checked
                        ? [...action.responsibles, person.user_id]
                        : action.responsibles.filter(
                            (id) => id !== person.user_id,
                          );

                      setAction({
                        ...action,
                        responsibles: tempResponsibles,
                      });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        item={{
                          image: person.image,
                          short: person.initials!,
                        }}
                      />
                      <div>{person.name}</div>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cor da ação */}
            {getInstagramFeed({ actions: [action] }).length > 0 && partner ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded outline-none ring-primary ring-offset-4 ring-offset-background focus-within:ring-2">
                  <div
                    className="size-8 rounded"
                    style={{
                      backgroundColor: action.color,
                    }}
                  ></div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass">
                  {partner.colors.map(
                    (color, i) =>
                      i !== 1 && (
                        <DropdownMenuItem
                          key={i}
                          onSelect={() => {
                            setAction({ ...action, color });
                          }}
                        >
                          <div
                            className="h-4 w-full rounded-[4px]"
                            style={{ backgroundColor: color }}
                          ></div>
                        </DropdownMenuItem>
                      ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            {/* Data e Hora */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs focus-visible:ring-offset-0"
                >
                  {action.date
                    ? format(
                        action.date,
                        "d/M"
                          .concat(
                            action.date.getFullYear() !==
                              new Date().getFullYear()
                              ? " 'de' y"
                              : "",
                          )
                          .concat(" 'às' H'h'")
                          .concat(action.date.getMinutes() !== 0 ? "m" : ""),
                        { locale: ptBR },
                      ).concat(" por " + formatActionTime(action.time))
                    : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="glass">
                <Calendar
                  mode="single"
                  selected={action.date}
                  onSelect={(date) => {
                    if (date) {
                      if (action.date) {
                        date?.setHours(
                          action.date.getHours(),
                          action.date.getMinutes(),
                        );
                        setAction({ ...action, date });
                      }
                    }
                  }}
                />
                <div className="mx-auto flex gap-2">
                  <div className="flex shrink-0">
                    <Input
                      value={action.date.getHours().toString()}
                      className="w-1/2 rounded-r-none border border-r-0 border-border text-right focus:z-10"
                      type="number"
                      min={0}
                      max={23}
                      onChange={(event) => {
                        const date = action.date;
                        date.setHours(Number(event.target.value));
                        setAction({
                          ...action,
                          date: date,
                        });
                      }}
                    />
                    <Input
                      value={action.date.getMinutes().toString()}
                      className="w-1/2 rounded-l-none border border-l-0 border-border text-left"
                      type="number"
                      min={0}
                      max={59}
                      onChange={(event) => {
                        const date = action.date;
                        date.setMinutes(Number(event.target.value));
                        setAction({
                          ...action,
                          date: date,
                        });
                      }}
                    />
                    {/* <Select
                    value={
                      action.date ? action.date.getHours().toString() : "11"
                    }
                    onValueChange={(value) => {
                      if (action.date) {
                        const date = action.date;
                        date.setHours(Number(value));
                        setAction({
                          ...action,
                          date: date,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-1/4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array(24)
                        .fill(0)
                        .map((i, j) => {
                          return (
                            <SelectItem value={j.toString()} key={j}>
                              {j.toString()}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select> */}
                    {/* <Select
                    value={
                      action.date ? action.date.getMinutes().toString() : "12"
                    }
                    onValueChange={(value) => {
                      if (action.date) {
                        const date = action.date;
                        date.setMinutes(Number(value));
                        setAction({
                          ...action,
                          date: date,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-1/4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array(60)
                        .fill(0)
                        .map((i, j) => {
                          return (
                            <SelectItem value={j.toString()} key={j}>
                              {j.toString()}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select> */}
                  </div>
                  <Select
                    value={action.time.toString()}
                    onValueChange={(value) => {
                      setAction({ ...action, time: Number(value) });
                    }}
                  >
                    <SelectTrigger className="w-full border border-border bg-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((i) => (
                        <SelectItem value={i.toString()} key={i}>
                          {formatActionTime(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>

            <button
              className="relative flex items-center gap-2 rounded bg-gradient-to-b from-white via-black to-white/30 px-4 py-3 text-white outline-none ring-primary ring-offset-4 ring-offset-background focus:ring-2"
              onClick={() => {
                if (action.title.length === 0) {
                  toast({
                    variant: "destructive",
                    title: "O título não pode ser em vazio.",
                    description:
                      "Defina um título para a sua ação antes de criar.",
                  });
                  return false;
                }
                if (!action.date) {
                  toast({
                    variant: "destructive",
                    title: "Escolha a data da ação",
                    description: "Defina a data que a sua ação deve acontecer.",
                  });
                  return false;
                }
                if (action.partners.length === 0) {
                  toast({
                    variant: "destructive",
                    title: "Ação sem nenhum Parceiro.",
                    description:
                      "Selecione pelo menos um Parceiro para essa ação.",
                  });
                } else {
                  submit(
                    {
                      id: window.crypto.randomUUID(),
                      intent: INTENTS.createAction,
                      ...action,
                      date: format(action.date, "y-MM-dd HH:mm:ss", {
                        locale: ptBR,
                      }),
                      created_at: format(Date.now(), "y-MM-dd HH:mm:ss", {
                        locale: ptBR,
                      }),
                      updated_at: format(Date.now(), "y-MM-dd HH:mm:ss", {
                        locale: ptBR,
                      }),
                    },
                    {
                      action: "/handle-actions",
                      navigate: false,
                      method: "POST",
                    },
                  );
                  setAction(cleanAction);
                  setOpen(false);
                }
              }}
            >
              <div className="absolute inset-[1px] z-0 rounded bg-gradient-to-b from-[#444] via-black to-black" />
              <div className="z-10">Criar</div>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function formatActionTime(i: number) {
  return formatDuration(
    {
      minutes: i < 60 ? i : i % 60,
      hours: i >= 60 ? Math.floor(i / 60) : 0,
    },
    { locale: ptBR, delimiter: " e " },
  );
}
