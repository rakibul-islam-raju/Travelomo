"use client";

import BulletList from "@tiptap/extension-bullet-list";
import Highlight from "@tiptap/extension-highlight";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	Heading1,
	Heading2,
	Heading3,
	Highlighter,
	Italic,
	List as ListIcon,
	ListOrdered,
	Pilcrow,
	Strikethrough,
	Underline as UnderlineIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type Props = {
	label?: string;
	value: string;
	onChange: (html: string) => void;
	className?: string;
	required?: boolean;
};

export const RichTextEditor = ({
	label,
	value,
	onChange,
	className = "",
	required = false,
}: Props) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				bulletList: false,
				orderedList: false,
				listItem: false,
			}),
			Underline,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Highlight,
			BulletList,
			OrderedList,
			ListItem,
			Placeholder.configure({
				placeholder: "Start writing here...",
				emptyEditorClass: "text-muted-foreground",
				showOnlyWhenEditable: true,
				showOnlyCurrent: false,
			}),
		],
		content: value,
		onUpdate({ editor }) {
			onChange(editor.getHTML());
		},
	});

	const toolbarButton = (
		icon: React.ReactNode,
		command: () => void,
		isActive: boolean = false,
		label?: string
	) => (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={(e) => {
						e.preventDefault();
						command();
					}}
					className={`p-2 border rounded hover:bg-gray-100 ${
						isActive ? "bg-blue-600 text-white" : "text-gray-700"
					}`}
					aria-label={label}
				>
					{icon}
				</button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{label}</p>
			</TooltipContent>
		</Tooltip>
	);

	return (
		<div className={`space-y-2 ${className}`}>
			{label && (
				<label className="block text-sm font-medium">
					{label} {required && <span className="text-red-500">*</span>}
				</label>
			)}

			{editor && (
				<div className="flex flex-wrap gap-1 border-b pb-2 mb-2">
					{toolbarButton(
						<Heading1 size={16} />,
						() => editor.chain().focus().toggleHeading({ level: 1 }).run(),
						editor.isActive("heading", { level: 1 }),
						"Heading 1"
					)}
					{toolbarButton(
						<Heading2 size={16} />,
						() => editor.chain().focus().toggleHeading({ level: 2 }).run(),
						editor.isActive("heading", { level: 2 }),
						"Heading 2"
					)}
					{toolbarButton(
						<Heading3 size={16} />,
						() => editor.chain().focus().toggleHeading({ level: 3 }).run(),
						editor.isActive("heading", { level: 3 }),
						"Heading 3"
					)}
					{toolbarButton(
						<Pilcrow size={16} />,
						() => editor.chain().focus().setParagraph().run(),
						editor.isActive("paragraph"),
						"Paragraph"
					)}
					{toolbarButton(
						<Bold size={16} />,
						() => editor.chain().focus().toggleBold().run(),
						editor.isActive("bold"),
						"Bold"
					)}
					{toolbarButton(
						<Italic size={16} />,
						() => editor.chain().focus().toggleItalic().run(),
						editor.isActive("italic"),
						"Italic"
					)}
					{toolbarButton(
						<Strikethrough size={16} />,
						() => editor.chain().focus().toggleStrike().run(),
						editor.isActive("strike"),
						"Strikethrough"
					)}
					{toolbarButton(
						<UnderlineIcon size={16} />,
						() => editor.chain().focus().toggleUnderline().run(),
						editor.isActive("underline"),
						"Underline"
					)}
					{toolbarButton(
						<Highlighter size={16} />,
						() => editor.chain().focus().toggleHighlight().run(),
						editor.isActive("highlight"),
						"Highlight"
					)}
					{toolbarButton(
						<ListIcon size={16} />,
						() => editor.chain().focus().toggleBulletList().run(),
						editor.isActive("bulletList"),
						"Bullet List"
					)}
					{toolbarButton(
						<ListOrdered size={16} />,
						() => editor.chain().focus().toggleOrderedList().run(),
						editor.isActive("orderedList"),
						"Ordered List"
					)}
					{toolbarButton(
						<AlignLeft size={16} />,
						() => editor.chain().focus().setTextAlign("left").run(),
						editor.isActive({ textAlign: "left" }),
						"Align Left"
					)}
					{toolbarButton(
						<AlignCenter size={16} />,
						() => editor.chain().focus().setTextAlign("center").run(),
						editor.isActive({ textAlign: "center" }),
						"Align Center"
					)}
					{toolbarButton(
						<AlignRight size={16} />,
						() => editor.chain().focus().setTextAlign("right").run(),
						editor.isActive({ textAlign: "right" }),
						"Align Right"
					)}
					{toolbarButton(
						<AlignJustify size={16} />,
						() => editor.chain().focus().setTextAlign("justify").run(),
						editor.isActive({ textAlign: "justify" }),
						"Justify"
					)}
				</div>
			)}

			<div className="">
				<EditorContent
					editor={editor}
					className="border rounded p-2 prose-editor"
				/>
			</div>
		</div>
	);
};
