import Crossword, { Clue, Cell, DummyClue, Direction, Across, Down, parseLightKey } from "./crossword";

export default class Highlighter {
	crossword: Crossword;
	parent: HTMLElement;
	highlight: string | null = null;
	clueEls = new Map<Clue | DummyClue, HTMLElement>();
	cellEls = new Map<Cell, HTMLElement>();

	constructor(crossword: Crossword, parent: HTMLElement) {
		this.crossword = crossword;
		this.parent = parent;
	}

	registerClue(clue: Clue | DummyClue, el: HTMLElement) {
		this.clueEls.set(clue, el);
		el.addEventListener('click', () => this.highlightClue(clue.id));
	}

	registerCell(x: number, y: number, el: HTMLElement) {
		const cell = this.crossword.grid[y][x];
		this.cellEls.set(cell, el);
		el.addEventListener('click', () => this.highlightCell(x, y));
	}

	highlightCell(x: number, y: number) {
		const lights = this.crossword.lights.filter(l => {
			const { direction } = parseLightKey(l.id);
			return (direction == Across && l.y == y && l.x <= x && l.x + l.length - 1 >= x) ||
				(direction == Down && l.x == x && l.y <= y && l.y + l.length - 1 >= y);
		});
		const clues = this.crossword.clues.filter(c => c.id.split(", ").some(x => lights.some(l => l.id == x)));
		const i = clues.findIndex(c => c.id == this.highlight);
		if (i < 0) this.highlight = clues[0].id;
		else if (i == clues.length - 1) this.highlight = null;
		else this.highlight = clues[i + 1].id;
		this.showHighlight();
	}

	highlightClue(id: string) {
		if (this.highlight == id) this.highlight = null;
		else this.highlight = id;
		this.showHighlight();
	}

	showHighlight() {
		// console.log("Highlighted clue is now", highlight);
		for (const e of qs(this.parent, ".cxw-highlight"))
			e.classList.remove("cxw-highlight");
		if (!this.highlight) return;
		const clue = this.crossword.clues.find(c => c.id == this.highlight)!;
		this.clueEls.get(clue)!.classList.add("cxw-highlight");
		for (const lightId of clue.id.split(", ")) {
			const light = this.crossword.lights.find(l => l.id == lightId)!;
			for (let i = 0; i < light.length; ++i) {
				const { direction } = parseLightKey(lightId);
				if (direction == Across) this.cellEls.get(this.crossword.grid[light.y][light.x + i])!.classList.add("cxw-highlight");
				else this.cellEls.get(this.crossword.grid[light.y + i][light.x])!.classList.add("cxw-highlight");
			}
		}
	}
}

function *qs(parent: HTMLElement, selector: string) {
	const list = parent.querySelectorAll(selector);
	for (let i = 0; i < list.length; ++i) yield list[i];
}
