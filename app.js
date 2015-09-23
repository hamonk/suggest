var express = require('express');
var app = express();
var http = require('http');
var xml2js = require('xml2js');
var _ = require('underscore');

app.get('/', function (req, res) {
	res.sendfile('index.html');
});

app.get('/getsuggest/:keyword', function (req, res) {

	console.log('let me call google on that: ' + req.params.keyword);

	var options = {host: 'suggestqueries.google.com',
        		   path: '/complete/search?output=toolbar&hl=en&q=' + req.params.keyword + '&gl=us'};

    var gsaReq = http.get(options, function (response) {
        var completeResponse = '';
        response.on('data', function (chunk) {
            completeResponse += chunk;
        });
        response.on('end', function() {
            //console.log(completeResponse);
            var parseString = require('xml2js').parseString;
            parseString(completeResponse, function (err, result) {
			    
			    var extract = _.pluck(result['toplevel']['CompleteSuggestion'], 'suggestion');
			    var final_extract = _.map(extract, function(element) {return "<li>"+element[0]["$"]["data"]+"</li>";});
			    console.log(final_extract);
			    //res.send(final_extract);
			    //res.json(200, {"suggestions": final_extract});
			    res.status(200).send(final_extract);
							    
			});
        })
    }).on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
});

// accept POST request on the homepage
app.post('/', function (req, res) {
  res.send('Got a POST request');
});

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});


