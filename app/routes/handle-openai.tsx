import { ActionFunctionArgs } from "@remix-run/server-runtime";
import { OpenAI } from "openai";

export const config = { runtime: "edge" };

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  let { title, description, intent, model, context, trigger } =
    Object.fromEntries(formData.entries());

  const openai = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"],
  });

  if (!intent) {
    return { message: "Defina a sua intenção nesse comando." };
  }

  let template = "";
  let content = "";
  trigger = trigger || "Comunidade";

  // Se for legenda
  if (intent === "shrink") {
    content = `Reduza o TEXTO em 25% sem alterar o sentido ou mudar o tom de voz. TEXTO: ${description}.`;
  } else if (intent === "expand") {
    content = `Aumente o TEXTO em 25% sem alterar o sentido ou mudar o tom de voz. TEXTO: ${description}.`;
  } else if (intent === "develop") {
    content = `Você é um estrategista de marketing com anos de experiência em todas as àreas estratégicas de mercado e de conteúdo para redes sociais. Sua missão é desenvolver o CONTEXTO de acordo com o que for pedido, se for extratégia de marketing, faça da melhor forma a fom de alcançar os objetivos da empresa, se for conteúdo de redes sociais, desenvolva o melhor conteúdo.  
    REGRAS: Retorne apenas o texto sem nenhuma observação. Texto com parágrafos e tags html. Retorne apenas uma frase sem aspas. Traga o texto com no máximo 300 palavras. 
    EMPRESA: ${context}.
    CONTEXTO: Título da ação: '${title}, descrição: ${description}'`;
  } else if (intent === "caption") {
    template = "Texto da legenda e hashtags";

    if (model === "aida") {
      template = `Texto da legenda seguindo o modelo AIDA bem criativo, usando técnicas de Storytelling e reforçando o CONTEXTO. Use as keywords relevantes ao CONTEXTO e encerre a legenda com 5 hashtags. Siga esse modelo de AIDA: Atenção - Use emojis, perguntas diretas ou estatísticas chocantes Interesse - Faça o público se identificar com o problema ou a situação Desejo - Gere expectativa sobre a solução. Ação - Finalize com um convite claro e uma CTA estratégica.`;
    } else if (model === "slap") {
      template = `Texto da legenda seguindo o modelo SLAP bem criativo, usando técnicas de Storytelling e reforçando o CONTEXTO. Use as keywords relevantes ao CONTEXTO e encerre a legenda com 5 hashtags. Siga esse modelo de SLAP: Stop - Uma frase impactante ou provocativa para interromper o "scroll" do usuário. Look - Explique o problema de forma que o público se identifique. Act - Mostre uma ação específica que o público pode tomar para resolver o problema. Purchase - Finalize com uma chamada para a ação clara e forte.`;
    } else if (model === "pas") {
      template = `Texto da legenda seguindo o modelo PAS bem criativo, usando técnicas de Storytelling e reforçando o CONTEXTO. Use as keywords relevantes ao CONTEXTO e encerre a legenda com 5 hashtags. Siga esse modelo de PAS: Problem - Introduza o problema de forma direta, para que o público se identifique rapidamente. Agitate - Aprofunde a dor, fazendo com que o público sinta a necessidade urgente de resolver o problema. Solution - Mostre como você pode resolver esse problema com uma solução clara e atrativa. CTA - Finalize com um convite claro para agir.`;
    } else if (model === "short") {
      template =
        "Texto da legenda com até 200 caracteres bem criativo e reforçando o CONTEXTO e com um CTA no final. Caso não haja nenhuma especificação no CONTEXTO, indique a pessoa a ir ao link da bio de modo que concorde com o CONTEXTO.";
    } else if (model === "medium") {
      template =
        "Texto da legenda com até 400 caracteres usando o CONTEXTO como base, pode ter cunho explicativo ou de reforço. Use de 2 a 3 parágrafos curtos. Finalize com as hashtags e keywords relevantes ao CONTEXTO.";
    } else if (model === "long") {
      template = `Texto da legenda explicando o CONTEXTO com até 800 caracteres. Ainda que mais explicativa, o texto não pode ser cansativo e deve ser dinâmico. Cada parágrafo não deve ter mais de 30 palavras depois disso, crie novos parágrafos para manter o texto mais dinâmico. Importante separar bem a explicação Nesses parágrafos:
    1 - Reforce o problema apresentado do CONTEXTO em 120 caracteres.
    2 - Comece a problematizar o assunto ao jogar o contexto para o usuário gerando conexão em 120 caracteres. 
    3 - Aqui você usar uma lista de itens com emojis para facilitar a leitura apresentando os problemas que o usuário enfrenta, reforçando o parágrafo 2.
    4 - Apresente a solução do problema de acordo com o CONTEXTO.
    5 - Conclua com um CTA do CONTEXTO, se não houver indicação, peça para o usuário ir ao link da bio de uma forma mais criativa do que "agende/peça pelo link da bio.
    6 - Finalize a legenda com as principais hashtags e keywords relacionadas ao CONTEXTO."
    `;
    }

    content = `Você é um redator experiente. Crie uma legenda para uma postagem no instagram seguindo o CONTEXTO e levando em conta a descrição da empresa. Use o gatilho mental da: ${trigger}. 
    
  REGRAS: Retorne apenas o texto sem nenhuma observação. Texto somente com parágrafos e sem tags html. 
  TEMPLATE: ${template}.
  EMPRESA: ${context}.
  CONTEXTO: Título do post: '${title}, descrição: ${description}'`;
  }
  // Se for Stories
  else if (intent === "stories") {
    if (model === "static") {
      content = `Você é um estrategista de conteúdo experiente. 
    TAREFA: você vai criar uma sequência de stories usando técnicas de storytelling e finalizando sempre com um Stories com um CTA forte levando em conta o CONTEXTO e a descrição da EMPRESA.
    REGRA: Retorne apenas o texto sem nenhuma observação. Texto somente com parágrafos e sem tags html. 
    MODELO: 
    [STORIES X]

    Imagem
    Sugestão de imagem/vídeo.
    
    Título
    Frase Principal com até 10 palavras
    
    Texto
    Texto de apoio com até 30 palavras

    EMPRESA: ${context}.
    CONTEXTO: ${title} - ${description}`;
    } else if (model === "video") {
      content = `Você é um estrategista de conteúdo e roteirista de video experiente. 
    TAREFA: criar uma sequência de stories usando técnicas de storytelling. Traga as falas da pessoa que irá gravar. Cada texto de fala deve caber em um espaço de 15 a 30 segundos. Use o seguinte modelo: 
    1 - SLIDE 1 deve ser com um texto chamativo para o problema apresentado.
    2 - SLIDE 2 deve envolver a pessoa apresentando dados e situações que abordem esse problema, como drama pessoal do próprio profissional ou de pessoas conhecidas.
    3 - SLIDE 3 ao penúltimo devem abordar a proposta única de solução para o problema. (determine a quantidade de acordo com o conteúdo a ser falado)
    4 - O último stories deve sempre conter um CTA, caso não haja nada no contexto sugira na fala que a pessoa visite o link da bio, mas faça isso de forma criativa.
    REGRA: Retorne apenas o texto sem nenhuma observação. Texto somente com parágrafos e sem tags html. 
    TEMPLATE: 
    [STORIES X]
    
    Fala:
    Texto para a pessoa falar.

    Interação:(opcional)
    Sugira aqui algum elemento de interação nos stories de acordo com o conteúdo.
    
    CONTEXTO: ${title} - ${description}`;
    }
  }
  // Se for carrossel
  else if (intent === "carousel") {
    //base

    let rules = "";

    let template = `<h3>SLIDE 1</h3> (use um Gancho forte para chamar a atenção do usuário)
    <h4>Frase do título aqui.</h4> (Frase principal do Carrossel. Deve ser chamativa e apelar para o gatilho mental: ${trigger})
    
    
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
    if (model === "twitter") {
      rules =
        "Insira sempre um emoji de acordo com a frase no final de cada frase. O texto deve ter no máximo 280 caracteres.";
      template = `<h3>SLIDE 1</h3> 
    <p>Frase do título aqui.</p> (Frase principal do Carrossel. Use um Gancho forte para chamar a atenção do usuário. Deve ser chamativo e apelar para o gatilho mental: ${trigger})
    <p>Sugestão de imagem</p>
    <h3>SLIDE 2</h3> (desenvolva o problema e retenha o usuário)
    <p>Sugestão de imagem</p>
    <p>Conteúdo do Texto aqui</p>
    SLIDE X (de 3 a 8 - desenvolva a proposta única para esse tema.)
    <p>Conteúdo do Texto aqui</p>
    <p>Sugestão de imagem</p>
    SLIDE X (penúltimo) ( Após apresentar a proposta única, crie desejo no usuário.)
    <p>Sugestão de imagem</p>
    <p>Conteúdo do Texto aqui</p>
    SLIDE X (último) ( Finalize com uma chamada para a ação.)
    <p>Conteúdo do Texto aqui</p>
    `;
    }
    content = `Você é um estrategista de conteúdo experiente e trabalha principalmente com técnicas de storytelling para envolver o usuário levando em conta o CONTENT e a descrição da EMPRESA. 
TAREFA: Criar um post em formato carrossel envolvente e que prendam o usuário usando o gatilho mental: ${trigger}.
REGRAS: Retorne apenas o texto sem nenhuma informação sua e formatado com tags HTML. ${rules} 
MODELO: ${template}
 EMPRESA: ${context}
CONTENT: ${title} - ${description}`;
  } else if (intent === "title") {
    template = `Use esses 3 princípios: Princípio da especificidade, Princípio da curiosidade e Princípio do “sequestro da atenção”. Evite palavras genéricas como: Descubra, Aprenda, método, segredo, dica.
`;

    content = `Você é um copywriter jovem e astuto. Sua missão é criar títulos antiflop para postagens no Instagram.
    
  REGRAS: Retorne apenas o texto sem nenhuma observação. Texto somente com parágrafos e sem tags html. Retorne apenas uma frase sem aspas. O título deve ter no máximo 12 palavras. 
  TEMPLATE: ${template}.
  EMPRESA: ${context}.
  CONTEXTO: Título do post: '${title}, descrição: ${description}'`;
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
