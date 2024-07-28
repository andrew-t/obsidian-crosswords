import { Direction, directionFromString } from "../crossword";

export function directionFromTitle(title: string): Direction {
	return directionFromString(title.trim()[0].toLowerCase());
}
