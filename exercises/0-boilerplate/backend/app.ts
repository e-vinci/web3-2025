import express from 'express';
import logger from 'morgan';

const app = express();

app.use(logger('dev'));
app.use(express.json());

app.get('/ping', (req, res) => {
  res.sendStatus(204);
});

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});

export default app;
