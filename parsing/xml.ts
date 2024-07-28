import { XMLParser } from "fast-xml-parser";

import Crossword from "../crossword";
import { directionFromTitle } from "./direction";

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

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix : "$",
	allowBooleanAttributes: true
});

export function readXml(source: string): Crossword {
	const xml = parser.parse(source);

	const { crossword } = xml["crossword-compiler"]["rectangular-puzzle"];
	const grid: Grid = crossword.grid;
	const clues: ClueSet[] = crossword.clues;
	const word: Word[] = crossword.word;

	const cxw = new Crossword(parseInt(grid.$width, 10), parseInt(grid.$height, 10));

	for (const cell of grid.cell) {
		const x = parseInt(cell.$x, 10) - 1,
			y = parseInt(cell.$y, 10) - 1;
		if (cell.$type == 'block') cxw.setBlockCell(x, y);
		else cxw.setLetterCell(x, y, cell.$solution);
	}

	for (const { title, clue } of clues) {
		const direction = directionFromTitle(title.b);
		for (const c of clue) cxw.setClue({
			id: c.$number,
			format: c.$format,
			solution: word.find(w => w.$id == c.$word)!.$solution,
			md: `<span>${c['#text']}</span>`, // wrap it in a span to stop any accidental markdown rendering
			explanation: c.$citation,
		}, direction)
	}

	return cxw;
}
