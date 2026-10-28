import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import expensesRouter from './src/routes/expenses.router.ts';
import usersRouter from './src/routes/users.router.ts';
import categoriesRouter from './src/routes/categories.router.ts';
import authRouter from './src/routes/auth.router.ts';
import exportsRouter from './src/routes/exports.router.ts';
import { yoga } from './src/graphql/yoga.ts';
import { requireAuth } from './src/middleware/requireAuth.ts';
import { attachExportSocket } from './src/realtime/exportSocket.ts';

// Does this process also run the worker?
//
// Locally: no. You run `npm run dev` here and `npm run worker` in a second
// terminal, so the two are genuinely separate processes that share nothing
// but Redis -- which is the point, and which you can prove by killing one.
//
// On Render: yes, because the free tier has no background-worker instance
// type. Setting RUN_WORKER_IN_API=true there folds the worker into this
// process. It is a deployment compromise, written down as one, rather than a
// design we are pretending to want.
//
// Nothing inside the worker changes either way. It finds its jobs through
// Redis, not through this import.
if (process.env['RUN_WORKER_IN_API'] === 'true') {
  console.log('Running the export worker inside the API process.');
  await import('./src/workers/exports.worker.ts');
}

const app = express();

const port = process.env.PORT || 3000;

app.use(logger('dev'));

// Helmet sets a group of response headers that turn off risky browser
// behaviour. `X-Content-Type-Options: nosniff` stops the browser guessing that
// our JSON is really a script; `X-Frame-Options` stops another site putting our
// responses inside an invisible frame.
//
// A Content-Security-Policy is a different kind of header: it tells a browser
// what an *HTML page* is allowed to load. This server answers JSON, so for
// almost every route a CSP has nothing to govern. We turn it off here and put
// it back on the one route that does serve HTML — see below.
//
// Helmet can do more than this (HSTS, referrer policy, and others). We take its
// defaults and stop there; configuring them properly is a security course, not
// this one.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', /\.onrender\.com$/] }));

app.get('/ping', (req, res) => {
  res.sendStatus(204);
});

// `/graphql` is the one route that answers with an HTML page: GraphiQL, the
// query IDE you have been using since lesson 5. GraphiQL loads its editor from
// a CDN, so it needs a CSP that allows those files — with Helmet's default
// `default-src 'self'` the page stays blank and the console fills with CSP
// errors. These three directives are the ones GraphQL Yoga documents.
//
// Note where it is applied: on this route only, not on the whole app.
app.use(
  yoga.graphqlEndpoint,
  helmet.contentSecurityPolicy({
    directives: {
      'style-src': ["'self'", 'unpkg.com', "'unsafe-inline'"],
      'script-src': ["'self'", 'unpkg.com', "'unsafe-inline'"],
      'img-src': ["'self'", 'raw.githubusercontent.com'],
    },
  }),
  yoga
);

// `/api/auth` is deliberately open — it is where tokens come from.
app.use('/api/auth', authRouter);

// Everything else needs one. The same rule as the GraphQL resolvers, applied
// once here rather than repeated in every route handler.
app.use('/api/expenses', requireAuth, expensesRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/categories', requireAuth, categoriesRouter);

// Mounted without a guard here, unlike the routers above -- not because these
// routes are open, but because they do not all use the *same* guard. The event
// stream reads its token from the query string; everything else reads the
// Authorization header. That choice is made inside the router, next to the
// routes it applies to.
app.use('/api/exports', exportsRouter);

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

// The same export notifications as the SSE route, over a WebSocket at
// /ws/exports. Both transports run here so you can compare them -- the SSE one
// is what the frontend uses; this is the finished state of the optional
// exercise. A real application would pick one and delete the other.
attachExportSocket(server);

export default app;
