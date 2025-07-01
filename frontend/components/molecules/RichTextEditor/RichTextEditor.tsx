"use client";

import "quill/dist/quill.snow.css";
import { useEffect } from "react";
import { useQuill } from "react-quilljs";
import "./quill.css";

type Props = {
	label?: string;
	value: string;
	onChange: (value: string) => void;
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
	const { quill, quillRef } = useQuill({
		modules: {
			toolbar: [
				[{ header: [1, 2, 3, 4, 5, 6, false] }],
				["bold", "italic", "underline", "strike"],
				[{ color: [] }, { background: [] }],
				[{ font: [] }, { size: ["small", false, "large", "huge"] }],
				[{ align: [] }, { direction: "rtl" }],
				[{ list: "ordered" }, { list: "bullet" }],
				[{ indent: "-1" }, { indent: "+1" }],
				["link", "image", "video"],
				["blockquote", "code-block"],
				["clean"],
			],
		},
		theme: "snow",
	});

	// Sync internal Quill state with external `value`
	useEffect(() => {
		if (quill && value !== quill.root.innerHTML) {
			quill.root.innerHTML = value;
		}
	}, [quill, value]);

	// Handle changes and call onChange
	useEffect(() => {
		if (quill) {
			quill.on("text-change", () => {
				onChange(quill.root.innerHTML);
			});
		}
	}, [quill, onChange]);

	return (
		<div className={`space-y-2 ${className}`}>
			{label && (
				<label className="block text-sm font-medium">
					{label} {required && <span className="text-red-500">*</span>}
				</label>
			)}
			<div ref={quillRef} className="bg-white rounded-md border" />
		</div>
	);
};
