module.exports = [
  {
    handler(req, res) {
      res.json({ flags: req.interceptorFlags.join(', ') });
    },
    method: 'GET',
    path: '/flags',
  },
];
