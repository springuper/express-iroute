module.exports = [
  {
    // the "next" argument is required if you want to handle the error coming from upstream handlers
    handler: (err, _res, res, _next) => {
      if (err) {
        res.status(400).send('Authorization Failed');
        return;
      }

      res.status(200).send('Ok');
    },
    method: 'GET',
    path: '/auth',
  },
];
