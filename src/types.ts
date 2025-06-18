export interface Chat {
	id: number;
	title: string;
	createdAt: Date;
	messages: ChatMessage[];
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant" | "error";
	content: string;
	createdAt: Date;
}

export interface IPluginSettings {
	apiUrl: string;
	modelName: string;
}

export interface ILLMChatPlugin {
	settings: IPluginSettings;
}
