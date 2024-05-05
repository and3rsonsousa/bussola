import Highlight from "@tiptap/extension-highlight";
import {
	EditorProvider,
	FloatingMenu,
	useCurrentEditor,
	type Content,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	BoldIcon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	Heading4Icon,
	Heading5Icon,
	HighlighterIcon,
	ItalicIcon,
	ListIcon,
	PilcrowIcon,
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
	const extensions = [StarterKit, Highlight.configure({ multicolor: true })];

	return (
		<EditorProvider
			onBlur={({ editor }) => onBlur(editor.getHTML())}
			extensions={extensions}
			content={content}
			slotBefore={<TiptapBubbleMenu />}
		>
			<TiptapFloatingMenu />
		</EditorProvider>
	);
}

const TiptapFloatingMenu = () => {
	const { editor } = useCurrentEditor();

	return (
		<FloatingMenu>
			<div className="border border-border/50 bg-gray-900/50 backdrop-blur-lg rounded-lg">
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={"ghost"}
					onClick={() => editor?.commands.toggleHeading({ level: 1 })}
				>
					<Heading1Icon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={"ghost"}
					onClick={() => editor?.commands.toggleHeading({ level: 2 })}
				>
					<Heading2Icon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={"ghost"}
					onClick={() => editor?.commands.toggleHeading({ level: 3 })}
				>
					<Heading3Icon className="size-4" />
				</Button>

				<Button
					className="size-8 p-0 grid place-content-center"
					variant={"ghost"}
					onClick={() => editor?.commands.toggleBulletList()}
				>
					<ListIcon className="size-4" />
				</Button>
			</div>
		</FloatingMenu>
	);
};

const TiptapBubbleMenu = () => {
	const { editor } = useCurrentEditor();

	return (
		<div className="flex gap-4 flex-wrap">
			<div className="flex">
				<Button
					variant={editor?.isActive("bold") ? "default" : "ghost"}
					onClick={() => editor?.chain().focus().toggleBold().run()}
					className="size-8 p-0 grid place-content-center"
				>
					<BoldIcon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={editor?.isActive("italic") ? "default" : "ghost"}
					onClick={() => editor?.chain().focus().toggleItalic().run()}
				>
					<ItalicIcon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={editor?.isActive("strike") ? "default" : "ghost"}
					onClick={() => editor?.chain().focus().toggleStrike().run()}
				>
					<StrikethroughIcon className="size-4" />
				</Button>
			</div>
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
					onClick={() => editor?.commands.setParagraph()}
				>
					<PilcrowIcon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={"ghost"}
					onClick={() => editor?.commands.setParagraph()}
				>
					<ListIcon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={"ghost"}
					onClick={() => editor?.commands.setParagraph()}
				>
					<SubscriptIcon className="size-4" />
				</Button>
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={"ghost"}
					onClick={() => editor?.commands.setParagraph()}
				>
					<SuperscriptIcon className="size-4" />
				</Button>
			</div>

			<div className="flex">
				<Button
					className="size-8 p-0 grid place-content-center"
					variant={
						editor?.isActive("highlight") ? "default" : "ghost"
					}
					onClick={() =>
						editor?.chain().focus().toggleHighlight().run()
					}
				>
					<HighlighterIcon className="size-4 " />
				</Button>
			</div>
		</div>
	);
};
