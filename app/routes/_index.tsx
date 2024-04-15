import { Button } from "~/components/ui/button";
import type { MetaFunction } from "@vercel/remix";
import { Link } from "@remix-run/react";

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
		<div className="grid w-full h-dvh place-content-center">
			<img src="logo.png" alt="" />
			<div className="mt-8 text-center">
				<Button asChild>
					<Link to={"/dashboard"} prefetch="intent">
						Entrar
					</Link>
				</Button>
			</div>
		</div>
	);
}
