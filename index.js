var express = require('express')
var bodyParser = require('body-parser')

var redis = require("redis");
client = redis.createClient();

var prettyBytes = require('pretty-bytes');

var app = express()

// create application/json parser
var jsonParser = bodyParser.json()

function getKey(owner, repo, pull, bundle) {
    var segments = [
        'weights',
        owner,
        repo
    ];
    if (pull) {
        segments = segments.concat(['pull', pull]);
    } else {
        segments.push('master');
    }

    segments.push(bundle || 'default');

    return segments.join(':');
}

// POST /api/users gets JSON bodies
app.post('/api/v0/:owner/:repo/master', jsonParser, function (req, res) {
  var key = getKey(req.params.owner, req.params.repo);
  client.set(key, req.body.weight);
  res.send('OK')
})

app.get('/api/v0/:owner/:repo/master', function (req, res) {
  var key = getKey(req.params.owner, req.params.repo);
  client.get(key, function(err, value) {
    var body = {
        weight: value
    };
    res.send(body);
  });
})

app.post('/api/v0/:owner/:repo/pull/:pull', jsonParser, function (req, res) {
  var key = getKey(req.params.owner, req.params.repo, req.params.pull);
  client.set(key, req.body.weight);
  res.send('OK')
})

app.get('/api/v0/:owner/:repo/pull/:pull', function (req, res) {
  var pullKey = getKey(req.params.owner, req.params.repo, req.params.pull);
  var masterKey = getKey(req.params.owner, req.params.repo);

  client.get(pullKey, function(err, pullValue) {
    client.get(masterKey, function(err, masterValue) {
        var diff = pullValue - masterValue;
        var body = {
            master: masterValue,
            pull: pullValue,
            diff: diff,
            prettyDiff: prettyBytes(diff)
        };
        res.send(body);
    });
  });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
