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
			child(el, "h1", "Error parsing XML");
			child(el, "pre", e.stack);
		} 
	}

	renderGrid(grid: any): HTMLElement {
		const table = document.createElement('table'),
			tbody = child(table, "tbody"),
			w = parseInt(grid.$width, 10),
			h = parseInt(grid.$height, 10),
			cells: Record<string, Record<string, HTMLElement>> = {};
		for (let y = 1; y <= h; ++y) {
			const rowEl = child(tbody, "tr");
			const row: Record<string, HTMLElement> = {};
			cells[y] = row;
			for (let x = 1; x <= w; ++x) {
				row[x] = child(rowEl, "td");
				row[x].style.background = `white`;
				row[x].style.border = `1px solid black`;
				row[x].style.height =
				row[x].style.minHeight =
				row[x].style.maxHeight =
				row[x].style.width =
				row[x].style.minWidth =
				row[x].style.maxWidth = "2.5em";
				row[x].style.padding = "0";
				row[x].style.position = "relative";
			}
		}
		for (const cell of grid.cell) {
			const el = cells[cell.$y][cell.$x];
			if (cell.$type == 'block') {
				el.style.background = 'black';
			}
			if (cell.$number) {
				const num = child(el, "span", cell.$number);
				num.style.fontSize = "0.75em";
				num.style.position = "absolute";
				num.style.top = "0.25em";
				num.style.left = "0.25em";
			}
			if (cell.$solution) {
				const sol = child(el, "div", cell.$solution);
				sol.style.fontSize = "1.5em";
				sol.style.position = "absolute";
				sol.style.top = "0.25em";
				sol.style.left = "0.25em";
				sol.style.right = "0.25em";
				sol.style.textAlign = "center";
			}
		}
		table.style.borderCollapse = `collapse`;
		return table;
	}

	renderClues(clues: any, words: any) {
		const wordsById: Record<string, { $solution: string }> = {};
		for (const word of words) wordsById[word.$id] = word;
		const el = document.createElement('div');
		for (const { title, clue } of clues) {
			const e = child(el, "div");
			child(e, "h2", title.b ?? title);
			const ol = child(e, "ol");
			for (const c of clue) {
				const li = child(ol, "li");
				li.style.display = "flex";
				li.style.marginLeft = "0";
				const n = child(li, "div", c.$number + '.');
				n.style.flex = "3em 0 0";
				const t = child(li, "div");
				t.style.flex = "5em 1 0";
				const main = child(t, "div");
				child(main, "span").innerHTML = c["#text"];
				child(main, "span", ` (${c.$format})`);
				const citation = child(t, "div",
					`${c["$citation"]} 🡒 ${wordsById[c.$word].$solution.toUpperCase()}`
				);
				citation.style.fontSize = "0.75em";
				citation.style.color = '#444';
			}
		}
		return el;
	}
}

function child(parent: HTMLElement, tag: string, content?: string) {
	const h = document.createElement(tag);
	if (content) h.innerText = content;
	parent.appendChild(h);
	return h;
}
