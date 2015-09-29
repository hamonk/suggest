var express = require('express');
var app = express();
var http = require('http');
var xml2js = require('xml2js');
var _ = require('underscore');

app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
	res.sendfile('index.html');
});

function subsequent_google_call(list_keywords) {

    list_keywords.forEach(function (item) {
        console.log("susequent call for " + item);
        call_google(item, function(input) {
            //console.log(input);
            result[item] += input;

            console.log(result);
        });
    });

    for (var key in result) {
        if (result.hasOwnProperty(key)) {
            console.log(key + " -> " + result[key]);
        }
    }

}

function call_google(keyword, callback) { 

    var options = {host: 'suggestqueries.google.com',
                   path: '/complete/search?output=toolbar&hl=en&q=' + encodeURIComponent(keyword) + '&gl=us'};

    var gsaReq = http.get(options, function (response) {
        var completeResponse = '';
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
                    console.log('err received...')
                }
                else {
                    var extract = _.pluck(answer['toplevel']['CompleteSuggestion'], 'suggestion');
                    var final_extract = _.map(extract, function(element) {return element[0]["$"]["data"];});
                    //console.log(final_extract);
                    //res.send(final_extract);
                    //res.json(200, {"suggestions": final_extract});
                    result[keyword] = final_extract;
                    //console.log("key:" + keyword + ", res:" + result[keyword]);
                    //console.log(result);
                    callback(final_extract, result);
                    return result;
                }               
            });
        });
    }).on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
}

function call_google_master(keyword, callback) {

    call_google(keyword, subsequent_google_call);
    callback();
}

app.get('/getsuggest/:keyword', function (req, res) {

	console.log('let me call google on that: ' + req.params.keyword);

    var result = {};

    call_google_master(req.params.keyword, function() {
        console.log("HERE IS THE RESULT :" + JSON.stringify(result)); 
        res.status(200).send(result);   
    });
 

});

var server = app.listen(app.get('port'), function () {
	console.log('Node app is running on port', app.get('port'));
});


