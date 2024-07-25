import { Crossword, Clue } from "../types";

export function readMd(source: string): Crossword {
	const lines = source.split("\n");

	const crossword: Crossword = {
		width: lines[0].length,
		height: lines.indexOf(""),
		cells: [],
		across: [],
		down: [],
		warnings: []
	};

	for (let y = 0; y < crossword.height; ++y) {
		const line = lines[y];
		if (line.length != crossword.width)
			throw new Error(`Line ${y+1} is ${line.length} long and should be ${crossword.width} long`);
		crossword.cells.push([...line].map(l => l == '#'
			? { isBlock: true }
			: { solution: l }));
	}

	let n = 0;
	for (let y = 0; y < crossword.height; ++y)
		for (let x = 0; x < crossword.width; ++x)
			if (isClueStart(crossword, x, y))
				crossword.cells[y][x].number = (++n).toString();

	let currentClue: Clue | null = null;
	let currentSection: Clue[] | null = null;
	for (const line of lines.slice(crossword.height)) {
		if (!line) continue;
		if (/^#*\s*Across$/i.test(line)) {
			currentSection = crossword.across;
			currentClue = null;
			continue;
		}
		if (/^#*\s*Down/i.test(line)) {
			currentSection = crossword.down;
			currentClue = null;
			continue;
		}
		const parseAsOpener = line.match(/^\s*(\d[\d.ad, ]*)[.:]\s+(.*)\s+\(([^)]+)\)\s*$/);
		console.log(parseAsOpener)
		if (parseAsOpener) {
			currentClue = {
				number: parseAsOpener[1],
				html: parseAsOpener[2],
				format: parseAsOpener[3]
			};
			currentSection!.push(currentClue);
			continue;
		}
		const parseAsExplainer = line.match(/^([^:]*):\s+(.*)$/);
		if (parseAsExplainer) {
			currentClue!.solution = parseAsExplainer[1];
			currentClue!.explanation = parseAsExplainer[2];
		}
	}

	// TODO: add warnings?? like to check if things are correct — the plugin should warn you if you have too many or not enough clues or they're pointing to the wrong places or whatever

	return crossword;
}

function isClueStart(crossword: Crossword, x: number, y: number): boolean {
	if (!isLetter(crossword, x, y)) return false;
	if (isLetter(crossword, x + 1, y) && !isLetter(crossword, x - 1, y)) return true;
	if (isLetter(crossword, x, y + 1) && !isLetter(crossword, x, y - 1)) return true;
	return false;
}

function isLetter(crossword: Crossword, x: number, y: number): boolean {
	const cell = crossword.cells[y]?.[x];
	return !!cell && !cell.isBlock;
}
