module.exports = [
  {
    path: '/category',
    handler: function (req, res) {
      res.json([]);
    }
  },
  {
    path: '/category/:id',
    method: 'POST',
    handler: function (req, res) {
      res.json({});
    }
  }
];
