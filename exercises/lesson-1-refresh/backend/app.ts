import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import expensesRouter from './routes/expenses.router.ts';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', /\.onrender\.com$/] }));

app.get('/ping', (req, res) => {
  res.sendStatus(204);
});

app.use('/api/expenses', expensesRouter);

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});

export default app;
