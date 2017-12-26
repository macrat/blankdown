export default function(re, func) {
	this.re = re;

	this.find = function(text, range) {
		const founds = [];

		this.re.lastIndex = 0;

		const cm = this.editor;

		const indexOffset = range && range.from ? cm.indexFromPos(range.from) : 0;

		let match;
		while ((match = this.re.exec(text)) && match) {
			const tokens = new Set();
			for (let i=match.index; i<=match.index + match[0].length; i++) {
				const ts = cm.getTokenTypeAt(cm.posFromIndex(indexOffset + i));
				if (ts) {
					ts.split(' ').forEach(x => tokens.add(x));
				}
			}

			const props = func(cm, match, tokens);

			if (!props) {
				continue;
			}

			founds.push({
				start: match.index,
				end: match.index + match[0].length,
				props: props,
			});
		}

		return founds;
	};
};
