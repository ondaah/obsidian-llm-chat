import { App } from "obsidian";
import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext, PluginContext } from "./context";
import { ILLMChatPlugin } from "./types";

export const useApp = (): App | undefined => {
	return useContext(AppContext);
};

export const usePlugin = (): ILLMChatPlugin | undefined => {
	return useContext(PluginContext);
};

export function useLocalStorageState<T>(key: string, defaultValue: T) {
	const app = useApp();
	const [state, setState] = useState<T>(defaultValue);

	useEffect(() => {
		const stored = app?.loadLocalStorage(key) as T | null;
		if (stored) setState(stored);
	}, [app, key]);

	useEffect(() => {
		app?.saveLocalStorage(key, state);
	}, [app, key, state]);

	const update = useCallback((val: T | ((prev: T) => T)) => {
		setState(val);
	}, []);

	return [state, update] as const;
}
