import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownPostProcessorContext
} from 'obsidian';
import { XMLParser } from "fast-xml-parser";
import parse from "./parsing";
import { Crossword, Clue } from "./types";

// Remember to rename these classes and interfaces!

interface CrosswordPluginSettings {
}

const DEFAULT_SETTINGS: CrosswordPluginSettings = {
}

export default class CrosswordPlugin extends Plugin {
	settings: CrosswordPluginSettings;

	async onload() {
		await this.loadSettings();

        this.registerMarkdownCodeBlockProcessor("cxw",
        	(source: string, el, ctx) => this.cxw(source, el, ctx)
        );
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	cxw(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		try {
			const crossword = parse(source);
			el.innerHTML = "";
			el.appendChild(this.renderGrid(crossword));
			el.appendChild(this.renderClues(crossword));
			console.log(crossword);
		} catch(e) {
			el.innerHTML = "";
			child(el, "h1", "cxw-error", "Error parsing XML");
			child(el, "pre", "cxw-error", e.stack);
		} 
	}

	renderGrid({ width, height, cells }: Crossword): HTMLElement {
		const table = newEl('table', 'cxw-grid'),
			tbody = child(table, "tbody");
		for (let y = 0; y < height; ++y) {
			const rowEl = child(tbody, "tr");
			for (let x = 0; x < width; ++x) {
				const el = child(rowEl, "td", "cxw-cell");
				const cell = cells[y][x];
				if (cell.isBlock)
					el.classList.add('cxw-block');
				if (cell.number)
					child(el, "span", "cxw-number", cell.number);
				if (cell.solution)
					child(el, "div", "cxw-letter", cell.solution);
			}
		}
		return table;
	}

	renderClues({ across, down }: Crossword) {
		const el = document.createElement('div');
		this.renderClueSet(el, "Across", across);
		this.renderClueSet(el, "Down", down);
		return el;
	}

	renderClueSet(parent: HTMLElement, title: string, clues: Clue[]) {
		const e = child(parent, "div");
		child(e, "h2", "cxw-clue-list-title", title);
		const ol = child(e, "ol");
		for (const c of clues) {
			const li = child(ol, "li", "cxw-clue");
			child(li, "div", "cxw-clue-number", c.number + '.');
			const t = child(li, "div", "cxw-clue-text");
			const main = child(t, "div", "cxw-clue-body");
			child(main, "span", "cwx-clue-body-text").innerHTML = c.html;
			child(main, "span", "cxw-clue-format", ` (${c.format})`);
			if (c.explanation && c.solution) child(t, "div", "cxw-clue-citation", `${c.explanation} 🡒 ${c.solution.toUpperCase()}`);
			else if (c.explanation) child(t, "div", "cxw-clue-citation", c.explanation);
			else if (c.solution) child(t, "div", "cxw-clue-citation", c.solution);
		}
		return e;
	}
}

function newEl(tag: string, className?: string, content?: string) {
	const h = document.createElement(tag);
	if (className) h.classList.add(className);
	if (content) h.innerText = content;
	return h;
}

function child(parent: HTMLElement, tag: string, className?: string, content?: string) {
	const h = newEl(tag, className, content);
	parent.appendChild(h);
	return h;
}
