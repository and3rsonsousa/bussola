import { ActionFunctionArgs } from "@remix-run/server-runtime";
import { OpenAI } from "openai";

export const config = { runtime: "edge" };

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
  } else if (intent === "carousel") {
    let model = `<h3>SLIDE 1</h3> (use um Gancho forte para chamar a atenção do usuário)
    <h4>Frase do título aqui.</h4> (Frase principal do Carrossel. Deve ser chamativa e apelar para um gatilho mental)
    
    
    <h3>SLIDE 2</h3> (desenvolva o problema e retenha o usuário)
      <h4>Conteúdo do título aqui</h4> (Frase principal do slide com até 15 palavras)
      <p>Conteúdo do Texto aqui</p> (Texto de apoio com até 60 palavras)
      <strong>Observação:</strong> (opcional - Insira algum texto com até 15 palavras apenas quando for necessário reforçar algo.)
      Conteúdo da observação aqui
    

    SLIDE X (de 3 a 8 - desenvolva a proposta única para esse tema.)
    Título (Frase principal do slide com até 15 palavras)
    Texto (Texto de apoio com até 60 palavras)
    Observação (opcional - Insira algum texto com até 15 palavras apenas quando for necessário reforçar algo.)

    SLIDE X (penúltimo) ( Após apresentar a proposta única, crie desejo no usuário.)
    Título (Frase principal do slide com até 15 palavras)
    Texto (Texto de apoio com até 60 palavras)
    Observação (opcional - Insira algum texto com até 15 palavras apenas quando for necessário reforçar algo.)

    SLIDE X (último) ( Finalize com uma chamada para a ação.)
    Título (Frase principal do slide com até 15 palavras)
    Texto (Texto de apoio com até 60 palavras)
    Ação (Insira uma chamada de ação)
    `;
    content = `Você é um estrategista de conteúdo experiente e trabalha principalmente com técnicas de storytelling para envolver o usuário. 
TAREFA: Criar posts em formato carrossel envolventes e que prendam o usuário.
REGRAS: Retorne apenas o texto sem nenhuma sua e formatado com tags HTML. 
MODELO: ${model}
CONTENT: ${title} - ${description}`;
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

  return { message: chatCompletion.choices[0].message.content };
};
