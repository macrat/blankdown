import CodeMirror from 'codemirror';

import _ from 'codemirror/mode/gfm/gfm.js';
import _ from 'codemirror/addon/mode/overlay.js';


CodeMirror.defineMode('blankdown', function(config, parserConfig) {
	return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || 'gfm'), {
		startState: function() {
			return {
				imageLink: false,
				blobImage: false,
				nextHeader: null,
				fencedBlock: null,
				localState: null,
				fencedEnd: null,
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
				stream.skipToEnd();
				const tokens = 'header mark header-' + state.nextHeader;
				state.nextHeader = null;
				return tokens;
			}

			if (stream.sol() && stream.match(/\[toc\]$/i, true)) {
				return 'toc';
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
				return 'image string url blob-image mark';
			}
			if (state.blobImage && stream.eatWhile(x => x !== ')')) {
				return 'image string url blob-image body';
			}
			if (state.blobImage && stream.eat(')')) {
				state.blobImage = false;
				return 'image string url blob-image mark';
			}

			if (state.imageLink && stream.match(/\(.*\)/, true)) {
				state.imageLink = false;
				return 'image string url';
			}
			if (stream.match(/!\[.*?\](?=\(.*?\))/, true)) {
				state.imageLink = true;
				return 'image image-alt-text link';
			}

			if (stream.sol() && stream.match(/#+ +(?=.*)/, false)) {
				const match = stream.match(/(#+) +/, true);
				const id = stream.match(/.*$/, false)[0].trim().replace(/[^\w]+/g, '-');
				return 'header mark header-' + match[1].length + ' ' + ('header--' + id);
			}

			const nextLine = stream.lookAhead(1);
			if (stream.sol() && !stream.eol() && nextLine) {
				const match = nextLine.match(/^ *(={1,}|-{1,}) *$/);
				if (match) {
					state.nextHeader = match[1].startsWith('=') ? 1 : 2;
					const id = stream.lookAhead(0).trim().toLowerCase().replace(/[^\w]+/g, '-');
					stream.skipToEnd();
					return 'header body header-' + state.nextHeader + ' ' + ('header--' + id);
				}
			}

			if (stream.next() == null) {
				return null;
			}
			return null;
		},
	});
});
