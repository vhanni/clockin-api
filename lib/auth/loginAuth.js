exports.getUser = (db, username) => {
  const userinfo = db.get('users', username);
  if (!userinfo) {
    return false;
  }
  return userinfo;
};
