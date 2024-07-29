import { ActionFunctionArgs } from "@remix-run/server-runtime";
import { OpenAI } from "openai";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  let { title, description, intent } = Object.fromEntries(formData.entries());

  const openai = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"],
  });

  intent ||= "caption";

  let content = `Você é um redator experiente. Crie uma legenda para um post com as informações abaixo seguindo o modelo: Texto da legenda e hashtags. REGRAS: Retorne apenas o texto sem nenhuma observação. Texto somente com parágrafos e sem tags html. Título do post: '${title}, descrição: ${description}'`;

  if (intent === "stories") {
    content = `Você é um estrategista de conteúdo experiente. 
    TAREFA: você vai criar uma sequência de stories usando técnicas de storytelling e finalizando sempre com um Stories com um CTA forte.
    REGRA: Retorne apenas o texto sem nenhuma observação. Texto somente com parágrafos e sem tags html. 
    MODELO: 
    [STORIES X]

    Imagem
    Sugestão de imagem/vídeo.
    
    Título
    Frase Principal com até 10 palavras
    
    Texto
    Texto de apoio com até 30 palavras
    CONTEXTO: ${title} - ${description}`;
  }

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content,
      },
    ],
    model: "gpt-4o-mini",
  });

  console.log(chatCompletion.choices[0].message.content);

  return { message: chatCompletion.choices[0].message.content };
};
