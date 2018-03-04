function push(target, depth, text) {
	if (depth === 1) {
		target.push(text);
		return;
	}

	if (!target[target.length - 1] || !target[target.length - 1].push) {
		target.push([]);
	}
	push(target[target.length - 1], depth - 1, text);
}


function parseTOC(markdown) {
	const result = [];

	const lines = markdown.split('\n');
	for (let i=0; i<lines.length; i++) {
		const match = /^(#+)[ \t]+(.*)$/.exec(lines[i]);
		if (match) {
			push(result, match[1].length, match[2]);
			continue;
		}

		if (lines[i].trim().length > 0) {
			const next = /^(=+|-+)$/.exec(lines[i + 1]);
			if (next && (lines[i].length <= next[1].length || next[1].length >= 3)) {
				push(result, next[1].startsWith('=') ? 1 : 2, lines[i]);
				i += 1;
			}
		}
	}

	return result;
}


function toc2html(toc) {
	return '<ul>' + toc.map(x => {
		if (typeof x === 'string') {
			return `<li><a href="#${x.replace(/[^\w]+/g, '-').toLowerCase()}">${ x.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;') }</a></li>`;
		} else {
			return toc2html(x);
		}
	}).join('') + '</ul>';
}


function makeTOCHTML(markdown) {
	return toc2html(parseTOC(markdown));
}


export {parseTOC, toc2html, makeTOCHTML};
