import ReactMarkdown from "react-markdown";
import { ChatMessage } from "src/types";

interface ChatWindowMessageProps {
	message: ChatMessage;
}

function renderAssistantContent(content: string) {
	const segments: { type: "think" | "text"; text: string }[] = [];
	let currentIndex = 0;
	let currentType: "text" | "think" = "text";

	while (currentIndex < content.length) {
		if (currentType === "text") {
			const thinkStart = content.indexOf("<think>", currentIndex);
			if (thinkStart === -1) {
				const textSegment = content.substring(currentIndex);
				if (textSegment) {
					segments.push({ type: "text", text: textSegment });
				}
				break;
			}

			if (thinkStart > currentIndex) {
				segments.push({
					type: "text",
					text: content.substring(currentIndex, thinkStart),
				});
			}

			currentType = "think";
			currentIndex = thinkStart + 7;
		} else {
			const thinkEnd = content.indexOf("</think>", currentIndex);
			if (thinkEnd === -1) {
				const thinkSegment = content.substring(currentIndex);
				if (thinkSegment) {
					segments.push({ type: "think", text: thinkSegment });
				}
				break;
			}

			segments.push({
				type: "think",
				text: content.substring(currentIndex, thinkEnd),
			});

			currentType = "text";
			currentIndex = thinkEnd + 8; // 8 - длина "</think>"
		}
	}

	return segments.map((seg, i) =>
		seg.type === "think" ? (
			<details
				key={i}
				className="text-gray-400 italic whitespace-pre-wrap"
			>
				<summary>Thoughts</summary>
				<p>{seg.text.trim()}</p>
			</details>
		) : (
			<div key={i} className="prose">
				<ReactMarkdown>{seg.text.trim()}</ReactMarkdown>
			</div>
		)
	);
}

function ChatWindowMessage({ message }: ChatWindowMessageProps) {
	return (
		<div
			className={
				message.role == "user"
					? "p-2 rounded-md flex flex-col gap-1 bg-[var(--color-accent)]/5 w-fit self-end"
					: "p-2 rounded-md flex flex-col gap-1 bg-white/5 w-fit self-start"
			}
		>
			{message.role == "user" ? (
				<div className="prose">
					<ReactMarkdown>{message.content}</ReactMarkdown>
				</div>
			) : (
				renderAssistantContent(message.content)
			)}
			<footer
				className={
					message.role == "user"
						? "text-xs opacity-50 self-end"
						: "text-xs opacity-50"
				}
			>
				{new Date(message.createdAt).toLocaleString()}
			</footer>
		</div>
	);
}

export default ChatWindowMessage;
