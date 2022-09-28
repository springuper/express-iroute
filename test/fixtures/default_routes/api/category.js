module.exports = [
  {
    path: '/category',
    handler(req, res) {
      res.json([]);
    },
  },
  {
    path: '/category/:id',
    method: 'POST',
    handler(req, res) {
      res.json({});
    },
  },
];
