const tagRegExp = /(?:^|\s)#\S+/g


function findTags(markdown) {
	const tags = markdown.match(tagRegExp);
	if (tags === null) {
		return new Set();
	}
	return new Set(tags.map(x => x.slice(x[0] === '#' ? 1 : 2).toLowerCase()).filter(x => !Array.prototype.every.call(x, y => y === '#')));
}


export {findTags};
