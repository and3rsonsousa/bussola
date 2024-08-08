import { PopoverTrigger } from "@radix-ui/react-popover";
import { useMatches, useSubmit } from "@remix-run/react";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CATEGORIES, INTENTS, STATES } from "~/lib/constants";
import { Avatar, Icons } from "~/lib/helpers";
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

export default function CreateAction({
  date,
  mode,
}: {
  date?: Date;
  mode: "fixed" | "day" | "button" | "plus";
}) {
  const { categories, states, partners, people, user, areas } = useMatches()[1]
    .data as DashboardDataType;
  const match3 = useMatches()[3];

  let partner =
    match3 && match3.data
      ? (match3.data as DashboardPartnerType).partner
      : undefined;

  const [open, setOpen] = useState(false);
  const submit = useSubmit();
  const { toast } = useToast();

  const newDate = date || new Date();

  if (isToday(newDate) && new Date().getHours() >= 11) {
    newDate.setHours(new Date().getHours() + 1, new Date().getMinutes());
  } else {
    newDate.setHours(11, 0);
  }

  const cleanAction = {
    category_id: CATEGORIES.post,
    partner_id: partner ? partner.id : undefined,
    date: newDate,
    description: "",
    responsibles: [user.id],
    state_id: STATES.ideia,
    title: "",
    user_id: user.id,
  };

  const [action, setAction] = useState<RawAction>(cleanAction);

  const category = categories.find(
    (category) => category.id === action.category_id,
  ) as Category;
  const state = states.find((state) => state.id === action.state_id) as State;
  const responsibles: Person[] = [];
  action.responsibles.filter((user_id) =>
    responsibles.push(
      people.find((person) => person.user_id === user_id) as Person,
    ),
  );

  useEffect(() => {
    if (open) {
      setAction(cleanAction);
    }
  }, [open]);

  useEffect(() => {
    if (mode === "fixed") {
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
  }, [mode]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {mode === "day" ? (
          <Button size={"sm"} variant={"accent"} className="h-6 w-6 p-0">
            <PlusIcon className="size-3" />
          </Button>
        ) : mode === "button" ? (
          <Button>
            Criar uma nova ação
            <PlusIcon className="ml-2 w-8" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-2 right-2 rounded-full"
          >
            <PlusIcon className="w-8" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="bg-content mr-4 w-[90dvw] md:max-w-[500px] md:px-6">
        {/* <pre className="text-xs">
					{JSON.stringify(cleanAction.date, undefined, 2)}
				</pre>
				<pre className="text-xs">
					{JSON.stringify(action.date, undefined, 2)}
				</pre> */}

        {/* Título */}
        <div
          className="mb-1 w-full bg-transparent text-2xl font-bold tracking-tighter outline-none placeholder:text-muted"
          onBlur={(e) =>
            setAction({
              ...action,
              title: e.currentTarget.innerText,
            })
          }
          data-placeholder="Título"
          contentEditable="true"
          // suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: action.title }}
          tabIndex={0}
          role="textbox"
          onPaste={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setAction({
              ...action,
              title: e.clipboardData.getData("text"),
            });
          }}
        ></div>
        {/* Descrição */}
        <div
          contentEditable="true"
          className="relative w-full bg-transparent py-2 text-sm font-light outline-none"
          onBlur={(e) =>
            setAction({
              ...action,
              description: e.currentTarget.innerText,
            })
          }
          data-placeholder="Descrição da ação"
          dangerouslySetInnerHTML={{ __html: action.description }}
          onPaste={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setAction({
              ...action,
              description: e.clipboardData.getData("text"),
            });
          }}
        ></div>
        <hr className="-mx-4 mb-4 mt-2 border-gray-300/20 md:-mx-6" />
        <div className="flex flex-wrap justify-center gap-2 md:flex-nowrap md:justify-between">
          <div className="flex w-full items-center justify-between gap-2">
            {/* Partners */}
            {/* {JSON.stringify(partner)} */}
            <Select
              value={action.partner_id}
              onValueChange={(value) => {
                setAction({
                  ...action,
                  partner_id: value,
                });
              }}
            >
              <SelectTrigger
                className={`border-none bg-transparent focus:ring-offset-0 ${
                  action.partner_id ? "-ml-1 p-1 pl-2" : "px-2 py-1"
                }`}
              >
                {action.partner_id ? (
                  <Avatar
                    item={(() => {
                      let p = partners.find(
                        (partner) => partner.id === action.partner_id,
                      ) as Partner;
                      return {
                        short: p.short,
                        bg: p.bg,
                        fg: p.fg,
                      };
                    })()}
                  />
                ) : (
                  "Cliente"
                )}
              </SelectTrigger>
              <SelectContent className="bg-content">
                {partners.map((partner) => (
                  <SelectItem
                    key={partner.id}
                    value={partner.id.toString()}
                    className="bg-select-item"
                  >
                    {partner.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Categoria */}

            <DropdownMenu>
              <DropdownMenuTrigger className="rounded border-none p-2 outline-none ring-ring ring-offset-2 ring-offset-background hover:bg-secondary focus:ring-2">
                <Icons id={category.slug} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-content">
                {areas.map((area, i) => (
                  <DropdownMenuGroup key={area.id}>
                    {i > 0 && <DropdownMenuSeparator />}
                    <h4 className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider opacity-50">
                      {area.title}
                    </h4>
                    {categories.map((category) =>
                      category.area_id === area.id ? (
                        <DropdownMenuItem
                          key={category.id}
                          className="bg-item flex items-center gap-2"
                          onSelect={async () => {
                            if (category.id !== action.category_id) {
                              setAction({
                                ...action,
                                category_id: category.id,
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

            {/* <Select
              value={action.category_id.toString()}
              onValueChange={(value) =>
                setAction({
                  ...action,
                  category_id: value,
                })
              }
            >
              <SelectTrigger
                className={`border-none bg-transparent focus:ring-offset-0`}
              >
                <Icons id={category.slug} className="w-4" />
              </SelectTrigger>
              <SelectContent className="bg-content">
                {categories.map((category) => (
                  <SelectItem
                    value={category.id.toString()}
                    key={category.id}
                    className="bg-select-item"
                  >
                    <div className="flex items-center gap-2">
                      <Icons id={category.slug} className="h-4 w-4" />
                      <span>{category.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            {/* States */}
            <Select
              value={action.state_id.toString()}
              onValueChange={(value) =>
                setAction({
                  ...action,
                  state_id: value,
                })
              }
            >
              <SelectTrigger
                className={`rounded font-bold text-white ring-offset-1 bg-${state.slug} h-8`}
              >
                {state.title}
              </SelectTrigger>
              <SelectContent className="bg-content">
                {states.map((state) => (
                  <SelectItem
                    value={state.id.toString()}
                    key={state.id}
                    className="bg-select-item"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full border-2 border-${state.slug}`}
                      ></div>
                      <div>{state.title}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Responsáveis */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex rounded-md border-none p-2 pl-2 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  tabIndex={0}
                >
                  {responsibles.map((person) => (
                    <Avatar
                      item={{
                        image: person.image,
                        short: person.initials!,
                      }}
                      key={person.id}
                    />
                  ))}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-content">
                {people.map((person) => (
                  <DropdownMenuCheckboxItem
                    key={person.id}
                    className="bg-select-item"
                    checked={action.responsibles.includes(person.user_id)}
                    onCheckedChange={(checked) => {
                      if (!checked && action.responsibles.length < 2) {
                        alert(
                          "É necessário ter pelo menos um responsável pala ação",
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
                      )
                    : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-content">
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
                <div className="mx-auto flex w-40 gap-2">
                  <Select
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
                    <SelectTrigger>
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
                  </Select>
                  <Select
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
                    <SelectTrigger>
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
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant={"default"}
              onClick={() => {
                if (action.title.length === 0) {
                  toast({
                    variant: "destructive",
                    description: "O título não pode ser em vazio.",
                  });
                  return false;
                }
                if (!action.date) {
                  toast({
                    variant: "destructive",
                    description: "Escolha a data da ação",
                  });
                  return false;
                }
                if (!action.partner_id) {
                  toast({
                    variant: "destructive",
                    description: "Selecione o Parceiro dessa ação.",
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
              Criar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
