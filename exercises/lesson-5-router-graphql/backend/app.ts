import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import expensesRouter from './src/routes/expenses.router.ts';
import usersRouter from './src/routes/users.router.ts';
import categoriesRouter from './src/routes/categories.router.ts';
import { createYoga } from 'graphql-yoga';
import { schema } from './src/graphql/schema.ts';

const app = express();

const port = process.env.PORT || 3000;

app.use(logger('dev'));
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', /\.onrender\.com$/] }));

app.get('/ping', (req, res) => {
  res.sendStatus(204);
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  // Yoga ships its own CORS handling, separate from the `cors()` middleware
  // above — and its default reflects back whatever Origin it is sent. Turn
  // it off so /graphql respects the same allowlist as the REST routes.
  cors: false,
  // By default Yoga replaces every resolver error with "Unexpected error." so a
  // production server never leaks internals. In development we want the real one.
  maskedErrors: process.env.NODE_ENV === 'production',
});
app.use(yoga.graphqlEndpoint, yoga);

app.use('/api/expenses', expensesRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

export default app;
