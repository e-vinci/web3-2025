import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter';
import userRouter from '@/api/user/userRouter';
import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';
import { env } from '@/common/utils/envConfig';
import expenseRouter from './api/expense/expenseRouter';
import transferRouter from './api/transfer/transferRouter';
import transactionRouter from './api/transaction/transactionRouter';
import graphqlMiddleware from './graphql/server';
import { ruruHTML } from 'ruru/server';

const logger = pino({ name: 'server start' });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

if (env.isDevelopment) {
  const config = { endpoint: '/graphql' };
  // Serve Ruru HTML
  app.get('/ruru', (req, res) => {
    res.format({
      html: () => res.status(200).send(ruruHTML(config)),
      default: () => res.status(406).send('Not Acceptable'),
    });
  });
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use('/health-check', healthCheckRouter);

app.use('/api/users', userRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/transfers', transferRouter);
app.use('/api/transactions', transactionRouter);

app.use('/graphql', graphqlMiddleware);

// Error handlers
app.use(errorHandler());

export { app, logger };
