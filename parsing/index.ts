import { readXml } from "./xml";
import { readMd } from "./md";
import Crossword from "../crossword";

export default function parse(source: string): Crossword {
	if (source[0] == '<') {
		console.log("Parsing as XML");
		return readXml(source);
	}
	console.log("Parsing as Markdown");
	return readMd(source);
}
