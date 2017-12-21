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
			};
		},
		token: function(stream, state) {
			while (true) {
				if (state.nextHeader !== null) {
					stream.skipToEnd();
					const tokens = 'header mark header-' + state.nextHeader;
					state.nextHeader = null;
					return tokens;
				}

				const nextLine = stream.lookAhead(1);
				if (stream.sol() && !stream.eol() && nextLine) {
					const match = nextLine.match(/^ *(={1,}|-{1,}) *$/);
					if (match) {
						state.nextHeader = match[1].startsWith('=') ? 1 : 2;
						stream.skipToEnd();
						return 'header body header-' + state.nextHeader;
					}
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
					console.log(match);
					return 'header mark header-' + match[1].length;
				}

				if (stream.next() == null) {
					break;
				}
			}
			return null;
		},
	});
});
