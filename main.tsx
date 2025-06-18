/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	ItemView,
	WorkspaceLeaf,
} from "obsidian";

import { Root, createRoot } from "react-dom/client";
import { AppContext, PluginContext } from "src/context";

import ReactApp from "src/App";
import { ILLMChatPlugin, IPluginSettings, Chat } from "src/types";

const DEFAULT_SETTINGS: IPluginSettings = {
	apiUrl: "http://localhost:1234",
	modelName: "",
};

export default class LLMChatPlugin extends Plugin implements ILLMChatPlugin {
	settings: IPluginSettings;
	private exampleView: ExampleView | null = null;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerView(ExampleView.VIEW_TYPE, (leaf: WorkspaceLeaf) => {
			this.exampleView = new ExampleView(leaf, this);
			return this.exampleView;
		});

		this.addRibbonIcon("message-circle", "Open LLM Chat", () => {
			this.openExampleView();
		});
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(ExampleView.VIEW_TYPE);
	}

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData || {});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async openExampleView() {
		let leaf: WorkspaceLeaf | null = null;
		const leaves = this.app.workspace.getLeavesOfType(
			ExampleView.VIEW_TYPE
		);

		if (leaves.length > 0) {
			// Используем существующую панель
			leaf = leaves[0];
		} else {
			// Создаем новую панель справа
			leaf = this.app.workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: ExampleView.VIEW_TYPE });
		}

		if (leaf) {
			this.app.workspace.revealLeaf(leaf);
		}
	}
}

class SettingsTab extends PluginSettingTab {
	plugin: LLMChatPlugin;
	models: string[] = [];
	modelDropdownSetting: Setting;

	constructor(app: App, plugin: LLMChatPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h3", { text: "Base settings" });
		new Setting(containerEl)
			.setName("API URL")
			.setDesc("Your OpenAI-compatible API URL")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.apiUrl)
					.setValue(this.plugin.settings.apiUrl)
					.onChange(async (value) => {
						this.plugin.settings.apiUrl = value;
						await this.plugin.saveSettings();
						this.fetchModels().then(() =>
							this.updateModelDropdown()
						);
					})
			);

		this.modelDropdownSetting = new Setting(containerEl)
			.setName("Model")
			.setDesc("Choose your model")
			.addDropdown((drop) => {
				this.models.forEach((modelId) =>
					drop.addOption(modelId, modelId)
				);
				drop.setValue(this.plugin.settings.modelName);
				drop.onChange(async (selected) => {
					this.plugin.settings.modelName = selected;
					await this.plugin.saveSettings();
				});
			});

		containerEl.createEl("h3", { text: "Chats" });

		const chats: Chat[] = this.app.loadLocalStorage("chats") || [];
		chats.forEach((chat) => {
			new Setting(containerEl)
				.setName(chat.title)
				.setDesc(`#${chat.id} - ${chat.messages.length} messages`)
				.addButton((button) => {
					button
						.setButtonText("Delete")
						.setClass("mod-warning")
						.setCta()
						.onClick(() => {});
				});
		});

		if (this.models.length === 0) {
			this.fetchModels().then(() => this.updateModelDropdown());
		}
	}

	async fetchModels() {
		try {
			const res = await fetch(this.plugin.settings.apiUrl + "/v1/models");
			const data = await res.json();
			this.models = Array.isArray(data.data)
				? data.data.map((m: any) => m.id)
				: [];
		} catch (err) {
			new Notice("Unable to get available models. Check API URL.");
			this.models = [];
		}
	}

	updateModelDropdown() {
		const selectEl = (
			this.modelDropdownSetting.components.find(
				(c) => (c as any).selectEl
			) as any
		).selectEl as HTMLSelectElement;
		if (!selectEl) return;

		const currentValue = selectEl.value;

		selectEl.innerHTML = "";
		this.models.forEach((modelId) => {
			const option = document.createElement("option");
			option.value = modelId;
			option.textContent = modelId;
			selectEl.appendChild(option);
		});

		selectEl.value = this.models.includes(currentValue)
			? currentValue
			: this.plugin.settings.modelName;
	}
}

class ExampleView extends ItemView {
	static VIEW_TYPE = "example-view";

	root: Root | null = null;
	plugin: LLMChatPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: LLMChatPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return ExampleView.VIEW_TYPE;
	}

	getDisplayText() {
		return "LLM Chat";
	}

	async onOpen() {
		const scriptEl = document.createElement("script");
		scriptEl.src = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";
		document.head.appendChild(scriptEl);

		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<AppContext.Provider value={this.app}>
				<PluginContext.Provider value={this.plugin}>
					<ReactApp />
				</PluginContext.Provider>
			</AppContext.Provider>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
