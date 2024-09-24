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
import { useEffect } from "react";

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
    <div className="editor-tiptap font-inter rounded bg-input p-4">
      <EditorProvider
        immediatelyRender={false}
        onBlur={({ editor }) => onBlur(editor.getHTML())}
        extensions={extensions}
        content={content}
        slotBefore={<Menu type={1} />}
      >
        <SetContent content={content} />
        <TiptapFloatingMenu />
        <BubbleMenu editor={null} className="glass rounded-lg p-1">
          <Menu type={3} />
        </BubbleMenu>
      </EditorProvider>
    </div>
  );
}

const SetContent = ({ content }: { content: Content }) => {
  const { editor } = useCurrentEditor();

  if (!editor) return null;

  useEffect(() => {
    editor?.commands.setContent(content);
  }, [content]);

  return <div></div>;
};

const TiptapFloatingMenu = () => {
  const { editor } = useCurrentEditor();
  return (
    <FloatingMenu editor={editor} className="glass ml-4 rounded-lg p-1">
      <Menu type={2} />
    </FloatingMenu>
  );
};

// 1 - fixo
// 2 - Floating
// 3 - Bubble
export const Menu = ({ type }: { type: 1 | 2 | 3 }) => {
  const { editor } = useCurrentEditor();

  return (
    <div
      className={`flex flex-wrap gap-2 ${type === 1 ? "-ml-2 -mt-2 mb-2 border-b pb-2" : ""}`}
    >
      {/* Formating */}
      {type !== 2 && (
        <>
          <div className="flex">
            <Button
              title="Negrito"
              variant={editor?.isActive("bold") ? "secondary" : "ghost"}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className="grid size-8 place-content-center rounded p-0"
            >
              <BoldIcon className="size-4" />
            </Button>
            <Button
              title="Itálico"
              className="grid size-8 place-content-center rounded p-0"
              variant={editor?.isActive("italic") ? "secondary" : "ghost"}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <ItalicIcon className="size-4" />
            </Button>
            <Button
              title="Taxado"
              className="grid size-8 place-content-center rounded p-0"
              variant={editor?.isActive("strike") ? "secondary" : "ghost"}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
            >
              <StrikethroughIcon className="size-4" />
            </Button>
          </div>

          {/* Hightlight and Clean */}
          <div className="flex">
            <Button
              title="Destacar texto"
              className="grid size-8 place-content-center rounded p-0"
              variant={editor?.isActive("highlight") ? "default" : "ghost"}
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
            >
              <HighlighterIcon className="size-4" />
            </Button>
            <Button
              className="grid size-8 place-content-center rounded p-0"
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
      {type !== 3 && (
        <div className="flex">
          <Button
            title="Cabeçalho 1"
            className="grid size-8 place-content-center rounded p-0"
            variant={
              editor?.isActive("heading", { level: 1 }) ? "default" : "ghost"
            }
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1Icon className="size-4" />
          </Button>
          <Button
            title="Cabeçalho 2"
            className="grid size-8 place-content-center rounded p-0"
            variant={
              editor?.isActive("heading", { level: 2 }) ? "default" : "ghost"
            }
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2Icon className="size-4" />
          </Button>
          <Button
            title="Cabeçalho 3"
            className="grid size-8 place-content-center rounded p-0"
            variant={
              editor?.isActive("heading", { level: 3 }) ? "default" : "ghost"
            }
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3Icon className="size-4" />
          </Button>
        </div>
      )}
      {/* Outros */}
      <div className="flex">
        {type !== 3 && (
          <Button
            title="Lista"
            className="grid size-8 place-content-center rounded p-0"
            variant={"ghost"}
            onClick={() => editor?.commands.toggleBulletList()}
          >
            <ListIcon className="size-4" />
          </Button>
        )}

        {type !== 2 && (
          <>
            <Button
              title="Subscrito"
              className="grid size-8 place-content-center rounded p-0"
              variant={editor?.isActive("subscript") ? "default" : "ghost"}
              onClick={() => editor?.chain().focus().toggleSubscript().run()}
            >
              <SubscriptIcon className="size-4" />
            </Button>
            <Button
              title="Superscrito"
              className="grid size-8 place-content-center rounded p-0"
              variant={editor?.isActive("superscript") ? "default" : "ghost"}
              onClick={() => editor?.chain().focus().toggleSuperscript().run()}
            >
              <SuperscriptIcon className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
