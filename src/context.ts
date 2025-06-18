import { App } from "obsidian";
import { createContext } from "react";
import { ILLMChatPlugin } from "src/types";

export const AppContext = createContext<App | undefined>(undefined);
export const PluginContext = createContext<ILLMChatPlugin | undefined>(
	undefined
);
