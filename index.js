var express = require('express')
var bodyParser = require('body-parser')
var prettyBytes = require('pretty-bytes');
var fs = require('fs');
var marked = require('marked');
var comment = require('./github').comment;

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

app.get('/api/v0/:owner/:repo/master', function (req, res) {
  var key = getKey(req.params.owner, req.params.repo);
  client.get(key, function(err, value) {
    var body = {
        weight: value
    };
    res.send(body);
  });
})

app.get('/:owner/:repo/master.svg', function (req, res) {
  var key = getKey(req.params.owner, req.params.repo);
  client.get(key, function(err, value) {
      // Temporarily redirect to Sheilds.io's badges
      if (value) {
          // Instruct GitHub to not cache
          // https://github.com/github/markup/issues/224
          res.set('Cache-Control', 'no-cache');
          res.set('ETag', value);
          res.redirect(302, sizeBadgeUrl(value));
      } else {
          res.redirect(302, badgeUrl('Unknown'));
      }
  });
})

app.post('/api/v0/:owner/:repo/pulls/:pull', jsonParser, function (req, res) {
  var key = getKey(req.params.owner, req.params.repo, req.params.pull);
  client.set(key, req.body.weight);
  // TODO: enqueue this
  report(req.params.owner, req.params.repo, req.params.pull);
  res.send('OK')
})

function report(owner, repo, pull) {
  var pullKey = getKey(owner, repo, pull);
  var masterKey = getKey(owner, repo);

  client.get(pullKey, function(err, pullValue) {
    client.get(masterKey, function(err, masterValue) {
        var diff = pullValue - masterValue;
        var message;
        if (diff === 0) {
            message = "The minified/gzipped build size is not changed by this pull request.";
        } else {
            var changed = diff > 0 ? 'increased' : 'decreased'
             message = "The minified/gzipped build size " + changed + " by (__" + prettyBytes(diff) + "__) to __" + prettyBytes(pullValue * 1) + "__.";
        }
        comment(owner, repo, pull, message);
    });
  });
};

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
