// export const CATEGORIES = {
//   capture: "capture",
//   todo: "todo",
//   post: "post",

//   carousel: "carousel",
//   reels: "reels",
//   stories: "stories",

//   dev: "dev",
//   print: "print",
//   meeting: "meeting",

//   finance: "finance",
//   design: "design",
//   ads: "ads",

//   sm: "sm",
//   plan: "plan",
// };

export const PRIORITIES = {
  low: "low",
  medium: "mid",
  high: "high",
};

export const INTENTS = {
  createAction: "actions-create",
  updateAction: "action-update",
  deleteAction: "action-delete",
  recoverAction: "action-recover",
  destroyAction: "action-destroy",
  setSprint: "sprint-set",
  unsetSprint: "sprint-unset",
  duplicateAction: "action-duplicate",
  updatePerson: "person-update",
  updatePartner: "partner-update",
};

export const BASE_COLOR = "rgba(120,140,150,.2)";

export const SOW = {
  marketing: "marketing",
  socialmedia: "socialmedia",
  demand: "demand",
};

export const TIMES = {
  capture: 60,
  todo: 5,
  post: 10,

  carousel: 30,
  reels: 20,
  stories: 5,

  dev: 30,
  print: 30,
  meeting: 60,

  finance: 5,
  design: 30,
  ads: 15,

  sm: 15,
  plan: 50,
};

export const TRIGGERS = [
  {
    value: "Antecipação",
  },
  {
    value: "Autoridade",
  },
  {
    value: "Comunidade",
  },
  {
    value: "Curiosidade",
  },
  {
    value: "Escassez",
  },
  {
    value: "Esclusividade",
  },
  {
    value: "Humanização",
  },
  {
    value: "Inimigo Comum",
  },
  {
    value: "Novidade",
  },
  {
    value: "Pertencimento",
  },
  {
    value: "Prova Social",
  },

  {
    value: "Reciprocidade",
  },

  {
    value: "Urgência",
  },
];

export const archetypes = [
  {
    name: "Criador",
    voice: [2, 5, 4, 5, 3, 5, 6, 4, 6, 5, 3, 6, 1, 4, 6],
  },
  {
    name: "Prestativo",
    voice: [3, 6, 3, 2, 2, 6, 5, 2, 2, 3, 3, 6, 4, 2, 6],
  },
  {
    name: "Governante",
    voice: [6, 2, 1, 6, 6, 1, 3, 6, 2, 6, 5, 3, 6, 6, 2],
  },
  {
    name: "Bobo da Corte",
    voice: [1, 5, 6, 2, 2, 6, 6, 2, 6, 4, 4, 5, 1, 3, 5],
  },
  {
    name: "Cara Comum",
    voice: [3, 4, 4, 3, 3, 6, 4, 3, 3, 3, 3, 6, 4, 3, 5],
  },
  {
    name: "Amante",
    voice: [2, 6, 5, 2, 3, 6, 6, 3, 4, 6, 4, 5, 3, 3, 6],
  },
  {
    name: "Herói",
    voice: [4, 6, 3, 5, 5, 4, 6, 4, 4, 6, 6, 5, 3, 6, 5],
  },
  {
    name: "Fora da Lei",
    voice: [1, 4, 5, 3, 2, 3, 5, 3, 6, 5, 5, 4, 1, 5, 3],
  },
  {
    name: "Mago",
    voice: [5, 4, 3, 6, 6, 3, 5, 6, 5, 5, 4, 4, 2, 5, 4],
  },
  {
    name: "Inocente",
    voice: [2, 5, 5, 1, 2, 5, 6, 1, 3, 3, 2, 6, 4, 2, 5],
  },
  {
    name: "Explorador",
    voice: [2, 5, 4, 4, 3, 4, 6, 3, 5, 4, 5, 4, 1, 4, 4],
  },
  {
    name: "Sábio",
    voice: [5, 3, 2, 6, 6, 3, 3, 6, 3, 4, 3, 5, 5, 5, 4],
  },
];
