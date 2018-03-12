const Router = require('koa-router');
const auth = require('../auth/loginAuth');
const gentoken = require('../genToken');
const mailer = require('../mailer');
const crypto = require('crypto');
const config = require('../config');
const router = new Router();

router.post('/auth', async ctx => {
  ctx.validateBody('user').required().isString();
  ctx.validateBody('password').required().isString();
  const user = ctx.vals.user;
  const password = ctx.vals.password;
  const userinfo = auth.getUser(ctx.db, user);
  if (!userinfo) {
    return ctx.jsonErr('user_not_found');
  }
  if (userinfo.pw !== password) {
    return ctx.jsonErr('pw_incorrect');
  }
  ctx.jsonSucc({ token: gentoken(ctx.db, user) });
});
router.post('/invite', async ctx => {
  ctx.validateBody('email').required().isString();
  if (!config.ALLOWED_EMAILS.includes(ctx.vals.email)) {
    return ctx.jsonErr('email_not_allowed');
  }
  const user = ctx.db.get('emailMap', ctx.vals.email);
  if (user) {
    return ctx.jsonErr('email_already_registered');
  }
  const code = crypto.createHmac('sha256', process.env.SECRET).update(ctx.vals.email).digest('hex');
  const res = await mailer(ctx.vals.email, code);
  if (!res) {
    ctx.jsonErr('Inivitation NOT sent');
  }
  ctx.jsonSucc();
});
router.post('/register', async ctx => {
  ctx.validateBody('email').required().isString();
  ctx.validateBody('username').required().isString();
  ctx.validateBody('password').required().isString();
  ctx.validateBody('invite').required().isString();

  if (!config.ALLOWED_EMAILS.includes(ctx.vals.email)) {
    return ctx.jsonErr('email_not_allowed');
  }
  const user = ctx.db.get('emailMap', ctx.vals.email);
  if (user) {
    return ctx.jsonErr('email_already_registered');
  }
  const code = crypto.createHmac('sha256', process.env.SECRET).update(ctx.vals.email).digest('hex');

  if (code === ctx.vals.invite) {
    const countid = ctx.db.count('users');
    ctx.db.set('emailMap', ctx.vals.email, { username: ctx.vals.username });
    ctx.db.set('users', ctx.vals.username, { id: countid + 1, pw: ctx.vals.password, admin: false });
  } else {
    return ctx.jsonErr('Invalid invitation code');
  }
  ctx.jsonSucc();
});

module.exports = router;
