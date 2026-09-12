import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import DOMPurify from "dompurify";
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaListUl, FaListOl, FaQuoteRight,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaLink, FaImage, FaTable, FaMinus, FaEraser, FaUndo, FaRedo,
  FaFont, FaHighlighter,
} from "react-icons/fa";

// Sanitizes untrusted stored HTML before rendering it anywhere with
// dangerouslySetInnerHTML (task descriptions / assignment details) — must
// stay in sync with every tag/attribute the toolbar below can produce.
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: [
      "p", "br", "b", "strong", "i", "em", "u", "s", "strike", "mark", "span",
      "ul", "ol", "li", "a", "img", "blockquote", "hr", "h1", "h2", "h3", "pre", "code",
      "table", "thead", "tbody", "tr", "td", "th",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "style", "colspan", "rowspan", "target", "rel"],
  });
}

function ToolbarButton({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection/focus while clicking
      onClick={onClick}
      className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 transition-colors disabled:opacity-30 ${
        active ? "bg-forest text-white" : "text-ink/70 hover:bg-white hover:text-forest"
      }`}
    >
      {children}
    </button>
  );
}

const HEADING_OPTIONS = [
  { value: "paragraph", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
];

// Full-featured rich text editor (headings, bold/italic/underline/strike,
// text/highlight color, lists, alignment, blockquote, link, image, table,
// undo/redo) — mirrors the breadth of the legacy app's CKEditor 4 toolbar,
// rebuilt on Tiptap (actively maintained, MIT-licensed, React 19-safe)
// instead of literally reusing an end-of-life, unmaintained editor version.
export default function RichTextEditor({ value, onChange, placeholder, className = "" }) {
  const fileInputRef = useRef(null);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExtension,
      Placeholder.configure({ placeholder: placeholder || "Start typing…" }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: sanitizeHtml(value),
    onUpdate: ({ editor }) => onChange(sanitizeHtml(editor.getHTML())),
  });

  if (!editor) return null;

  const currentHeading = HEADING_OPTIONS.find((h) =>
    h.value === "paragraph" ? editor.isActive("paragraph") : editor.isActive("heading", { level: Number(h.value[1]) })
  )?.value ?? "paragraph";

  const setHeading = (value) => {
    if (value === "paragraph") editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: Number(value[1]) }).run();
  };

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const insertImageFromUrl = () => {
    setImageMenuOpen(false);
    const url = window.prompt("Image URL");
    if (url?.trim()) editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const chooseImageFile = () => {
    setImageMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => editor.chain().focus().setImage({ src: reader.result }).run();
    reader.readAsDataURL(file);
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-white transition-all focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 ${className}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-mist/60 px-2 py-2">
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><FaUndo size={15} /></ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><FaRedo size={15} /></ToolbarButton>

        <select
          value={currentHeading}
          onChange={(e) => setHeading(e.target.value)}
          className="h-9 cursor-pointer rounded-lg border border-line bg-white px-2 text-[14px] font-semibold text-ink/75 outline-none hover:border-forest/40"
        >
          {HEADING_OPTIONS.map((h) => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>

        <span className="mx-1 h-6 w-px bg-line" />

        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><FaBold size={15} /></ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><FaItalic size={15} /></ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><FaUnderline size={15} /></ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><FaStrikethrough size={15} /></ToolbarButton>

        <label title="Text color" className="flex h-9 w-9 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg hover:bg-white">
          <FaFont size={14} />
          <span className="h-1.5 w-5 rounded-full" style={{ background: editor.getAttributes("textStyle").color || "#22433b" }} />
          <input type="color" className="sr-only" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
        </label>
        <label title="Highlight color" className="flex h-9 w-9 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg hover:bg-white">
          <FaHighlighter size={14} />
          <span className="h-1.5 w-5 rounded-full" style={{ background: editor.getAttributes("highlight").color || "#faf1dc" }} />
          <input type="color" className="sr-only" onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} />
        </label>

        <span className="mx-1 h-6 w-px bg-line" />

        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><FaListUl size={15} /></ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><FaListOl size={15} /></ToolbarButton>
        <ToolbarButton title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><FaQuoteRight size={15} /></ToolbarButton>

        <span className="mx-1 h-6 w-px bg-line" />

        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><FaAlignLeft size={15} /></ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><FaAlignCenter size={15} /></ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><FaAlignRight size={15} /></ToolbarButton>
        <ToolbarButton title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><FaAlignJustify size={15} /></ToolbarButton>

        <span className="mx-1 h-6 w-px bg-line" />

        <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}><FaLink size={15} /></ToolbarButton>

        <div className="relative">
          <ToolbarButton title="Insert image" onClick={() => setImageMenuOpen((o) => !o)}><FaImage size={15} /></ToolbarButton>
          {imageMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setImageMenuOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={chooseImageFile}
                  className="block w-full px-3 py-2 text-left text-[14px] font-medium text-ink/80 hover:bg-mist">
                  Upload from device
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertImageFromUrl}
                  className="block w-full px-3 py-2 text-left text-[14px] font-medium text-ink/80 hover:bg-mist">
                  Image URL…
                </button>
              </div>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImageFileChange} />
        </div>

        <ToolbarButton title="Insert table" onClick={insertTable}><FaTable size={15} /></ToolbarButton>
        <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}><FaMinus size={15} /></ToolbarButton>
        <ToolbarButton title="Remove formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><FaEraser size={15} /></ToolbarButton>
      </div>
      <EditorContent editor={editor} className="tiptap-content max-w-none px-4 py-3 text-[15px] leading-7 text-ink" />
    </div>
  );
}
