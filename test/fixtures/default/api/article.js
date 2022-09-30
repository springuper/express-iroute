module.exports = [
  {
    handler: (req, res, _next) => {
      res.status(200).json({ articles: req.articles || [] });
    },
    interceptors: ['ARTICLE', 'DOING_NOTHING'],
    method: 'GET',
    path: '/article',
  },
];
