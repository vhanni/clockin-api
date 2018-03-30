const Router = require('koa-router');
const auth = require('../auth/loginAuth');
const invitecache = require('../db/cache');
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
  ctx.validateBody('email').required('email_is_required').isString('email_not_allowed');
  if (!config.ALLOWED_EMAILS.includes(ctx.vals.email.replace(/\+.+(?=@)/, ''))) {
    return ctx.jsonErr('email_not_allowed');
  }
  const user = ctx.db.get('emailMap', ctx.vals.email);
  if (user) {
    return ctx.jsonErr('email_already_registered');
  }
  try {
    const code = await invitecache.generateInvite(ctx.vals.email);
    const res = await mailer(ctx.vals.email, code);
    if (!res) {
      ctx.jsonErr('Invitation_not_sent');
    }
    return ctx.jsonSucc();
  } catch (err) {
    console.error(err.stack || err.message);
    return ctx.jsonErr('Internal_error_occured');
  }
});

router.post('/register', async ctx => {
  ctx.validateBody('email').required('email_is_required').isString();
  ctx.validateBody('username').required('username_is_required').isString().trim()
    .isLength(6, 16, 'username_must_be_3_to_15_characters');
  ctx.validateBody('password').required('password_is_required').isString().trim()
    .isLength(7, 200, 'password_must_be_3_to_200_characters_long');
  ctx.validateBody('invite').required('invite_is_required').isString().trim()
    .match(/[0-9a-f]{64}/i, 'Invalid_invitation_code');

  if (!config.ALLOWED_EMAILS.includes(ctx.vals.email.replace(/\+.+(?=@)/, ''))) {
    return ctx.jsonErr('email_not_allowed');
  }
  const useremail = ctx.db.get('emailMap', ctx.vals.email);
  if (useremail) {
    return ctx.jsonErr('email_already_registered');
  }
  const uname = ctx.db.get('users', ctx.vals.username);
  if (uname) {
    return ctx.jsonErr('username_already_registered');
  }
  try {
    const res = await invitecache.validateInvite(ctx.vals.email, ctx.vals.invite);
    if (res) {
      const countid = ctx.db.count('users');
      ctx.db.set('emailMap', ctx.vals.email, { username: ctx.vals.username });
      ctx.db.set('users', ctx.vals.username, { id: countid + 1, pw: ctx.vals.password, admin: false });
      return ctx.jsonSucc();
    } else {
      return ctx.jsonErr('Invalid_invitation_code');
    }
  } catch (err) {
    console.error(err.stack || err.message);
    return ctx.jsonErr('Invalid_invitation_code');
  }
});

module.exports = router;
