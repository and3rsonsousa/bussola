import type { MetaFunction } from "@vercel/remix";

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
	return (
		<div className="mt-16 px-8 pb-16">
			<img src="logo.png" alt="" className="h-6" />
			<h2 className="text-3xl font-extrabold text-gray-100 tracking-tighter">
				Ajuda
			</h2>
			<div>Atalhos de teclado ao usar ações</div>
			<div></div>
		</div>
	);
}
