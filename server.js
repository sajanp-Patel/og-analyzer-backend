const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function extractOG(url) {
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(data);

    const og = {};
    $('meta[property^="og:"]').each((_, el) => {
      og[$(el).attr('property')] = $(el).attr('content') || '';
    });

    return {
      success: true,
      url,
      og
    };
  } catch (error) {
    return {
      success: false,
      url,
      error: 'Unable to fetch Open Graph data'
    };
  }
}

app.post('/analyze', async (req, res) => {
  const urls = req.body.urls || [];
  const results = [];

  for (let url of urls) {
    if (url.trim()) {
      results.push(await extractOG(url.trim()));
    }
  }

  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});