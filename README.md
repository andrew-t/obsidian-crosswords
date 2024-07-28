# Crossword plugin

To use this, enable it like any other plugin, then add a code block with the tag "cxw", and paste in a Crossword Compiler XML-format crossword puzzle like this:

	```cxw
	<?xml version="1.0" encoding="UTF-8"?>
	<crossword-compiler xmlns="http://crossword.info/xml/crossword-compiler">
		<rectangular-puzzle xmlns="http://crossword.info/xml/rectangular-puzzle" alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ">
			...
		</rectangular-puzzle>
	</crossword-compiler>
	```

It's designed to work with exports from [MyCrossword](https://www.mycrossword.co.uk) and should render them as solved grids with annotated clue lists — the idea is so you can fairly easily _read_ the crossword, but it's not designed for _writing_ crosswords, although if you want to write one you can use this somewhat more editable format:

	```cxw
	HAT
	O#A
	POP
	
	# Across
	
	1. Headgear that hides the head (3)
	HAT: (t)HAT
	
	3. Dad goes bang (3)
	POP: Double definition
	
	# Down
	
	1. To move like a frog is hard work (3)
	HOP: H + OP
	
	2. Hit dance? (3)
	TAP: Double definition
	```

You can also skip the clue section headers if you include the direction in the clues:

	```cxw
	HAT
	O#A
	POP
	
	1a. Headgear that hides the head (3)
	HAT: (t)HAT
	
	3a. Dad goes bang (3)
	POP: Double definition
	
	1d. To move like a frog is hard work (3)
	HOP: H + OP
	
	2d. Hit dance? (3)
	TAP: Double definition
	```

## Usage

You'll need to clone this repo into your `.obsidian/plugins` folder, then run `npm install` and `npm run build`. Then it should appear in your "installed plugins" folder and just work. You might have to reload your vault to make it appear.
