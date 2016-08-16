var express = require('express')
var bodyParser = require('body-parser')
var prettyBytes = require('pretty-bytes');
var fs = require('fs');
var marked = require('marked');

var redis = require("redis");
client = redis.createClient();


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

function badgeUrl(size) {
    var label = 'Size (.min.gz)';
    var color = 'blue';
    var slug = [label, size, color].join('-');
    var urlSlug = encodeURI(slug);
    return 'https://img.shields.io/badge/' + urlSlug + '.svg';
}

function sizeBadgeUrl(bytes) {
    var size = prettyBytes(bytes * 1);
    return badgeUrl(size);
}


app.get('/', function (req, res) {
  var path = __dirname + '/index.md';
  var file = fs.readFileSync(path, 'utf8');
  res.send(marked(file.toString()));
});

// POST /api/users gets JSON bodies
app.post('/api/v0/:owner/:repo/master', jsonParser, function (req, res) {
  var key = getKey(req.params.owner, req.params.repo);
  client.set(key, req.body.weight);
  res.send('OK')
})

/*
app.get('/api/v0/:owner/:repo/master', function (req, res) {
  var key = getKey(req.params.owner, req.params.repo);
  client.get(key, function(err, value) {
    var body = {
        weight: value
    };
    res.send(body);
  });
})
*/

app.get('/:owner/:repo/master.svg', function (req, res) {
  var key = getKey(req.params.owner, req.params.repo);
  client.get(key, function(err, value) {
      // Temporarily redirect to Sheilds.io's badges
      if (value) {
          res.redirect(302, sizeBadgeUrl(value));
      } else {
          res.redirect(302, badgeUrl('Unknown'));
      }
  });
})

/*
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
*/

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
