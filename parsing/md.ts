import Crossword, { Clue, Direction, Across, Down } from "../crossword";
import { directionFromTitle } from "./direction";

export function readMd(source: string): Crossword {
	const lines = source.split("\n");
	const crossword = new Crossword(lines[0].length, lines.indexOf(""));

	for (let y = 0; y < crossword.height; ++y) {
		const line = lines[y];
		if (line.length != crossword.width)
			throw new Error(`Line ${y+1} is ${line.length} long and should be ${crossword.width} long`);
		for (let x = 0; x < crossword.width; ++x) {
			const c = line[x];
			if (c == '#') crossword.setBlockCell(x, y);
			else if (c == '.' || c == ' ') crossword.setLetterCell(x, y);
			else crossword.setLetterCell(x, y, c);
		}
	}

	let currentClue: Clue | null = null;
	let currentSection: Direction | undefined;
	for (const line of lines.slice(crossword.height)) {
		if (!line) continue;
		if (line[0] == '#') {
			if (currentClue) crossword.setClue(currentClue, currentSection);
			currentSection = directionFromTitle(line.replace(/^#+\s*/, ''));
			currentClue = null;
			continue;
		}
		const parseAsOpener = line.match(/^\s*(\d[\d.ad, ]*)[.:]\s+(.*)\s+\(([^)]+)\)\s*$/);
		if (parseAsOpener) {
			if (currentClue) crossword.setClue(currentClue, currentSection);
			currentClue = {
				id: parseAsOpener[1],
				md: parseAsOpener[2],
				format: parseAsOpener[3]
			};
			continue;
		}
		const parseAsExplainer = line.match(/^([^:]*):\s+(.*)$/);
		if (parseAsExplainer) {
			currentClue!.solution = parseAsExplainer[1];
			currentClue!.explanation = parseAsExplainer[2];
		}
	}
	if (currentClue) crossword.setClue(currentClue, currentSection);

	// TODO: add warnings?? like to check if things are correct — the plugin should warn you if you have too many or not enough clues or they're pointing to the wrong places or whatever

	return crossword;
}
