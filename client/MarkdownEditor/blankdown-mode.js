import CodeMirror from 'codemirror';


class TokenSet {
	constructor() {
		this.list = [];
	}

	append() {
		Array.prototype.push.apply(this.list, arguments);
	}

	makeString() {
		return Array.prototype.slice.call(arguments).concat(this.list).join(' ');
	}

	isEmpty() {
		return this.list.length === 0;
	}
}


CodeMirror.defineMode('markdown', function(config, parserConfig) {
	return {
		startState: function() {
			return {
				imageLink: false,
				blobImage: false,
				nextHeader: null,
				listItem: false,
				fencedBlock: null,
				localState: null,
				fencedEnd: null,
				tokens: new TokenSet(),
			};
		},
		innerMode: function(state) {
			if (state.fencedBlock && state.localState) {
				return {state: state.localState, mode: state.fencedBlock};
			} else {
				return {state: state, mode: this};
			}
		},
		token: function(stream, state) {
			if (stream.sol()) {
				state.tokens = new TokenSet();
			}

			if (state.fencedEnd && stream.sol() && stream.match(state.fencedEnd, true)) {
				stream.skipToEnd();
				state.fencedBlock = state.localState = state.fencedEnd = null;
				return 'comment fenced fenced-end';
			} else if (state.localState) {
				const inner = state.fencedBlock.token(stream, state.localState);
				if (inner) {
					return inner + ' fenced';
				}
				return inner;
			} else if (state.fencedBlock) {
				stream.skipToEnd();
				return 'comment fenced';
			}

			if (state.nextHeader !== null) {
				state.tokens.append('header', 'mark', 'header-' + state.nextHeader);
				state.nextHeader = null;
			}

			if (state.listItem) {
				state.listItem = false;
				state.tokens.append('list', 'body');
			}

			if (stream.sol() && stream.match(/\[toc\]$/i, true)) {
				return state.tokens.makeString('toc');
			}

			let match;

			if (stream.sol() && (match = stream.match(/^\s*(```+|~~~+)\s*([^\s]*)$/, true))) {
				if (match[2] === 'markdown' || match[2] === 'md') {
					match[2] = 'blankdown';
				}
				const found = CodeMirror.findModeByName(match[2]);
				state.fencedBlock = CodeMirror.getMode(config, found ? (found.mime || found.mimes[0]) : match[2]);
				state.fencedEnd = new RegExp('^\\s*' + match[1] + '\\s*$');
				if (state.fencedBlock.name !== 'null') {
					state.localState = CodeMirror.startState(state.fencedBlock);
				} else {
					state.localState = null;
				}
				return 'comment fenced fenced-start';
			}

			if (state.imageLink && stream.match(/\(data:(?=.*\))/, true)) {
				state.imageLink = false;
				state.blobImage = true;
				return state.tokens.makeString('image', 'string', 'url', 'blob-image', 'mark');
			}
			if (state.blobImage && stream.eatWhile(x => x !== ')')) {
				return state.tokens.makeString('image', 'string', 'url', 'blob-image', 'body');
			}
			if (state.blobImage && stream.eat(')')) {
				state.blobImage = false;
				return state.tokens.makeString('image', 'string', 'url', 'blob-image', 'mark');
			}

			if (state.imageLink && stream.match(/\(.*\)/, true)) {
				state.imageLink = false;
				return state.tokens.makeString('image', 'string', 'url');
			}
			if (stream.match(/!\[.*?\](?=\(.*?\))/, true)) {
				state.imageLink = true;
				return state.tokens.makeString('image', 'image-alt-text', 'link');
			}

			if (stream.sol() && stream.match(/\s*([-*+]|[0-9]+\.) /, true)) {
				state.listItem = true;
				return state.tokens.makeString('list', 'mark');
			}

			if (stream.match(/\*\*.*?\*\*|__.*?__/, true)) {
				return state.tokens.makeString('strong')
			}

			if (stream.match(/\*.*?\*|_.*?_/, true)) {
				return state.tokens.makeString('em')
			}

			if (stream.match(/~~.*?~~/, true)) {
				return state.tokens.makeString('strikethrough')
			}

			if (stream.sol() && stream.match(/#+ +(?=.*)/, false)) {
				const match = stream.match(/(#+) +/, true);
				const id = stream.match(/.*$/, false)[0].trim().replace(/[^\w]+/g, '-');

				state.tokens.append('header', 'header-' + match[1].length);
				const token = state.tokens.makeString('mark', 'header--' + id);

				state.tokens.append('body');

				return token;
			}

			const nextLine = stream.lookAhead(1);
			if (stream.sol() && !stream.eol() && nextLine) {
				const match = nextLine.match(/^ *(={1,}|-{1,}) *$/);
				if (match && (stream.lookAhead(0).length <= match[1].length || match[1].length >= 3)) {
					state.nextHeader = match[1].startsWith('=') ? 1 : 2;
					const id = stream.lookAhead(0).trim().toLowerCase().replace(/[^\w]+/g, '-');
					stream.skipToEnd();
					return state.tokens.makeString('header', 'body', 'header-' + state.nextHeader, 'header--' + id);
				}
			}

			if (stream.next() == null) {
				return null;
			}
			return state.tokens.makeString();
		},
	};
});

CodeMirror.defineMIME('text/x-markdown', 'markdown');
