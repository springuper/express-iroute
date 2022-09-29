export default [
  {
    handler: (req, res) => {
      res.status(200).send('Ok');
    },
    method: 'GET',
    path: '/like',
  },
];
