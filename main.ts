import {
	App,
	Editor,
	MarkdownView,
	MarkdownRenderer,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownPostProcessorContext
} from 'obsidian';
import { XMLParser } from "fast-xml-parser";

import parse from "./parsing";
import Crossword, { Clue, Cell, DummyClue, Direction, Across, Down, parseLightKey } from "./crossword";
import Highlighter from "./highlight";

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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	cxw(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		try {
			const crossword = parse(source);
			crossword.check();
			el.innerHTML = "";
			const hl = new Highlighter(crossword, el);

			const table = child(el, 'table', 'cxw-grid'),
				tbody = child(table, "tbody");
			for (let y = 0; y < crossword.height; ++y) {
				const rowEl = child(tbody, "tr");
				for (let x = 0; x < crossword.width; ++x) {
					const el = child(rowEl, "td", "cxw-cell");
					const cell = crossword.grid[y][x];
					hl.registerCell(x, y, el);
					if (cell.isBlock)
						el.classList.add('cxw-block');
					if (cell.number)
						child(el, "span", "cxw-number", cell.number.toString());
					if (cell.solution)
						child(el, "div", "cxw-letter", cell.solution);
					if (cell.followsAcross == ' ') el.classList.add("cxw-follows-across-bar");
					if (cell.followsAcross == '-') el.classList.add("cxw-follows-across-hyphen");
					if (cell.followsDown == ' ') el.classList.add("cxw-follows-down-bar");
					if (cell.followsDown == '-') el.classList.add("cxw-follows-down-hyphen");
				}
			}

			const cluesEl = child(el, 'div');
			for (const direction of [Across, Down] as Direction[]) {
				const e = child(cluesEl, "div");
				child(e, "h2", "cxw-clue-list-title", direction.description);
				const ol = child(e, "ol");
				for (const c of crossword.cluesInDirection(direction)) {
					const li = child(ol, "li", "cxw-clue");
					hl.registerClue(c, li);
					child(li, "div", "cxw-clue-number", crossword.friendlyClueKey(c.id, direction) + '.');
					const t = child(li, "div", "cxw-clue-text");
					const main = child(t, "div", "cxw-clue-body");
					if (c.noClue) {
						child(main, "span", "cxw-clue-no-clue", c.text);
						continue;
					}
					MarkdownRenderer.render(this.app, c.md, main, ctx.sourcePath, this);
					child(main, "span", "cxw-clue-format", ` (${c.format})`);
					if (c.explanation && c.solution) child(t, "div", "cxw-clue-citation", `${c.explanation} 🡒 ${c.solution.toUpperCase()}`);
					else if (c.explanation) child(t, "div", "cxw-clue-citation", c.explanation);
					else if (c.solution) child(t, "div", "cxw-clue-citation", c.solution);
				}
			}

			if (crossword.warnings.length > 0 && !ctx.frontmatter?.cxwNoWarn)
				el.appendChild(this.renderWarnings(crossword, ctx));
		} catch(e) {
			el.innerHTML = "";
			child(el, "h1", "cxw-error", "Error rendering crossword");
			child(el, "pre", "cxw-error", e.stack);
		} 
	}

	renderWarnings(cxw: Crossword, ctx: MarkdownPostProcessorContext) {
		const el = document.createElement('div');
		child(el, "h1", "", "Warnings");
		// TODO: this frontmatter thing seems not to work?
		// if (ctx.frontmatter && !("cxwNoWarn" in ctx.frontmatter))
		// 	child(el, "p", "", "Add frontmatter cxwNoWarn = true to hide these");
		for (const warning of cxw.warnings) child(el, "p", "cxw-warning", warning);
		return el;
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
