import { Link } from "@remix-run/react";
import type { MetaFunction } from "@vercel/remix";
import { format } from "date-fns";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Bussola } from "~/lib/helpers";

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
  useEffect(() => {
    console.log(format(new Date(), "yyyy-MM-dd hh:mm:ss X"));
  }, []);

  return (
    <div className="grid h-dvh w-full place-content-center">
      {/* <img src="logo.png" alt="" className="h-6" /> */}
      <Bussola size={8} />
      <div className="mt-8 text-center">
        <Button asChild>
          <Link to={"/dashboard"} prefetch="intent">
            Entrar
          </Link>
        </Button>
      </div>
      <div className="py-4">{format(new Date(), "yyyy-MM-dd hh:mm:ss X")}</div>
    </div>
  );
}
