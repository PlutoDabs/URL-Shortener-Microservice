require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB successfully!');
});

const urlSchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: Number
});

const Url = mongoose.model('Url', urlSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', (req, res) => {
  let originalUrl;
  try {
    originalUrl = new url.URL(req.body.url);
  } catch (err) {
    return res.status(400).json({ error: 'invalid url' });
  }

  dns.lookup(originalUrl.hostname, (err) => {
    if (err) {
      return res.status(404).json({ error: 'invalid url' });
    } else {
      Url.countDocuments({}, (err, count) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to count documents' });
        } else {
          const url = new Url({ original: req.body.url, short: count + 1 });
          url.save((err, data) => {
            return err ? res.status(500).json({ error: 'Failed to save to database' }) : res.json({ original_url: data.original, short_url: data.short });
          });
        }
      });
    }
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  Url.findOne({ short: req.params.short_url }, (err, data) => {
    if (!data) {
      return res.status(404).json({ error: 'Invalid short URL' });
    } else {
      return res.redirect(data.original);
    }
  });
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
