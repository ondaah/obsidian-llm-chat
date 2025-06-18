import { useState } from "react";
import { usePlugin } from "src/hooks";
import { Chat, ChatMessage } from "src/types";
import ChatWindowMessage from "./ChatWindowMessage";

interface ChatWindowProps {
	chat: Chat;
	onMessageSent: (message: ChatMessage) => void;
	onClose: () => void;
	onDelete: () => void;
	onTitleChanged: (title: string) => void;
}

export default function ChatWindow({
	chat,
	onMessageSent,
	onClose,
	onDelete,
	onTitleChanged,
}: ChatWindowProps) {
	const plugin = usePlugin();
	const [messageText, setMessageText] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);

	const [chatTitle, setChatTitle] = useState(chat.title);
	const [isEditingTitle, setIsEditingTitle] = useState(false);

	function formatForPrompt(message: ChatMessage) {
		return { role: message.role, content: message.content };
	}

	function formatMessagesForPrompt(messages: ChatMessage[]) {
		return messages.map(formatForPrompt);
	}

	async function sendMessage() {
		if (!messageText.trim() || isStreaming) return;
		setIsStreaming(true);

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: messageText,
			createdAt: new Date(),
		};
		onMessageSent(userMessage);

		const promptMessages = [...chat.messages, userMessage];
		setMessageText("");

		const assistantMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "assistant",
			content: "",
			createdAt: new Date(),
		};
		onMessageSent(assistantMessage);

		try {
			const res = await fetch(
				`${plugin?.settings.apiUrl}/v1/chat/completions`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						model: plugin?.settings.modelName,
						messages: formatMessagesForPrompt(promptMessages),
						stream: true,
					}),
				}
			);
			if (!res.ok || !res.body) throw new Error("Streaming error");

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			// eslint-disable-next-line no-constant-condition
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() as string;

				for (const line of lines) {
					if (!line.startsWith("data:")) continue;
					const data = line.replace(/^data:\s*/, "");
					if (data === "[DONE]") {
						setIsStreaming(false);
						return;
					}
					try {
						const parsed = JSON.parse(data);
						const delta = parsed.choices?.[0]?.delta?.content;
						if (delta) {
							assistantMessage.content += delta;
							onMessageSent({ ...assistantMessage });
						}
					} catch {
						// ignore
					}
				}
			}
		} catch (e) {
			console.error(e);
			setIsStreaming(false);
		}
	}

	function startEditingTitle() {
		if (isStreaming) return;
		setIsEditingTitle(true);
	}

	function updateChatTitle() {
		setIsEditingTitle(false);
		onTitleChanged(chatTitle);
	}

	return (
		<div className="h-full flex flex-col">
			{!isEditingTitle ? (
				<header className="flex justify-between items-center p-2 h-24">
					<h3 className="text-xl" onClick={startEditingTitle}>
						{chat.title}
					</h3>
					<div className="flex gap-2">
						<button
							className="mod-warning"
							onClick={onDelete}
							disabled={isStreaming}
						>
							Delete
						</button>
						<button onClick={onClose} disabled={isStreaming}>
							Close
						</button>
					</div>
				</header>
			) : (
				<header className="flex justify-between items-center p-2 h-24 gap-2">
					<input
						className="grow"
						type="text"
						value={chatTitle}
						onChange={(e) => setChatTitle(e.target.value)}
					/>
					<div className="flex gap-2">
						<button onClick={updateChatTitle}>Save</button>
						<button onClick={() => setIsEditingTitle(false)}>
							Cancel
						</button>
					</div>
				</header>
			)}
			<main className="flex flex-col gap-2 grow overflow-auto p-2">
				{chat.messages.map((message) => (
					<ChatWindowMessage key={message.id} message={message} />
				))}
			</main>
			<footer className="flex items-center gap-2 p-2">
				<input
					className="grow border rounded-md p-2 border-white/15"
					placeholder="Type a message..."
					value={messageText}
					onChange={(e) => setMessageText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							sendMessage();
						}
					}}
					disabled={isStreaming}
				/>
				<button
					className="shrink-0 p-2 rounded bg-blue-600"
					onClick={sendMessage}
					disabled={isStreaming}
				>
					{isStreaming ? "Streaming..." : "Send"}
				</button>
			</footer>
		</div>
	);
}
