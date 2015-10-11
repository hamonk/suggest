var express = require('express');
var app = express();
var http = require('http');
var xml2js = require('xml2js');
var _ = require('underscore');
var async = require('async');

app.use(express.static('public'));
app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
	res.sendfile('index.html');
});

app.get('/getsuggest/:keyword', function (req, res) {

    function subsequent_google_call(err, list_keywords, callback) {

        function simple_print(item) {
            console.log("subsequent search for " + item);
        }
        //list_keywords.forEach(simple_print);
        console.log('start subsequent calls for ' + list_keywords);

        var json_results = {};

        console.log("we set the 1st one to " + req.params.keyword);
        json_results["name"] = "";// req.params.keyword does not fit in the frame
        json_results["children"] = _.map(list_keywords, function(b) {return {'name':b}});

        //console.log("we set the 1st one to " + json_results["name"]);
        
        async.map(list_keywords, call_google, function (err, results) {
        
          json_results["children"] = _.map(results, 
                function (a) {
                    return {"name" : a[0],
                            "children" : _.map(a, 
                                               function(b) {
                                                 return {'name':b};
                                                })
                        }
                });

          console.log("Here" + JSON.stringify(results));
          results = _.map(results, function(a) {return ["<b>" + a[0] + "</b>", a.slice(1, a.length)]});
          html_answer = _.map(results, function(a) {return "<li>"+a+"</li>"});
          html_answer = "<ul>"+html_answer.join("")+"</ul>"

          //console.log("we set the 1st one to " + json_results["name"]);
          callback({'json':json_results, 'html':html_answer});
        });
    }

    function call_google(keyword, callback) { 

        var options = {host: 'suggestqueries.google.com',
                       path: '/complete/search?output=toolbar&hl=fr&q=' + encodeURIComponent(keyword)};
        
        var final_res = [];

        console.log("call google for " + keyword);

        var gsaReq = http.get(options, function (response) {

            var completeResponse = '';

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
                        //console.log("value: " + final_extract[0]);
                        //console.log("callback: " + callback.name);

                        //this is the first call to google
                        if (callback.name == 'subsequent_google_call') {
                            final_res = final_extract;                           
                        }
                        else {
                            final_res = final_res.concat(final_extract);
                            // console.log("key: " + final_extract[0]);
                            // console.log("entry: " + final_extract.slice(1, final_extract.length))
                            // console.log("Here it is: " + JSON.stringify(final_res));

                            // if (final_res.hasOwnProperty("name")) {
                            //     final_res["children"].push({"name":final_extract[0],
                            //                                 "children":_.map(final_extract.slice(1, final_extract.length), 
                            //                                   function(a) {return {"name" : a}})}); 
                            // }
                            // else {
                            //     final_res["name"] = "test";
                            //     final_res["children"] = [];
                            // }                           
                        }
                    }               
                });
                
                callback(null, final_res, function(a) {
                    //var html_answer = _.map(a, function(element) {return "<li>"+element+"</li>";});
                    res.setHeader('Content-Type', 'application/json');
                    //console.log(JSON.stringify(a[0]));
                    //console.log(JSON.stringify(a[1]));
                    res.status(200).send(a);
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


