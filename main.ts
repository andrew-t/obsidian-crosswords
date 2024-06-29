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
			const parser = new XMLParser({
				ignoreAttributes: false,
				attributeNamePrefix : "$",
				allowBooleanAttributes: true
			});
			const xml = parser.parse(source);
			const { crossword } = xml["crossword-compiler"]["rectangular-puzzle"];

			el.innerHTML = "";
			el.appendChild(this.renderGrid(crossword.grid));
			el.appendChild(this.renderClues(crossword.clues, crossword.word));
			console.log(xml);
		} catch(e) {
			el.innerHTML = "";
			child(el, "h1", "cxw-error", "Error parsing XML");
			child(el, "pre", "cxw-error", e.stack);
		} 
	}

	renderGrid(grid: any): HTMLElement {
		const table = newEl('table', 'cxw-grid'),
			tbody = child(table, "tbody"),
			w = parseInt(grid.$width, 10),
			h = parseInt(grid.$height, 10),
			cells: Record<string, Record<string, HTMLElement>> = {};
		for (let y = 1; y <= h; ++y) {
			const rowEl = child(tbody, "tr", "cxw-cell");
			const row: Record<string, HTMLElement> = {};
			cells[y] = row;
			for (let x = 1; x <= w; ++x)
				row[x] = child(rowEl, "td");
		}
		for (const cell of grid.cell) {
			const el = cells[cell.$y][cell.$x];
			if (cell.$type == 'block')
				el.classList.add('cxw-block');
			if (cell.$number)
				child(el, "span", "cxw-number", cell.$number);
			if (cell.$solution)
				child(el, "div", "cxw-letter", cell.$solution);
		}
		return table;
	}

	renderClues(clues: any, words: any) {
		const wordsById: Record<string, { $solution: string }> = {};
		for (const word of words) wordsById[word.$id] = word;
		const el = document.createElement('div');
		for (const { title, clue } of clues) {
			const e = child(el, "div");
			child(e, "h2", "cxw-clue-list-title", title.b ?? title);
			const ol = child(e, "ol");
			for (const c of clue) {
				const li = child(ol, "li", "cxw-clue");
				child(li, "div", "cxw-clue-number", c.$number + '.');
				const t = child(li, "div", "cxw-clue-text");
				const main = child(t, "div", "cxw-clue-body");
				child(main, "span", "cwx-clue-body-text").innerHTML = c["#text"];
				child(main, "span", "cxw-clue-format" ` (${c.$format})`);
				child(t, "div", "cxw-clue-citation",
					`${c["$citation"]} 🡒 ${wordsById[c.$word].$solution.toUpperCase()}`
				);
			}
		}
		return el;
	}
}

function newEl(tag: string, className?: string content?: string) {
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
