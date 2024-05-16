import BulletList from "@tiptap/extension-bullet-list";
import Highlight from "@tiptap/extension-highlight";
import Superscrit from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import {
	BubbleMenu,
	EditorProvider,
	FloatingMenu,
	useCurrentEditor,
	type Content,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	BoldIcon,
	EraserIcon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	Heading4Icon,
	Heading5Icon,
	HighlighterIcon,
	ItalicIcon,
	ListIcon,
	StrikethroughIcon,
	SubscriptIcon,
	SuperscriptIcon,
} from "lucide-react";
import { Button } from "../ui/button";

export default function Tiptap({
	content,
	onBlur,
}: {
	content: Content;
	onBlur: (text: string) => void;
}) {
	const extensions = [
		StarterKit,
		Highlight.configure({ multicolor: true }),
		BulletList,
		Superscrit,
		Subscript,
	];

	return (
		<div className="editor-tiptap">
			<EditorProvider
				onBlur={({ editor }) => onBlur(editor.getHTML())}
				extensions={extensions}
				content={content}
				slotBefore={<Menu />}
			>
				<TiptapFloatingMenu />
				<BubbleMenu className="max-w-44 p-1 border rounded-lg backdrop-blur-lg bg-background/50">
					<Menu short={true} />
				</BubbleMenu>
			</EditorProvider>
		</div>
	);
}

const TiptapFloatingMenu = () => {
	return (
		<FloatingMenu className="backdrop-blur-lg ml-4 border bg-background/50 rounded-lg p-1">
			<Menu short={true} />
		</FloatingMenu>
	);
};

export const Menu = ({ short }: { short?: boolean }) => {
	const { editor } = useCurrentEditor();

	return (
		<div className={`flex gap-4 flex-wrap`}>
			{/* Formating */}
			{!short && (
				<>
					<div className="flex">
						<Button
							variant={
								editor?.isActive("bold") ? "default" : "ghost"
							}
							onClick={() =>
								editor?.chain().focus().toggleBold().run()
							}
							className="size-8 p-0 grid place-content-center"
						>
							<BoldIcon className="size-4" />
						</Button>
						<Button
							className="size-8 p-0 grid place-content-center"
							variant={
								editor?.isActive("italic") ? "default" : "ghost"
							}
							onClick={() =>
								editor?.chain().focus().toggleItalic().run()
							}
						>
							<ItalicIcon className="size-4" />
						</Button>
						<Button
							className="size-8 p-0 grid place-content-center"
							variant={
								editor?.isActive("strike") ? "default" : "ghost"
							}
							onClick={() =>
								editor?.chain().focus().toggleStrike().run()
							}
						>
							<StrikethroughIcon className="size-4" />
						</Button>
					</div>

					{/* Hightlight and Clean */}
					<div className="flex">
						<Button
							title="Destacar texto"
							className="size-8 p-0 grid place-content-center"
							variant={
								editor?.isActive("highlight")
									? "default"
									: "ghost"
							}
							onClick={() =>
								editor?.chain().focus().toggleHighlight().run()
							}
						>
							<HighlighterIcon className="size-4 " />
						</Button>
						<Button
							className="size-8 p-0 grid place-content-center"
							variant={"ghost"}
							onClick={() => editor?.commands.clearNodes()}
							title="Limpar Formatação"
						>
							<EraserIcon className="size-4" />
						</Button>
					</div>
				</>
			)}
			{/* Headings */}
			<div className="flex">
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={
						editor?.isActive("heading", { level: 1 })
							? "default"
							: "ghost"
					}
					onClick={() =>
						editor
							?.chain()
							.focus()
							.toggleHeading({ level: 1 })
							.run()
					}
				>
					<Heading1Icon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={
						editor?.isActive("heading", { level: 2 })
							? "default"
							: "ghost"
					}
					onClick={() =>
						editor
							?.chain()
							.focus()
							.toggleHeading({ level: 2 })
							.run()
					}
				>
					<Heading2Icon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={
						editor?.isActive("heading", { level: 3 })
							? "default"
							: "ghost"
					}
					onClick={() =>
						editor
							?.chain()
							.focus()
							.toggleHeading({ level: 3 })
							.run()
					}
				>
					<Heading3Icon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={
						editor?.isActive("heading", { level: 4 })
							? "default"
							: "ghost"
					}
					onClick={() =>
						editor
							?.chain()
							.focus()
							.toggleHeading({ level: 4 })
							.run()
					}
				>
					<Heading4Icon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={
						editor?.isActive("heading", { level: 5 })
							? "default"
							: "ghost"
					}
					onClick={() =>
						editor
							?.chain()
							.focus()
							.toggleHeading({ level: 5 })
							.run()
					}
				>
					<Heading5Icon className="size-4" />
				</Button>
			</div>
			{/* Outros */}
			<div className="flex">
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={"ghost"}
					onClick={() => editor?.commands.toggleBulletList()}
				>
					<ListIcon className="size-4" />
				</Button>
				{!short && (
					<>
						<Button
							className="size-8 p-0 grid place-content-center"
							variant={
								editor?.isActive("subscript")
									? "default"
									: "ghost"
							}
							onClick={() =>
								editor?.chain().focus().toggleSubscript().run()
							}
						>
							<SubscriptIcon className="size-4" />
						</Button>
						<Button
							className="size-8 p-0 grid place-content-center"
							variant={
								editor?.isActive("superscript")
									? "default"
									: "ghost"
							}
							onClick={() =>
								editor
									?.chain()
									.focus()
									.toggleSuperscript()
									.run()
							}
						>
							<SuperscriptIcon className="size-4" />
						</Button>
					</>
				)}
			</div>
		</div>
	);
};
