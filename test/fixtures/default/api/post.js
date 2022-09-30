module.exports = [
  {
    handler: (req, res) => {
      res.status(200).json({ posts: req.posts || [] });
    },
    ignoreInterceptors: ['POST', 'DOING_NOTHING'],
    method: 'GET',
    path: '/post',
  },
];
