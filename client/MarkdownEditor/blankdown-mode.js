import CodeMirror from 'codemirror';

import 'codemirror/mode/meta';


class TokenSet {
	constructor() {
		this.list = new Set();
		this.stack = [];
	}

	add() {
		Array.prototype.forEach.apply(arguments, [x => this.list.add(x)]);
	}

	has(token) {
		return this.list.has(token);
	}

	remove() {
		Array.prototype.forEach.apply(arguments, [x => this.list.delete(x)]);
	}

	addStack(token, closer) {
		this.stack.push({
			token: token,
			closer: closer,
		});
	}

	checkStack(stream) {
		if (this.stack.length === 0) {
			return null;
		}

		const top_ = this.stack[this.stack.length-1];
		if (stream.match(top_.closer, true)) {
			this.stack.pop();
			return top_.token;
		}
		return null;
	}

	makeString() {
		return Array.prototype.slice.call(arguments).concat([...this.list], this.stack.map(x => x.token)).join(' ');
	}

	isEmpty() {
		return this.list.length === 0 && this.stack.list === 0;
	}
}


CodeMirror.defineMode('markdown', function(config, parserConfig) {
	return {
		startState: function() {
			return {
				link: null,
				linkMedia: false,
				inlineCode: false,
				fencedBlock: null,
				localState: null,
				fencedEnd: null,
				headerMark: null,
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
				state.link = null;
				state.inlineCode = false;
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

			if (state.headerMark === null) {
				const nextLine = stream.lookAhead(1);
				if (nextLine && stream.sol() && !stream.eol()) {
					const match = nextLine.match(/^(={1,}|-{1,})$/);
					if (match && (stream.lookAhead(0).length <= match[1].length || match[1].length >= 3)) {
						const level = match[1].startsWith('=') ? 1 : 2;
						const id = stream.lookAhead(0).trim().toLowerCase().replace(/[^\w]+/g, '-');
						state.headerMark = level;
						state.tokens.add('header', 'header-' + level, 'header-body', 'header--' + id);
					}
				}
			} else if (stream.sol()) {
				stream.skipToEnd();
				const token = state.tokens.makeString('header', 'header-' + state.headerMark, 'header-mark');
				state.headerMark = null;
				return token;
			}

			if (state.inlineCode) {
				if (stream.eat('`')) {
					state.inlineCode = false;
					return state.tokens.makeString('inline-code', 'inline-code-mark');
				} else {
					stream.eatWhile(x => x !== '`');
					return state.tokens.makeString('inline-code', 'inline-code-body');
				}
			}

			let t;
			if (t = state.tokens.checkStack(stream)) {
				return state.tokens.makeString(t, t + '-mark');
			}

			if (stream.sol() && stream.match(/\[toc\]$/i, true)) {
				return state.tokens.makeString('toc');
			}

			let match;

			if (stream.sol() && (match = stream.match(/^\s*(```+|~~~+)\s*([a-zA-Z0-9]*)$/, true))) {
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

			if (match = stream.match(/(!?)\[(?=.*?\]\(.*?\))/, true)) {
				state.link = 'text';
				state.linkMedia = match[1] !== '';
				state.tokens.add('link', 'media');
				const token = state.tokens.makeString('link-mark');
				state.tokens.add('link-text');
				return token;
			}
			if (state.link === 'text' && (match = stream.match(/\]\((data:)?/i, false))) {
				stream.eat(']');
				stream.eat('(');
				state.link = 'url';
				state.tokens.remove('link-text');
				const token = state.tokens.makeString('link-mark');
				if (state.linkMedia && match[1]) {
					state.tokens.add('blob-media');
				}
				return token;
			}
			if (state.link === 'url' && stream.eatWhile(x => x !== ')')) {
				state.link = 'end';
				return state.tokens.makeString('url');
			}
			if (state.link === 'end' && stream.eat(')')) {
				state.link = null;
				const token = state.tokens.makeString('link-mark');
				state.tokens.remove('link', 'media', 'blob-media');
				return token;
			}

			if (stream.sol() && stream.match(/\s*(?:[-*+](?: \[[ xX]\])?|[0-9]+\.) /, true)) {
				const token = state.tokens.makeString('list', 'list-mark');
				state.tokens.add('list', 'list-body');
				return token;
			}

			if (match = stream.match(/\*\*(?=.*?\*\*)|__(?=.*?__)/, true)) {
				state.tokens.addStack('strong', match[0]);
				return state.tokens.makeString('strong-mark')
			}

			if (match = stream.match(/\*(?=.*?\*)|_(?=.*?_)/, true)) {
				state.tokens.addStack('em', match[0]);
				return state.tokens.makeString('em-mark')
			}

			if (match = stream.match(/~~(?=.*?~~)/, true)) {
				state.tokens.addStack('strikethrough', match[0]);
				return state.tokens.makeString('strikethrough-mark')
			}

			if (match = stream.match(/`(?=.*?`)/, true)) {
				state.inlineCode = true;
				return state.tokens.makeString('inline-code', 'inline-code-mark')
			}

			if (stream.sol() && stream.match(/#+ +(?=.*)/, false)) {
				const match = stream.match(/(#+) +/, true);
				const id = stream.match(/.*$/, false)[0].trim().toLowerCase().replace(/[^\w]+/g, '-');

				state.tokens.add('header', 'header-' + match[1].length);
				const token = state.tokens.makeString('header-mark', 'header--' + id);

				state.tokens.add('header-body');

				return token;
			}

			if (stream.match(/#[^ \t]+/, true)) {
				return state.tokens.makeString('tag');
			}

			if (/^[ \t]*\|(?:.*\|)+[ \t]*$/.test(stream.lookAhead(0))) {
				if (stream.sol() && stream.match('[ \t]', true) || stream.match('[ \t]*$', true)) {
					state.tokens.remove('table');
					return state.tokens.makeString();
				}
				state.tokens.add('table');

				if (!/^[ \t]*\|(?:.*\|)+[ \t]*$/.test(stream.lookAhead(-1))) {
					state.tokens.add('table-header');
				} else if (/^[ \t]*\|(:?-+:?\|)+[ \t]*$/.test(stream.lookAhead(-1))) {
					state.tokens.add('table-first-body');
				} else if (/^[ \t]*\|(:?-+:?\|)+[ \t]*$/.test(stream.lookAhead(0))) {
					state.tokens.add('table-separator');
				}

				if (stream.eat('|')) {
					return state.tokens.makeString('table', 'table-mark');
				}
			}

			if (state.headerMark === null && stream.sol() && stream.match(/---+$/, true)) {
				return state.tokens.makeString('horizontal-line');
			}

			if (stream.next() == null) {
				return null;
			}
			return state.tokens.makeString();
		},
	};
});

CodeMirror.defineMIME('text/x-markdown', 'markdown');
