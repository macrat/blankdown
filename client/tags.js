const tagRegExp = /(?:^|\s)#(\S+)/g


function findTags(markdown) {
	const tags = markdown.match(tagRegExp);
	if (tags === null) {
		return [];
	}
	return tags.map(x => x.slice(x[0] === '#' ? 1 : 2));
}


export {findTags};
