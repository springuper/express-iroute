module.exports = [
  {
    handler: (req, res) => {
      res.status(200).json({ posts: req.posts || [] });
    },
    ignoreInterceptors: ['POST'],
    method: 'GET',
    path: '/post',
  },
];
