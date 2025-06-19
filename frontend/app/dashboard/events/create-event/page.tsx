"use client";

import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import { useState } from "react";

export default function CreateEvent() {
	const [content, setContent] = useState("");

	return (
		<div className="">
			<RichTextEditor
				label="Content"
				value={content}
				onChange={setContent}
				required
				className=""
			/>
		</div>
	);
}
