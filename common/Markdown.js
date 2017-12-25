import marked from 'marked';

const renderer = new marked.Renderer();

renderer.heading = function(text, level) {
	const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

	return `<h${level} id="${escapedText}"><a name="${text}" class="anchor" href="#${escapedText}">${text}</a></h${level}>`
};


export default {
	toHTML(data) {
		return marked(data, {
			sanitize: true,
			renderer: renderer,
		});
	},

	getTOCBy(data) {
		const lexer = new marked.Lexer({ sanitize: true });
		const result = [];

		function get(stack, depth) {
			if (depth === 1) {
				return stack;
			}
			if (!stack[stack.length - 1] || !stack[stack.length - 1].push) {
				stack.push([]);
			}
			return get(stack[stack.length - 1], depth - 1);
		}

		lexer.lex(data).filter(x => x.type == 'heading').forEach(x => {
			get(result, x.depth).push(x.text);
		});

		return result;
	},

	getNameBy(data) {
		if (!data) {
			return '';
		}

		const idx = data.indexOf('\n');
		if (idx >= 0) {
			return data.slice(0, idx).trim().replace(/^#+ /, '').trim();
		} else {
			return data.trim().replace(/^#+ /, '').trim();
		}
	},
};
