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

It's designed to work with exports from [MyCrossword](https://www.mycrossword.co.uk) and should render them as solved grids with annotated clue lists — the idea is so you can fairly easily _read_ the crossword, but it's not designed for _writing_ crosswords (yet?).

## Usage

You'll need to clone this repo into your `.obsidian/plugins` folder, then run `npm install` and `npm run build`. Then it should appear in your "installed plugins" folder and just work. You might have to reload your vault to make it appear.
