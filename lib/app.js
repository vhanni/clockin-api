const logger = require('koa-logger');
const Koa = require('koa');
const json = require('koa-json');
const cors = require('kcors');
const bouncer = require('koa-bouncer');
const mw = require('./middleware');
const app = new Koa();
const config = {
  NODE_ENV: 'development',
  TRUST_PROXY: true,
  PORT: 8337
};
let jsonOpts = { pretty: false, space: '  ' };
app.env = config.NODE_ENV;
app.poweredBy = false;
app.proxy = config.TRUST_PROXY;

app.use(logger());
app.use(json(jsonOpts));
app.use(
  cors({
    allowMethods: ['GET', 'POST'],
    origin: '*',
    maxAge: 24 * 60 * 60 // 24 hours
  })
);
app.use(require('koa-helmet')());
app.use(
  require('koa-bodyparser')({
    extendTypes: { json: ['text/plain'] },
    enableTypes: ['json'],
    onerror (err, ctx) {
      ctx.throw(422, JSON.stringify({ error: 'Error parsing request', err }));
    }
  })
);
app.use(async (ctx, next) => {
  if (typeof ctx.request.body === 'undefined') {
    throw new Error('methodOverride middleware must be applied after the body is parsed and ctx.request.body is populated');
  }
  if (ctx.request.body && ctx.request.body._method) {
    ctx.method = ctx.request.body._method.toUpperCase();
    delete ctx.request.body._method;
  }
  await next();
});
app.use(bouncer.middleware());
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof bouncer.ValidationError) {
      ctx.throw(400, { error: err.message });
    } else if (typeof err === 'string') {
      ctx.throw(400, { error: err });
    } else if (err && err.status) {
      const body = err.body || err.message || 'Unspecified error';
      ctx.throw(err.status, { error: body });
    } else {
      console.log({ error: err.stack || err.message });
      if (!config.isDev) {
        ctx.throw(500, { error: 'INTERNAL_ERROR' });
      } else {
        ctx.throw(500, { error: err.stack || err.message });
      }
    }
    return err;
  }
});

app.use(mw.jsonErr());
app.use(mw.jsonSucc());
app.use(require('./db').start());

app.use(require('./router/public').routes());
app.use(require('./router/private').routes());
app.start = (port = config.PORT) => {
  app.listen(port, () => {
    console.log('Listening on port', port);
  });
};

module.exports = app;
