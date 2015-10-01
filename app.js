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
        // Square each number in the array [1, 2, 3, 4]
        console.log('start subsequent calls for ' + list_keywords);

        async.map(list_keywords, call_google, function (err, results) {
          // Square has been called on each of the numbers
          // so we're now done!
          console.log("Finished!");
          //console.log(results);
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

            response.on('data', function (chunk) {
                completeResponse += chunk;
            });
            response.on('end', function() {
                //console.log(completeResponse);
                var parseString = require('xml2js').parseString;
                parseString(completeResponse, function (err, answer) {
                    
                    if (err) {
                        var message = 'An error occured.';
                        //res.status(200).send(message);
                        console.log('err received...');
                        return callback(err, null);
                    }
                    else {
                        var extract = _.pluck(answer['toplevel']['CompleteSuggestion'], 'suggestion');
                        var final_extract = _.map(extract, function(element) {return element[0]["$"]["data"];});
                        //console.log(final_extract);
                        //res.send(final_extract);
                        //res.json(200, {"suggestions": final_extract});
                        //callback ("<ul><b>"+ keyword + "</b>" + final_extract.join(" ") + "</ul>");
                        final_res = final_res.concat(final_extract);
                        //final_res[0] = "<b>" + final_res[0] + "</b>";                    
                        //console.log("key:" + keyword + ", res:" + result[keyword]);
                        //console.log(result);
                        //callback(final_extract, result);
                        //return result;
                    }               
                });
                //callback(final_res);
                callback(null, final_res, function(a) {
                    var html_answer = _.map(a, function(element) {return "<li>"+element+"</li>";});
                    //html_answer[0] = "<b>" + html_answer[0] + "</b>";
                    res.status(200).send(html_answer);
                    //console.log(_.map(a, function(element) {return "<li>"+element+"</li>";}))
                });

            });
        }).on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });   
    }

	console.log('let me call google on that: ' + req.params.keyword);

    // call_google(req.params.keyword,
    //             function(result) {
    //                 console.log("result: " + JSON.stringify(result));
    //                 res.status(200).send(result);
    //             });
    call_google(req.params.keyword,
                subsequent_google_call);

    //res.status(200).send("we are done, here are the results.");

});

var server = app.listen(app.get('port'), function () {
	console.log('Node app is running on port', app.get('port'));
});


