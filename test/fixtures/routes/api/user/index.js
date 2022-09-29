module.exports = [
  {
    handler: (req, res) => {
      res.status(200).json({ flags: req.interceptorFlags.join(', ') });
    },
    path: '/',
  },
  {
    handler: (req, res) => {
      res.status(200).json({ flags: req.interceptorFlags.join(', ') });
    },
    method: 'ALL',
    path: '/flags',
  },
  {
    handler: (req, res) => {
      res.status(200).json({ flags: req.interceptorFlags.join(', '), id: req.params.id });
    },
    path: '/:id(\\d+)',
  },
];
