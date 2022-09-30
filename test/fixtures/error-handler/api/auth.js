module.exports = [
  {
    //
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
