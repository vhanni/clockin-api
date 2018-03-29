const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60, checkperiod: 80 });
const crypto = require('crypto');

exports.generateInvite = (email, cb) => {
  const randbyte = crypto.randomBytes(16);
  const icode = crypto.createHmac('sha256', randbyte).update(email).digest('hex');
  cache.set(email, icode, 60, (err, success) => {
    if (err) {
      return cb(err);
    } else {
      return cb(null, icode);
    }
  });
};

exports.validateInvite = (email, icode, cb) => {
  cache.get(email, (err, value) => {
    if (err) {
      return cb(err);
    }
    if (icode !== value) {
      return cb('invalid');
    }
    cache.del(email, (err, count) => {
      if (err) {
        return cb(err);
      }
      cb(null);
    });
  });
};
