const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');


const app = express();
app.use(cors());


const newspapers = [
  {
    name: 'TechCrunch',
    address: 'https://techcrunch.com/category/artificial-intelligence/',
    base: ''
  },
  {
    name: 'Mashable',
    address: 'https://mashable.com/category/artificial-intelligence',
    base: 'https://mashable.com'
  },
  {
    name: 'ZDNet',
    address: 'https://www.zdnet.com/topic/artificial-intelligence/',
    base: 'https://www.zdnet.com'
    },
  {
    name: 'AnalyticsIndiaMagazine',
    address: 'https://analyticsindiamag.com/',
    base: ''
  },
];

const articles = [];

newspapers.forEach(newspaper => {
  axios.get(newspaper.address)
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);

      $('a:contains("AI"), a:contains("artificial-intelligence")', html).each(function () {
        const title = $(this).text().trim().replace(/[\n\t]+/g, '');
        const url = $(this).attr('href');
        const img = findNearestImgSrc($(this))

        // let img
        // if ($(this).parent().find('img').attr('src')) {
        //   img = $(this).parent().find('img').attr('src')
        // } else if ($(this).parent().parent().find('img').attr('src')) {
        //   img = $(this).parent().parent().find('img').attr('src')
        // }
        // lets make a function called findNearestImgSrc 
        const cleanTitle = title.replace(/<[^>]+>/g, '');

        if (cleanTitle && cleanTitle.length > 20) {
          articles.push({
            title: cleanTitle,
            url: newspaper.base + url,
            img: img,
            source: newspaper.name
          });
        }
      });
    })
    .catch(error => {
      console.error(`Error fetching articles from ${newspaper.name}:`, error);
    });
});

function findNearestImgSrc(element) {
  let img
  let currentElement = element;
  while (!img) {
    if (currentElement.find('img').attr('src')) {
      return  img = currentElement.find('img').attr('src')
    } else {
      currentElement = currentElement.parent();
    }
  }
  return null; // Return null if no img element is found in the ancestors
}

app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to The AI News API',
      github: 'https://github.com/BasharSubh/API-AINews',
      author: 'Bashar Subh',
      open_source: true,
      api_version: '1.0.0',
      documentation: 'https://github.com/BasharSubh/API-AINews#readme',
      endpoints: [
        {
          url: '/ai',
          description: 'Get all AI articles up to date',
        },
        {
          url: '/ai/:newspaperName',
          description: 'Get AI articles from a specific newspaper',
          parameters: [
            {
              name: 'newspaperName',
              type: 'string',
              description: 'The Name of the newspaper',
            },
          ],
        },
      ],
    });
  });
  
  

app.get('/ai', (req, res) => {
  res.json(articles);
});

app.get('/ai/:newspaperName', (req, res) => {
  const newspaperName = req.params.newspaperName;

  const newspaper = newspapers.find(newspaper => newspaper.name.toLowerCase() === newspaperName.toLowerCase());

  if (!newspaper) {
    return res.status(404).json({ error: 'Newspaper not found' });
  }

  axios.get(newspaper.address)
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);
      const specificArticles = [];

      $('a:contains("AI"), a:contains("artificial-intelligence")', html).each(function () {
        const title = $(this).text().trim().replace(/[\n\t]+/g, '');
        const url = $(this).attr('href');
        const img = findNearestImgSrc($(this))

        const cleanTitle = title.replace(/<[^>]+>/g, '');

        specificArticles.push({
          title: cleanTitle,
          url: newspaper.base + url,
          img: img,
          source: newspaperName
        });
      });

      res.json(specificArticles);
    })
    .catch(error => {
      console.error(`Error fetching articles from ${newspaper.name}:`, error);
      res.status(500).json({ error: 'An error occurred while fetching articles' });
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
