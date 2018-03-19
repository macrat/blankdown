import CodeMirror from 'codemirror';
import 'codemirror/mode/meta';


CodeMirror.defineMode('searchbox', function(config, parserConfig) {
	return {
		token(stream, state) {
			if (stream.match(/#\S+/, true)) {
				return 'searchbox-tag';
			}
			if (stream.next() == null) {
				return null;
			}
			return '';
		}
	};
});
