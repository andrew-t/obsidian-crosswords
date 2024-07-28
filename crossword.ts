export type Cell = BlockCell | LetterCell;

export const Across = Symbol("Across"), Down = Symbol("Down");
export type Direction = typeof Across | typeof Down;

export interface BlockCell {
	isBlock: true;
	solution?: undefined | null;
	number?: undefined | null;
	followsAcross?: '';
	followsDown?: '';
}

export type Joiner = '' | ' ' | '-';

export interface LetterCell {
	isBlock?: false | undefined | null;
	solution: string;
	number?: number | undefined | null;
	followsAcross?: Joiner;
	followsDown?: Joiner;
}

export interface Light {
	id: string;
	x: number;
	y: number;
	length: number;
	solution: string;
}

export interface Clue {
	id: string;
	format: string;
	solution?: string;
	md: string;
	explanation?: string;
}

export default class Crossword {
	width: number;
	height: number;
	grid: Cell[][];
	lights: Light[] = [];
	clues: Clue[] = [];
	warnings: string[] = [];
	checked = false;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.grid = [];
		for (let y = 0; y < height; ++y) {
			this.grid[y] = [];
			for (let x = 0; x < width; ++x)
				this.grid[y][x] = { isBlock: false, solution: "" };
		}
		this.renumberCells();
	}

	setBlockCell(x: number, y: number) {
		this.grid[y][x] = { isBlock: true };
		this.renumberCells();
	}

	setLetterCell(x: number, y: number, solution = "") {
		this.grid[y][x] = { isBlock: false, solution };
		this.renumberCells();
	}

	setClue(clue: Clue, direction?: Direction) {
		clue.id = this.normaliseClueKey(clue.id, direction);
		for (let i = 0; i < this.clues.length; ++i) if (this.clues[i].id == clue.id) {
			this.clues[i] = clue;
			// if (!this.checked) this.warn(`Duplicate clue for ${clue.id}`);
			return;
		}
		this.clues.push(clue);
	}

	deleteClue(id: string, direction?: Direction) {
		id = this.normaliseClueKey(id, direction);
		this.clues = this.clues.filter(c => c.id === id);
	}

	*cluesInDirection(direction: Direction) {
		for (const light of this.lights) {
			if (parseLightKey(light.id).direction != direction) continue;
			const clues = this.clues.filter(clue => clue.id.startsWith(light.id));
			if (clues.length) {
				yield *clues;
				continue;
			}
			const refClues = this.clues.filter(clue => clue.id.includes(`, ${light.id}`));
			if (refClues.length) {
				yield {
					id: light.id,
					noClue: true,
					text: `See ${refClues.map(c => c.id.replace(/,.*$/, '')).join(", ")}`
				};
				continue;
			}
			yield { id: light.id, noClue: true, text: "Unclued" };
		}
		const clues: Clue[] = [];
		for (const clue of this.clues)
			if (directionFromString(clue.id.replace(/^\d+([ad]).*$/, "$1")) == direction)
				clues.push(clue);
		// TODO: also include lights clued as part of compounds in this list
		// TODO: be more clever about this:
		clues.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
		return clues;
	}

	renumberCells() {
		let clue = 0;
		this.lights = [];
		for (let y = 0; y < this.height; ++y)
			for (let x = 0; x < this.width; ++x) {
				this.grid[y][x].number = null;
				if (!this.isLetter(x, y)) continue;
				const isAcross = this.isLetter(x + 1, y) && !this.isLetter(x - 1, y),
					isDown = this.isLetter(x, y + 1) && !this.isLetter(x, y - 1);
				if (!isAcross && !isDown) continue;
				this.grid[y][x].number = ++clue;
				if (isAcross) {
					const light = { x, y, id: lightKey(clue, Across), solution: "", length: 0 };
					for (let l = 0; l <= this.width + 1; ++l)
						if (this.isLetter(x + l, y)) light.solution += this.grid[y][x + l].solution;
						else { light.length = l; this.lights.push(light); break; }
				}
				if (isDown) {
					const light = { x, y, id: lightKey(clue, Down), solution: "", length: 0 };
					for (let l = 0; l <= this.height + 1; ++l)
						if (this.isLetter(x, y + l)) light.solution += this.grid[y + l][x].solution;
						else { light.length = l; this.lights.push(light); break; }
				}
			}
	}

	isLetter(x: number, y: number) {
		const cell = this.grid[y]?.[x];
		return !!cell && !cell.isBlock;
	}

	warn(warning: string) {
		this.warnings.push(warning);
	}

	normaliseClueKey(key: string, direction?: Direction) {
		try {
			return key.split(',').map(x => this.normaliseLightKey(x, direction)).join(", ");
		} catch (e) {
			throw new Error(`Error normalising clue key: ${key} (${direction?.description}) — ${e.message}`);
		}
	}

	normaliseLightKey(key: string, defaultDirection?: Direction) {
		const parse = key.match(/^\s*(\d+)\s*([ad]?)\s*\.?\s*$/);
		if (!parse) throw new Error("Illegal light key " + key);
		try {
			const number = parseInt(parse[1], 10);
			const direction = parse[2] ? directionFromString(parse[2], defaultDirection) : defaultDirection;
			if (direction) return lightKey(number, direction);
			let existsAcross = false, existsDown = false;
			for (const light of this.lights) {
				if (light.id == `${number}a`) existsAcross = true;
				if (light.id == `${number}d`) existsDown = true;
			}
			if (existsAcross && !existsDown) return lightKey(number, Across);
			if (!existsAcross && existsDown) return lightKey(number, Down);
		} catch (e) {
			throw new Error(`Error normalising light key: ${key} (${defaultDirection?.description}) — ${e.message}`);
		}
		throw new Error(`Unknown direction for key: ${key} (${defaultDirection?.description})`);
	}

	friendlyLightKey(key: string, defaultDirection: Direction) {
		const { number, direction } = parseLightKey(key);
		if (direction == defaultDirection) return number.toString();
		return key;
	}

	friendlyClueKey(key: string, defaultDirection: Direction) {
		return key.split(', ').map(x => this.friendlyLightKey(x, defaultDirection)).join(', ');
	}

	check() {
		const allLights = new Set(this.lights.map(l => l.id));
		const multiple = new Set<string>();
		for (const clue of this.clues)
			for (const light of clue.id.split(', ')) {
				if (!allLights.has(light) && this.lights.some(l => l.id == light)) multiple.add(light);
				allLights.delete(light);
			}
		if (multiple.size) this.warn(`Clued multiple times: ${[...multiple].join(", ")}`);
		if (allLights.size) this.warn(`Unclued: ${[...allLights].join(", ")}`);

		for (const clue of this.clues) {
			const lights = clue.id.split(', ').map(key => this.lights.find(l => l.id == key));
			if (lights.some(l => !l)) {
				this.warn(`Clue ${clue.id} refers to an entry that is not in the grid`);
				continue;
			}

			const lightLength = lights.reduce((a, n) => a + n!.length, 0);
			const clueLength = clue.format.split(/[^\d]+/).reduce((a, n) => n ? a + parseInt(n, 10) : a, 0);
			if (lightLength != clueLength) {
				this.warn(clueLength.toString() == clue.format
					? `Clue ${clue.id} should be ${lightLength} characters long but is given as ${clueLength}`
					: `Clue ${clue.id} should be ${lightLength} characters long but is given as ${clue.format} which adds up to ${clueLength}`);
				continue;
			}

			// TODO: this should probably support diacritics somehow
			if (clue.solution) {
				const lightSolution = lights.map(l => l!.solution).join("");
				if (clue.solution.toUpperCase().replace(/[^A-Z]/g, '') != lightSolution) {
					this.warn(`In the grid, ${clue.id} is ${lightSolution} but the clue solution is ${clue.solution}`);
					continue;
				}
			}

			// Insert the followers into the cell
			let formatCursor = 0;
			let solutionIndex = 0;
			while (solutionIndex < lightLength) {
				if (/\d/.test(clue.format[formatCursor])) {
					const n = parseInt(clue.format.substring(formatCursor), 10);
					solutionIndex += n;
					formatCursor += n.toString().length;
					continue;
				}
				formatCursor++;
				const { cell, light, n } = this.getNthCell(solutionIndex - 1, lights as Light[]);
				if (n == light.length - 1) continue;
				const { direction } = parseLightKey(light.id);
				if (direction == Across) cell.followsAcross = clue.format[formatCursor - 1] == '-' ? '-' : ' ';
				else cell.followsDown = clue.format[formatCursor - 1] == '-' ? '-' : ' ';
			}
		}

		console.log("Completed check of crossword", this);
		this.checked = true;
	}

	getNthCell(n: number, lights: Light[]) {
		for (const light of lights) {
			if (n < light.length) {
				const { direction } = parseLightKey(light.id);
				return {
					cell: (direction == Across ? this.grid[light.y][light.x + n] : this.grid[light.y + n][light.x]) as LetterCell,
					n,
					light
				};
			}
			n -= light.length;
		}
		throw new Error("Invalid index into solution");
	}
}

export function parseLightKey(key: string): { number: number, direction: Direction } {
	const parse = key.match(/^(\d+)([ad])$/);
	if (!parse) throw new Error("Illegal light key: " + key);
	return { number: parseInt(parse[1], 10), direction: directionFromString(parse[2]) };
}

export function lightKey(number: number, direction: Direction) {
	return `${number}${direction == Across ? 'a' : 'd'}`;
}

export function directionFromString(str: string, defaultValue?: Direction): Direction {
	switch (str) {
		case "a": return Across;
		case "d": return Down;
		case "": if (defaultValue) return defaultValue;
		default: throw new Error("Illegal direction: " + str);
	}
}
