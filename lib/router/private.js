const Router = require('koa-router');
const ensureUser = require('../ensureUser');
const router = new Router({ prefix: '/me' });
const config = require('../config');
router.use(ensureUser());

router.post('/timein', async ctx => {
  let timein = ctx.db.get('timein', ctx.state.user);
  if (!timein) {
    const ts = new Date();
    const currHours = ts.getHours();
    const currMins = ts.getMinutes();
    let isLate = false;
    if (currHours > config.TIMEIN_LIMIT) {
      isLate = true;
    }
    if (currHours === config.TIMEIN_LIMIT && currMins > 0) {
      isLate = true;
    }
    ctx.db.set('timein', ctx.state.user, { ts, late: isLate });
  } else {
    return ctx.jsonErr('You already have a pending timein!');
  }
  ctx.jsonSucc();
});
router.post('/timeout', async ctx => {
  let timein = ctx.db.get('timein', ctx.state.user);
  if (!timein) {
    return ctx.jsonErr('You don\'t have a pending timein!');
  } else {
    ctx.db.set('history', ctx.state.user, { timein: timein.ts, timeout: new Date(), late: timein.late }, { append: true, type: 'array' });
    ctx.db.del('timein', ctx.state.user);
  }
  ctx.jsonSucc();
});
router.get('/history', async ctx => {
  let history = ctx.db.get('history', ctx.state.user) || [];
  history = history.map(v => { v.username = ctx.state.user; return v; });
  let pending = ctx.db.get('timein', ctx.state.user);
  if (pending) {
    pending.username = ctx.state.user;
    pending.timein = pending.ts;
    delete pending.ts;
  } else {
    pending = {};
  }
  ctx.jsonSucc({ history, pending });
});

router.get('/user', async ctx => {
  let uinfo = ctx.db.get('users', ctx.state.user) || {};

  ctx.jsonSucc({ userinfo: { username: ctx.state.user, admin: uinfo.admin, user_id: uinfo.id } });
});
module.exports = router;
