export interface Crossword {
	width: number;
	height: number;
	cells: Cell[][];
	across: Clue[];
	down: Clue[];
	warnings?: string[] | null;
}

export type Cell = BlockCell | LetterCell;

export interface BlockCell {
	isBlock: true;
	solution?: undefined | null;
	number?: undefined | null;
}

export interface LetterCell {
	isBlock?: false | undefined | null;
	solution: string;
	number?: string | undefined | null;
}

export interface Clue {
	number: string;
	format: string;
	solution?: string;
	html: string;
	explanation?: string;
}
