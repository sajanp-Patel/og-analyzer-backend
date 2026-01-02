const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function extractSocialMeta(url) {
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(data);

    const meta = {};

    // Open Graph (Facebook, Slack)
    $('meta[property^="og:"]').each((_, el) => {
      const key = $(el).attr('property');
      const value = $(el).attr('content');
      if (key && value) meta[key] = value;
    });

    // Twitter Cards
    $('meta[name^="twitter:"]').each((_, el) => {
      const key = $(el).attr('name');
      const value = $(el).attr('content');
      if (key && value) meta[key] = value;
    });

    // Fallback image (Slack / generic)
    const fallbackImage =
      meta['og:image'] ||
      meta['twitter:image'] ||
      $('meta[name="image"]').attr('content') ||
      '';

    return {
      success: true,
      url,
      previews: {
        facebook: {
          title: meta['og:title'] || '',
          description: meta['og:description'] || '',
          image: meta['og:image'] || ''
        },
        twitter: {
          card: meta['twitter:card'] || '',
          title: meta['twitter:title'] || meta['og:title'] || '',
          description: meta['twitter:description'] || meta['og:description'] || '',
          image: meta['twitter:image'] || meta['og:image'] || ''
        },
        slack: {
          image: fallbackImage
        }
      },
      raw: meta
    };

  } catch (err) {
    return {
      success: false,
      url,
      error: 'Unable to fetch social meta tags'
    };
  }
}

app.post('/analyze', async (req, res) => {
  const urls = req.body.urls || [];
  const results = [];

  for (let url of urls) {
    if (url.trim()) {
      results.push(await extractSocialMeta(url.trim()));
    }
  }

  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
