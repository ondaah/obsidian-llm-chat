import { Chat } from "src/types";
import ChatListItem from "./ChatListItem";

interface ChatListProps {
	chats: Chat[];
	onCreateChat: (chat: Chat) => void;
	onDeleteChat: (id: number) => void;
	onOpenChat: (id: number) => void;
}

function ChatList({
	chats,
	onCreateChat,
	onDeleteChat,
	onOpenChat,
}: ChatListProps) {
	function createChat() {
		const newChat: Chat = {
			id: Date.now(),
			title: "New chat",
			createdAt: new Date(),
			messages: [],
		};
		onCreateChat(newChat);
	}

	function deleteChat(id: number) {
		onDeleteChat(id);
	}

	return (
		<div>
			<header className="flex justify-between items-center">
				<h3>
					Chats <span className="opacity-50">• {chats.length}</span>
				</h3>
				<div>
					<button onClick={createChat}>New chat</button>
				</div>
			</header>
			<div className="flex flex-col gap-8">
				{chats.map((chat) => (
					<ChatListItem
						key={chat.id}
						chat={chat}
						onOpen={() => onOpenChat(chat.id)}
						onDelete={() => deleteChat(chat.id)}
					/>
				))}
			</div>
		</div>
	);
}

export default ChatList;
