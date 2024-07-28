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
import Crossword, { Clue, Direction, Across, Down } from "./crossword";

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
			crossword.check();
			el.innerHTML = "";
			el.appendChild(this.renderGrid(crossword));
			el.appendChild(this.renderClues(crossword, ctx));
			if (crossword.warnings.length > 0 && !ctx.frontmatter?.cxwNoWarn)
				el.appendChild(this.renderWarnings(crossword, ctx));
		} catch(e) {
			el.innerHTML = "";
			child(el, "h1", "cxw-error", "Error parsing XML");
			child(el, "pre", "cxw-error", e.stack);
		} 
	}

	renderGrid(cxw: Crossword): HTMLElement {
		const table = newEl('table', 'cxw-grid'),
			tbody = child(table, "tbody");
		for (let y = 0; y < cxw.height; ++y) {
			const rowEl = child(tbody, "tr");
			for (let x = 0; x < cxw.width; ++x) {
				const el = child(rowEl, "td", "cxw-cell");
				const cell = cxw.grid[y][x];
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
		return table;
	}

	renderClues(cxw: Crossword, ctx: MarkdownPostProcessorContext) {
		const el = document.createElement('div');
		this.renderClueSet(el, cxw, Across, ctx);
		this.renderClueSet(el, cxw, Down, ctx);
		return el;
	}

	renderClueSet(parent: HTMLElement, cxw: Crossword, direction: Direction, ctx: MarkdownPostProcessorContext) {
		const e = child(parent, "div");
		child(e, "h2", "cxw-clue-list-title", direction.description);
		const ol = child(e, "ol");
		for (const c of cxw.cluesInDirection(direction)) {
			const li = child(ol, "li", "cxw-clue");
			child(li, "div", "cxw-clue-number", cxw.friendlyClueKey(c.id, direction) + '.');
			const t = child(li, "div", "cxw-clue-text");
			const main = child(t, "div", "cxw-clue-body");
			if ("noClue" in c) {
				child(main, "span", "cxw-clue-no-clue", c.text);
				continue;
			}
			MarkdownRenderer.render(this.app, c.md, main, ctx.sourcePath, this);
			child(main, "span", "cxw-clue-format", ` (${c.format})`);
			if (c.explanation && c.solution) child(t, "div", "cxw-clue-citation", `${c.explanation} 🡒 ${c.solution.toUpperCase()}`);
			else if (c.explanation) child(t, "div", "cxw-clue-citation", c.explanation);
			else if (c.solution) child(t, "div", "cxw-clue-citation", c.solution);
		}
		return e;
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
