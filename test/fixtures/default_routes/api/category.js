module.exports = [
  {
    handler: (req, res) => {
      res.json([]);
    },
    method: 'GET',
    path: '/category',
  },
  {
    handler: (req, res) => {
      res.json({});
    },
    method: 'POST',
    path: '/category/:id',
  },
];
