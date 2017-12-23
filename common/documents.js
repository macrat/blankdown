const documents = {
	shortcuts: `# Shortcuts

## main menu
## file
|key combination|what do                        |
|:--------------|:------------------------------|
|Ctrl-M         |Make new file                  |
|Ctrl-O         |Open new file (with search)    |
|Ctrl-S         |Save current file              |
|Ctrl-Shift-S   |Export current file as markdown|
|Ctrl-Shift-O   |Import markdown file from disk |
`,

	about: `# About blankdown

not yet wrote.
`,
};

export default documents;

export const ids = [];
for (const id in documents) {
	ids.push(id);
}
