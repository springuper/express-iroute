module.exports = [
  {
    handler: (req, res) => {
      res.status(200).json({ flags: req.interceptorFlags.join(', ') });
    },
    // default path value should be "/"
    path: '',
  },
  {
    handler: (req, res) => {
      res.status(200).json({ flags: req.interceptorFlags.join(', ') });
    },
    method: 'ALL',
    // the slash "/" will be added in the front of the "path" if it doesn't have it
    path: 'flags',
  },
  {
    handler: (req, res) => {
      res.status(200).json({ flags: req.interceptorFlags.join(', '), id: req.params.id });
    },
    // basic rules included in "path-to-regexp" can also work for "path"
    path: '/:id(\\d+)',
  },
];
