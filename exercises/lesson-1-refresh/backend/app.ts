import cors from 'cors';
import express from 'express';
import logger from 'morgan';
import expensesRouter from './routes/expenses.ts';

const app = express();

app.use(logger('dev'));
app.use(express.json());
// Only allow requests from the Vite dev server's origin - see the lesson's CORS note if
// Vite ended up on a different port (5174, ...) because 5173 was already taken.
app.use(cors({ origin: ['http://localhost:5173'] }));

app.get('/ping', (req, res) => {
  res.sendStatus(204);
});

app.use('/api', expensesRouter);

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});

export default app;
