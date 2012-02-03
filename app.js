var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    
    async = require('async'),
    lfm = require('./lastfm.js');

String.prototype.startsWith = function(s) {
  return this.slice(0, s.length) == s;
}

http.createServer(function (request, response) {
    if (request.url.startsWith('/monthly/')) {
      var query = url.parse(request.url, true).query, data = [];
      
      query.data.split(',').forEach(function(pair) {
        var parts = pair.split('|');
        data.push({username: parts[0], artist: parts[1]});
      });
      console.log(data);

      response.writeHead(200, { 'Content-Type': 'application/json' });
      console.time('Total');
      lfm.getMultipleStats(data, function(stats) {
        console.timeEnd('Total');
        response.end(JSON.stringify(stats), 'utf-8');
      });

      return;
    }
        
    fs.readFile('./monthly.html', function(error, content) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(content, 'utf-8');
    });
    
}).listen(3000);
console.log('Server running at port 3000');