import { Link } from "@remix-run/react";
import type { MetaFunction } from "@vercel/remix";
import Button from "~/components/structure/Button";
import { DotPattern, FlickeringGrid } from "~/components/structure/Backgrounds";

import { Bussola } from "~/lib/helpers";
import { cn } from "~/lib/utils";

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

export default function Index() {
  return (
    <div className="relative grid h-dvh w-full place-content-center overflow-hidden bg-black">
      {/* <DotPattern
        width={30}
        height={30}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "[mask-image:linear-gradient(to_bottom_right,white,transparent,white)]",
        )}
      /> */}
      <FlickeringGrid
        className="absolute top-1/2 left-1/2 z-0 size-full -translate-x-1/2 -translate-y-1/2 scale-110"
        squareSize={96}
        gridGap={12}
        color="#333"
        maxOpacity={1}
        flickerChance={0.2}
      />
      {/* <Waves
        size={600}
        speed={1}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      /> */}
      {/* <img src="logo.png" alt="" className="h-6" /> */}
      <div className="z-10 flex flex-col items-center p-8 text-center text-white lg:px-24">
        <Bussola size="md" className="text-white" />
        <div className="mt-8 text-xl font-bold">
          Sistema de Gestão de <br /> Processos da Agência CNVT®
        </div>
        <div className="mt-8 text-center">
          <Button asChild>
            <Link to={"/dashboard"} prefetch="intent">
              Entrar
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
