module.exports = (db, token) => {
  let tokeninfo = db.get('session', token);
  if (!tokeninfo) {
    return false;
  }
  if (tokeninfo.expired == true || tokeninfo.expiry < Date.now()) {
    return false;
  }
  return tokeninfo;
};
