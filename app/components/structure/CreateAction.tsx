import { PopoverTrigger } from "@radix-ui/react-popover";
import { useLocation, useMatches, useSubmit } from "@remix-run/react";
import { addHours, format, formatDuration, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2Icon, PlusCircleIcon, PlusIcon } from "lucide-react";
import { SiInstagram } from "@icons-pack/react-simple-icons";
import { act, useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { BASE_COLOR, INTENTS, TIMES } from "~/lib/constants";
import {
  Avatar,
  AvatarGroup,
  getInstagramFeed,
  getPartners,
  Icons,
  isInstagramFeed,
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
import { Input } from "../ui/input";
import { Popover, PopoverContent } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToast } from "../ui/use-toast";

export default function CreateAction({
  date,
  mode,
  shortcut,
}: {
  date?: string;
  mode: "fixed" | "day" | "button" | "plus";
  shortcut?: boolean;
}) {
  const { categories, partners, user, areas } = useMatches()[1]
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
    instagram_date: newDate,
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

  // const state = states.find((state) => state.slug === action.state) as State;

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
    if (
      areas.find(
        (area) =>
          categories.find((category) => category.slug === action.category)
            ?.area === "creative",
      )
    ) {
      setAction({
        ...action,
        responsibles: ["b4f1f8f7-e8bb-4726-8693-76e217472674"],
      });
    } else {
      setAction({
        ...action,
        responsibles: [user.id],
      });
    }
  }, [action.category]);

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
          <Button variant="default" size="icon" className="rounded-full p-2">
            <PlusIcon className="z-10 size-6" />
          </Button>
        ) : (
          <ButtonCNVT className="fixed right-2 bottom-3 rounded-full" rounded>
            <PlusIcon className="z-10 w-8" />
          </ButtonCNVT>
        )}
      </PopoverTrigger>
      <PopoverContent className="glass mr-4 w-[90dvw] shadow-2xl md:max-w-[500px] md:px-6">
        {/* Título */}
        <textarea
          defaultValue={action.title}
          className="text-foreground placeholder:text-muted-foreground mb-1 w-full resize-none bg-transparent text-2xl font-semibold tracking-tighter outline-hidden"
          rows={1}
          onChange={(event) => {
            setAction({ ...action, title: event.target.value });
          }}
          // @ts-ignore
          style={{ fieldSizing: "content" }}
          placeholder="Qual o nome da sua ação?"
        />
        <textarea
          defaultValue={action.description || ""}
          className="font-regular placeholder:text-muted-foreground relative field-sizing-content w-full resize-none bg-transparent text-sm outline-hidden"
          rows={2}
          placeholder="Descreva brevemente a sua ação"
          onChange={(event) => {
            setAction({
              ...action,
              description: event.target.value,
            });
          }}
        />

        <hr className="-mx-4 my-2 border-t p-1 md:-mx-6" />
        <div className="flex flex-col">
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
                        title: partner.title,
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

            {/* Categoria */}
            <DropdownMenu>
              <DropdownMenuTrigger className="button-trigger">
                <Icons id={category.slug} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass">
                {areas.map((area, i) => (
                  <DropdownMenuGroup key={area.id}>
                    {i > 0 && <DropdownMenuSeparator />}
                    <h4 className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase opacity-50">
                      {area.title}
                    </h4>
                    {categories.map((category) =>
                      category.area === area.slug ? (
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
            <StateSelect
              state={action.state}
              onValueChange={(state) => {
                if (state !== action.state) {
                  setAction({
                    ...action,
                    state,
                  });
                }
              }}
            />

            {/* Responsáveis */}
            <ResponsibleForAction
              action={action}
              onCheckedChange={(responsibles) => {
                setAction({ ...action, responsibles });
              }}
            />

            {/* Cor da ação */}
            {getInstagramFeed({ actions: [action] }).length > 0 && partner ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="button-trigger">
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
          <div className="flex w-full items-center justify-between gap-2 overflow-hidden p-1">
            <DateTimeAndInstagramDate
              action={action}
              onChange={({ date, instagram_date, time }) => {
                if (date) setAction({ ...action, date });
                if (instagram_date) setAction({ ...action, instagram_date });
                if (time) setAction({ ...action, time });
              }}
            />

            <Button
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
                      instagram_date: format(
                        action.instagram_date,
                        "y-MM-dd HH:mm:ss",
                        {
                          locale: ptBR,
                        },
                      ),
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
              Criar
              <PlusCircleIcon className="size-4" />
            </Button>
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

export function StateSelect({
  state,
  onValueChange,
}: {
  state: string;
  onValueChange: (state: string) => void;
}) {
  const matches = useMatches();
  const { states } = matches[1].data as DashboardRootType;
  const _state = states.find((s) => s.slug === state) as State;

  return (
    <Select value={state} onValueChange={(value) => onValueChange(value)}>
      <SelectTrigger className={`button-trigger inline-flex w-auto gap-2`}>
        <div
          className={`size-2 rounded-full`}
          style={{ backgroundColor: _state.color }}
        ></div>
        {_state.title}
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
                className={`size-2 rounded-full`}
                style={{ backgroundColor: state.color }}
              ></div>
              <div>{state.title}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ResponsibleForAction({
  size,
  action,
  onCheckedChange,
}: {
  size?: Size;
  action: Action | RawAction;
  onCheckedChange: (responsibles: string[]) => void;
}) {
  const { people } = useMatches()[1].data as DashboardRootType;

  const responsibles: Person[] = [];
  action.responsibles.map((user_id) => {
    const p = people.find((person) => person.user_id === user_id) as Person;
    if (p) responsibles.push(p);
  });
  responsibles.filter((person) => person !== undefined);

  //getResponsibleForArea(action.category);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="button-trigger">
        <AvatarGroup
          size={size}
          avatars={responsibles.map((person) => ({
            item: {
              image: person.image,
              short: person.initials!,
              title: person.name,
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
                alert("É necessário ter pelo menos um responsável pela ação");
                return false;
              }
              const tempResponsibles = checked
                ? [...action.responsibles, person.user_id]
                : action.responsibles.filter((id) => id !== person.user_id);

              onCheckedChange(tempResponsibles);
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
  );
}

export function DateTimeAndInstagramDate({
  action,
  onChange,
}: {
  action: RawAction;
  onChange: ({
    date,
    instagram_date,
    time,
  }: {
    date?: Date;
    instagram_date?: Date;
    time?: number;
  }) => void;
}) {
  return (
    <>
      {/* Data e Hora */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            title={
              action.date
                ? format(
                    action.date,
                    "d/M"
                      .concat(
                        action.date.getFullYear() !== new Date().getFullYear()
                          ? " 'de' y"
                          : "",
                      )
                      .concat(" 'às' H'h'")
                      .concat(action.date.getMinutes() !== 0 ? "m" : ""),
                    { locale: ptBR },
                  ).concat(" por " + formatActionTime(action.time))
                : "Ação sem data"
            }
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 overflow-hidden text-xs focus-visible:ring-offset-0"
          >
            <CheckCircle2Icon className="size-4" />
            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
              {action.date
                ? format(
                    action.date,
                    "d/M"
                      .concat(
                        action.date.getFullYear() !== new Date().getFullYear()
                          ? " 'de' y"
                          : "",
                      )
                      .concat(" 'às' H'h'")
                      .concat(action.date.getMinutes() !== 0 ? "m" : ""),
                    { locale: ptBR },
                  ).concat(" por " + formatActionTime(action.time))
                : "Ação sem data"}
            </div>
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

                  onChange({ date });
                  // if(setRawAction){
                  //   setRawAction({ ...action, date });

                  // }

                  // if(setAction)
                  //   setAction({ ...action, date: format(date, "yyyy-MM") });
                }
              }
            }}
          />
          <div className="mx-auto flex gap-2">
            <div className="flex shrink-0">
              <Input
                value={action.date.getHours().toString()}
                className="border-border w-1/2 rounded-r-none border border-r-0 text-right focus:z-10"
                type="number"
                min={0}
                max={23}
                onChange={(event) => {
                  const date = action.date;
                  date.setHours(Number(event.target.value));
                  // if(setRawAction){
                  //   setRawAction({ ...action, date });

                  // }
                  onChange({ date });
                }}
              />
              <Input
                value={action.date.getMinutes().toString()}
                className="border-border w-1/2 rounded-l-none border border-l-0 text-left"
                type="number"
                min={0}
                max={59}
                onChange={(event) => {
                  const date = action.date;
                  date.setMinutes(Number(event.target.value));
                  // setAction({
                  //   ...action,
                  //   date: date,
                  // });
                  onChange({ date });
                }}
              />
            </div>
            <Select
              value={action.time.toString()}
              onValueChange={(value) => {
                onChange({ time: Number(value) });
                // setAction({ ...action, time: Number(value) });
                // onChange(Number(value));
              }}
            >
              <SelectTrigger className="border-border bg-input w-full border">
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
      {/* Data e Hora do Instagram  */}
      {isInstagramFeed(action.category, true) ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              title={
                action.instagram_date
                  ? format(
                      action.instagram_date,
                      "d/M"
                        .concat(
                          action.instagram_date.getFullYear() !==
                            new Date().getFullYear()
                            ? " 'de' y"
                            : "",
                        )
                        .concat(" 'às' H'h'")
                        .concat(
                          action.instagram_date.getMinutes() !== 0 ? "m" : "",
                        ),
                      { locale: ptBR },
                    )
                  : "Ação não tem data do Instagram"
              }
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 overflow-hidden text-xs focus-visible:ring-offset-0"
            >
              <SiInstagram className="size-4" />
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                {action.instagram_date
                  ? format(
                      action.instagram_date,
                      "d/M"
                        .concat(
                          action.instagram_date.getFullYear() !==
                            new Date().getFullYear()
                            ? " 'de' y"
                            : "",
                        )
                        .concat(" 'às' H'h'")
                        .concat(
                          action.instagram_date.getMinutes() !== 0 ? "m" : "",
                        ),
                      { locale: ptBR },
                    )
                  : "Ação sem data de instagram"}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="glass">
            <Calendar
              mode="single"
              selected={action.instagram_date}
              onSelect={(instagram_date) => {
                if (instagram_date) {
                  if (action.instagram_date) {
                    instagram_date?.setHours(
                      action.instagram_date.getHours(),
                      action.instagram_date.getMinutes(),
                    );
                    // setAction({ ...action, instagram_date });
                    onChange({ instagram_date });
                  }
                }
              }}
            />
            <div className="mx-auto flex gap-2">
              <div className="flex shrink-0">
                <Input
                  value={action.instagram_date.getHours().toString()}
                  className="border-border w-1/2 rounded-r-none border border-r-0 text-right focus:z-10"
                  type="number"
                  min={0}
                  max={23}
                  onChange={(event) => {
                    const instagram_date = action.instagram_date;
                    instagram_date.setHours(Number(event.target.value));
                    // setAction({
                    //   ...action,
                    //   instagram_date,
                    // });
                    onChange({ instagram_date });
                  }}
                />
                <Input
                  value={action.instagram_date.getMinutes().toString()}
                  className="border-border w-1/2 rounded-l-none border border-l-0 text-left"
                  type="number"
                  min={0}
                  max={59}
                  onChange={(event) => {
                    const instagram_date = action.instagram_date;
                    instagram_date.setMinutes(Number(event.target.value));
                    onChange({ instagram_date });
                    // setAction({
                    //   ...action,
                    //   instagram_date,
                    // });
                  }}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </>
  );
}

function getResponsibleForArea(category: string) {
  const { categories, areas, people } = useMatches()[1]
    .data as DashboardRootType;

  const _category = categories.find((c) => c.slug === category);

  invariant(_category, "O valor de category deve estar errado.");

  const _area = areas.find((a) => a.slug === _category.area);

  invariant(
    _area,
    "A área não pode ser encontrada, verifique novamente o valor de category",
  );

  const responsibles = people.filter((person) =>
    person.areas?.find((a) => a === _area.slug),
  );

  return responsibles;
}
