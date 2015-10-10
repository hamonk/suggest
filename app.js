var express = require('express');
var app = express();
var http = require('http');
var xml2js = require('xml2js');
var _ = require('underscore');
var async = require('async');

app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
	res.sendfile('index.html');
});

app.get('/getsuggest/:keyword', function (req, res) {

    function subsequent_google_call(err, list_keywords, callback) {

        var final_results = {};

        function simple_print(item) {
            console.log("subsequent search for " + item);
        }
        //list_keywords.forEach(simple_print);
        console.log('start subsequent calls for ' + list_keywords);

        async.map(list_keywords, call_google, function (err, results) {
          console.log("Finished!");
          callback(results);

        });
    }

    function call_google(keyword, callback) { 

        var options = {host: 'suggestqueries.google.com',
                       path: '/complete/search?output=toolbar&hl=fr&q=' + encodeURIComponent(keyword)};

        console.log("call google for " + keyword);

        var gsaReq = http.get(options, function (response) {

            var completeResponse = '';
            var final_res = [];

            // from http://stackoverflow.com/questions/3691768/automatic-utf-8-encodeing-in-node-js-http-client
            // node js does not support iso format...
            response.setEncoding('binary');

            response.on('data', function (chunk) {
                completeResponse += chunk;
            });
            response.on('end', function() {
                
                //console.log('HEADERS: ' + JSON.stringify(response.headers));
                //console.log(completeResponse);
                
                var parseString = require('xml2js').parseString;

                parseString(completeResponse, function (err, answer) {
                    
                    //console.log("This is the answer: " + JSON.stringify(answer));

                    if (err) {
                        var message = 'An error occured.';
                        console.log('err received...');
                        return callback(err, null);
                    }
                    else {
                        var extract = _.pluck(answer['toplevel']['CompleteSuggestion'], 'suggestion');
                        var final_extract = _.map(extract, function(element) {return element[0]["$"]["data"];});
                        console.log("value: " + final_extract[0]);
                        console.log("callback: " + callback.name);
                        if (callback.name != 'subsequent_google_call') {
                            final_extract[0] = "<b>" + final_extract[0] + "</b>";
                            final_extract = _.map(final_extract, function(element) {return "<li>" + element + "</li>"})
                        }

                        if (callback.name != 'subsequent_google_call') {
                            final_res = final_extract.join("");
                            final_res = "<ul>" + final_res + "</ul>";
                        }
                        else {
                            final_res = final_res.concat(final_extract);
                        }
                    }               
                });
                
                callback(null, final_res, function(a) {
                    var html_answer = _.map(a, function(element) {return "<li>"+element+"</li>";});
                    res.status(200).send(html_answer);
                });

            });
        }).on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });   
    }

	console.log('let me call google on that: ' + req.params.keyword);

    call_google(req.params.keyword,
                subsequent_google_call);

});

var server = app.listen(app.get('port'), function () {
	console.log('Node app is running on port', app.get('port'));
});


