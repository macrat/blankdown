const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
	console.log(new Date(), req.url);
	fs.readFile('index.html', (err, data) => {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(data);
	});
}).listen(process.env.PORT || 8000, () => {
	console.log(`running at http://localhost:${server.address().port}`)
});
