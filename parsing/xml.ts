import { Crossword } from "../types";
import { XMLParser } from "fast-xml-parser";

interface Grid {
	$width: string;
	$height: string;
	cell: Array<BlockCell | LetterCell>;
}

interface BlockCell {
	$type: 'block';
	$number?: undefined | null;
	$solution?: undefined | null;
	$x: string;
	$y: string;
}

interface LetterCell {	
	$type?: undefined | null;
	$number?: string | null;
	$solution: string;
	$x: string;
	$y: string;
}

interface ClueSet {
	title: { b: string };
	clue: Clue[];
}

interface Clue {
	$word: string;
	$number: string;
	$format: string;
	$citation: string;
	"#text": string;
}

interface Word {
	$id: string;
	$x: string;
	$y: string;
	$solution: string;
}

export function readXml(source: string): Crossword {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix : "$",
		allowBooleanAttributes: true
	});
	const xml = parser.parse(source);
	const { crossword } = xml["crossword-compiler"]["rectangular-puzzle"];

	const grid: Grid = crossword.grid;
	const clues: ClueSet[] = crossword.clues;
	const word: Word[] = crossword.word;

	const width = parseInt(grid.$width, 10),
		height = parseInt(grid.$height, 10);
	const cxw: Crossword = {
		width,
		height,
		cells: [],
		across: [],
		down: []
	};
	for (let y = 0; y < height; ++y) cxw.cells[y] = [];
	for (const cell of grid.cell)
		cxw.cells[parseInt(cell.$y, 10) - 1][parseInt(cell.$x, 10) - 1] =
			cell.$type == 'block'
				? { isBlock: true }
				: { solution: cell.$solution, number: cell.$number };
	for (const { title, clue } of clues) {
		const arr = getArr(cxw, title);
		for (const c of clue) arr.push({
			number: c.$number,
			format: c.$format,
			solution: word.find(w => w.$id == c.$word)!.$solution,
			html: c['#text'],
			explanation: c.$citation,
		})
	}
	return cxw;
}

function getArr(cxw: Crossword, title: { b: string }) {
	if (title.b == "Across") return cxw.across;
	if (title.b == "Down") return cxw.down;
	throw new Error(`Unexpected clue direction: ${title.b}`);
}
