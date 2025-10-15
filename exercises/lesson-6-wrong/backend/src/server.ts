import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { ruruHTML } from 'ruru/server';
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
import authRouter from './api/auth/authRouter';

const logger = pino({ name: 'server start' });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

// Ruru GraphQL playground (only in development)
if (env.isDevelopment) {
  const config = { endpoint: '/graphql' };
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

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline only for dev
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // For development with external resources
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use('/health-check', healthCheckRouter);

app.use('/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/transfers', transferRouter);
app.use('/api/transactions', transactionRouter);

// GraphQL endpoint
app.use('/graphql', graphqlMiddleware);

// Error handlers
app.use(errorHandler());

export { app, logger };
