module.exports = [
  {
    handler: (req, res) => {
      res.status(200).send('Ok');
    },
    method: 'GET',
    path: '/user',
  },
];
