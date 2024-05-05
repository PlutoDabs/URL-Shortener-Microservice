require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');

const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const shortUrlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;
  const urlObject = new URL(url);

  dns.lookup(urlObject.hostname, async (err) => {
    if (err) {
      res.json({ error: 'invalid url' });
    } else {
      let shortUrl = await ShortUrl.findOne({ original_url: url });
      if (shortUrl) {
        res.json({ original_url: shortUrl.original_url, short_url: shortUrl.short_url });
      } else {
        shortUrl = new ShortUrl({ original_url: url, short_url: Date.now().toString().slice(-6) });
        await shortUrl.save();
        res.json({ original_url: shortUrl.original_url, short_url: shortUrl.short_url });
      }
    }
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short_url: req.params.short_url });
  if (shortUrl) {
    res.redirect(shortUrl.original_url);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
