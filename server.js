'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var schema = mongoose.Schema;
var bodyParser = require('body-parser');
var validUrl = require('valid-url');
var dns = require('dns');

var cors = require('cors');
require('dotenv').config();

var app = express();

// Basic Configuration 
var port = process.env.PORTs;

/** this project needs a db !! **/
mongoose.connect(process.env.MONGOLAB_URI, function(err) {
  if(err) throw err;
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({
  extended: true
}));

//Creating schema for url shortener
var urlSchema = new schema({
  id: {
    type: Number,
    unique: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  }
});

var Url = mongoose.model('Url', urlSchema);

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', function (req, res) {
  var URL = req.body.url;
  var id = randomUrl();

  Url.findOne({
    url: URL
  }, function (err, doc) {
    if (doc) {
      id = doc.id;
      res.json({
        original_url: URL,
        short_url: id
      });
    } else {
      if (validUrl.isUri(URL)) {
        Url.create({
          id: id,
          url: URL
        });
        res.json({
          original_url: URL,
          short_url: id
        });
      } else {
        res.json({
          "error": "invalid URL"
        });
      }
    }

  });
});

app.get('/api/shorturl/:shortUrl', function (req, res) {
  var shortUrl = req.params.shortUrl;
  if (shortUrl == "new") {
    res.redirect(req.get('referer'));
  } else if(!/^\d+$/.test(shortUrl)){
    res.json({"error": "Wrong format"});
  } else {
    Url.findOne({
      id: shortUrl
    }, function (err, doc) {
      if (err) {
        res.json({
          "error": err
        });
      } else {
        if (doc) {
          res.redirect(doc.url);
        } else {
          res.json({
            "error": "URL not found"
          });
        }

      }
    });
  }

});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({
    greeting: 'hello API'
  });
});

app.get("*", function(req, res) {
  res.send("Page not found");
});



app.listen(port, function () {
  console.log('Node.js listening ...');
});

function randomUrl() {
  var num = 10000;
  return Math.floor(Math.random() * num);
}