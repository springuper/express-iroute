module.exports = [
  {
    handler: (req, res, _next) => {
      res.status(200).json({ articles: req.articles || [] });
    },
    interceptors: ['ARTICLE'],
    method: 'GET',
    path: '/article',
  },
];
