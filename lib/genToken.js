const crypto = require('crypto');

module.exports = (db, username) => {
  const randbyte = crypto.randomBytes(16);
  const token = crypto.createHmac('sha256', randbyte).update(username).digest('hex');

  const expiration = 24 * 60 * 60 * 1000;
  db.set('session', token, { username, expired: false, expiry: Date.now() + expiration });

  return token;
};
