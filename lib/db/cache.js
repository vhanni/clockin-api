const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60, checkperiod: 80 });
const crypto = require('crypto');

exports.generateInvite = (email) => {
  return new Promise((resolve, reject) => {
    const randbyte = crypto.randomBytes(16);
    const icode = crypto.createHmac('sha256', randbyte).update(email).digest('hex');
    cache.set(email, icode, 60, (err, success) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(icode);
      }
    });
  });
};

exports.validateInvite = (email, icode) => {
  return new Promise((resolve, reject) => {
    cache.get(email, (err, value) => {
      if (err) {
        return reject(err);
      }
      if (icode !== value) {
        return resolve(false);
      }
      cache.del(email, (emailerr, count) => {
        if (err) {
          return reject(emailerr);
        }
        resolve(true);
      });
    });
  });
};
