import { Chat } from "src/types";

interface ChatListItemProps {
	chat: Chat;
	onOpen: (id: number) => void;
	onDelete: (id: number) => void;
}

function ChatListItem({ chat, onOpen, onDelete }: ChatListItemProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				{/* Left side */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<p className="text-xl font-bold">{chat.title}</p>
						{/* <p className="opacity-50">#{chat.id}</p> */}
					</div>
					<p className="opacity-50">
						{new Date(chat.createdAt).toLocaleString()}
					</p>
					<p className="opacity-50">
						{chat.messages.length} messages
					</p>
				</div>
				{/* Right side */}
				<div className="flex gap-2">
					<button onClick={() => onOpen(chat.id)}>Open</button>
					<button
						className="mod-warning"
						onClick={() => onDelete(chat.id)}
					>
						Delete
					</button>
				</div>
			</div>
			<div className="h-px bg-white opacity-10"></div>
		</div>
	);
}

export default ChatListItem;
