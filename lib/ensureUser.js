const tokenAuth = require('./auth/tokenAuth');
module.exports = () => async (ctx, next) => {
  let token = ctx.get('authorization');
  token = token.split(' ');
  token = token.pop();
  if (!token) {
    return ctx.jsonErr('TOKEN_MISSING');
  }
  const userinfo = tokenAuth(ctx.db, token);
  if (!userinfo) {
    return ctx.jsonErr('TOKEN_EXPIRED');
  }
  ctx.state.user = userinfo.username;
  await next();
};
