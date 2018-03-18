const tagRegExp = /(?:^|\s)#\S+/g


function findTags(markdown) {
	const tags = markdown.match(tagRegExp);
	if (tags === null) {
		return new Set();
	}
	return new Set(tags.map(x => x.slice(x[0] === '#' ? 1 : 2).toLowerCase()).filter(x => !Array.prototype.every.call(x, y => y === '#')));
}


function makeTagTree(tags) {
	const tree = new Map();

	for (const tag of tags) {
		let target = {num: 0, children: tree};
		const parents = [target];

		const subtags = tag[0].split('/');
		for (let i=0; i<subtags.length; i++) {
			const subtag = subtags[i];
			if (!subtag.trim()) {
				continue;
			}

			if (!target.children.has(subtag)) {
				target.children.set(subtag, {num: 0, children: new Map()});
			}
			target = target.children.get(subtag);
			parents.push(target);
		}

		for (let i=0; i<parents.length; i++) {
			parents[i].num += tag[1];
		}
	}

	return tree;
}


export {findTags, makeTagTree};
