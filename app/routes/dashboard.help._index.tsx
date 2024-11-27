import type { MetaFunction } from "@vercel/remix";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const config = { runtime: "edge" };

export const meta: MetaFunction = () => {
  return [
    { title: "ʙússoʟa - Domine, Crie e Conquiste." },
    {
      name: "description",
      content:
        "Aplicativo de Gestão de Projetos Criado e Mantido pela Agência Canivete. ",
    },
  ];
};

export const loader = () => {
  return {};
};

export default function Index() {
  const news = [
    {
      date: "2024-09-08 00:00:00",
      title: "Sistema",
      description:
        "O cabeçalho do sistema agora é flutuante e fica invisível de acordo com a página, o que traz mais foco no que realmente importa: o conteúdo de cada página.",
      image: null,
    },
    {
      date: "2024-08-25 00:00:00",
      title: "Página dos parceiros",
      description:
        "A página dos parceiros ganhou atalhos para agilizar os processos de conferência e ajustar as ações.",
      image: null,
    },
    {
      date: "2024-08-15 00:00:00",
      title: "Página de ajuda online",
      description:
        "A página de ajuda com as novidades do sistema e os atalhos disponíveis está disponível.",
      image: null,
    },
    {
      date: "2024-08-15 00:00:00",
      title: "Temas definidos por padrão",
      description:
        "Agora, quando atualizar o tema de sua preferência na parte superior direta do app, ele será sincronizado com a sua conta.",
      image: null,
    },
  ];

  const areas = [
    {
      title: "Geral",
      description: "Pode ser realizada a qualquer momento.",
      shortcuts: [
        {
          title: "Home page ⭐︎",
          description: "Volta para a página inicial.",
          shortcut: "⇧ + H",
        },
        {
          title: "Busca Global",
          description: "Abre a barra de pesquisa.",
          shortcut: "⌘ + K",
        },
        {
          title: "Nova ação",
          description:
            "Abre a barra no canto inferio direito para criar uma nova ação seguindo os itens padrões.",
          shortcut: "⌘ + ⇧ + A",
        },
      ],
    },
    {
      title: "Parceiro",
      description: "Pode ser quando está na página do parceiro.",
      shortcuts: [
        {
          title: "Conteúdo/Lista",
          description:
            "Alterna entre mostrar ou não o conteúdo de postagens do instagram.",
          shortcut: "⇧ + ⌥ + C",
        },
        {
          title: "Responsáveis",
          description: "Mostrar ou ocultar todos os resposáveis das ações.",
          shortcut: "⇧ + ⌥ + R",
        },
        {
          title: "Comprimir ação",
          description: "Diminuir a altura da ação.",
          shortcut: "⇧ + ⌥ + S",
        },
        {
          title: "Feed do Instagram",
          description: "Exibir o Feed do Instagram ao lado do calendário.",
          shortcut: "⇧ + ⌥ + I",
        },
      ],
    },
    {
      title: "Ação",
      description: `É necessário que o ponteiro do mouse esteja sobre a ação.`,
      shortcuts: [
        {
          title: "Editar",
          description: "Leva à página de edição da ação.",
          shortcut: "⇧ + E",
        },
        {
          title: "Duplicar",
          description: "Duplica a ação.",
          shortcut: "⇧ + D",
        },
        {
          title: "Excluir",
          description: "Exclui a ação.",
          shortcut: "⇧ + X",
        },
        {
          title: "Adiar em 1 hora",
          description:
            "Adia a ação em 1 hora. Caso esteja em atraso, conta a partir do horário atual.",
          shortcut: "⇧ + 1",
        },
        {
          title: "Adiar em 2 horas",
          description:
            "Adia a ação em 2 horas. Caso esteja em atraso, conta a partir do horário atual.",
          shortcut: "⇧ + 2",
        },
        {
          title: "Adiar em 3 horas",
          description:
            "Adia a ação em 3 horas. Caso esteja em atraso, conta a partir do horário atual.",
          shortcut: "⇧ + 3",
        },
      ],
    },
  ];

  return (
    <div className="scrollbars">
      <div className="container mx-auto mt-16 max-w-xl px-8 pb-16">
        <div className="mb-16">
          <h2 className="text-4xl font-bold tracking-tighter">Atalhos</h2>
          <div className="mb-4 text-sm opacity-50">
            Atalhos de teclado ao usar ações
          </div>
          <div className="space-y-8">
            {areas.map((area, i) => (
              <div key={i}>
                <div className="mb-2 flex justify-between gap-8 text-right">
                  <div className="text-lg font-bold tracking-wider uppercase">
                    {area.title}
                  </div>
                  <div className="mb-4 text-xs opacity-50">
                    {area.description}
                  </div>
                </div>
                {area.shortcuts.map((s, i) => (
                  <div
                    key={i}
                    className="mb-2 grid grid-cols-4 items-center gap-2"
                  >
                    <div className="overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap">
                      {s.title}
                    </div>
                    <div className="col-span-2 overflow-hidden text-sm opacity-75">
                      {s.description}
                    </div>
                    <div className="text-right text-sm font-bold">
                      {s.shortcut}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-4xl font-bold tracking-tighter">Novidades</h2>
          <div className="mb-4 text-sm opacity-50">
            Novidades e atualizações de ferramentas do sistema.
          </div>

          <div className="space-y-8">
            {news.map((n, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="text-sm opacity-50">
                  {format(new Date(n.date), "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </div>
                <div className="text-xl font-semibold">{n.title}</div>
                {n.image && (
                  <div>
                    <img src={n.image} title={n.title} />
                  </div>
                )}
                <div>{n.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
