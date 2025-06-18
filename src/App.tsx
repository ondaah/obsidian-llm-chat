import { useState } from "react";
import { ChatList } from "./ChatList";
import { ChatWindow } from "./ChatWindow";
import { useLocalStorageState } from "./hooks";
import { Chat, ChatMessage } from "./types";

function ReactView() {
	const [chats, setChats] = useLocalStorageState<Chat[]>("chats", []);
	const [activeChatId, setActiveChatId] = useState<number | null>(null);
	const activeChat = chats.find((c) => c.id === activeChatId);

	function createChat(chat: Chat) {
		setChats((prev) => [chat, ...prev]);
	}

	function deleteChat(chatId: number) {
		if (chatId === activeChatId) closeChat();
		setChats((prev) => prev.filter((c) => c.id !== chatId));
	}

	function openChat(id: number) {
		setActiveChatId(id);
	}

	function closeChat() {
		setActiveChatId(null);
	}

	function updateChatTitle(id: number, title: string) {
		setChats((prev) =>
			prev.map((c) => {
				if (c.id !== id) return c;
				return { ...c, title };
			})
		);
	}

	function addMessage(chatId: number, message: ChatMessage) {
		setChats((prev) =>
			prev.map((c) => {
				if (c.id !== chatId) return c;

				const exists = c.messages.find((m) => m.id === message.id);

				const newMessages = exists
					? c.messages.map((m) => (m.id === message.id ? message : m))
					: [...c.messages, message];

				return { ...c, messages: newMessages };
			})
		);
	}

	return (
		<>
			{activeChatId !== null ? (
				<ChatWindow
					chat={activeChat!}
					onMessageSent={(m) => addMessage(activeChatId, m)}
					onClose={closeChat}
					onDelete={() => deleteChat(activeChatId)}
					onTitleChanged={(t) => updateChatTitle(activeChatId, t)}
				/>
			) : (
				<ChatList
					chats={chats}
					onCreateChat={createChat}
					onDeleteChat={deleteChat}
					onOpenChat={openChat}
				/>
			)}
		</>
	);
}

export default ReactView;
