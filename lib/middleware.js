const jsonErr = () => {
  return async (ctx, next) => {
    ctx.jsonErr = async (status, msg) => {
      try {
        if (typeof status === 'object' || !Number.isInteger(status)) {
          msg = status;
          status = 400;
        }
        if (typeof msg === 'string') {
          msg = { success: false, error: msg };
        } else if (typeof msg === 'object') {
          msg = Object.assign({ success: false }, msg);
        } else {
          msg = { success: false };
        }

        ctx.status = status || 400;
        ctx.body = msg;
      } catch (err) {
        console.warn('[jsonErr]', err);
      }
    };
    await next();
  };
};
const jsonSucc = () => {
  return async (ctx, next) => {
    ctx.jsonSucc = async obj => {
      try {
        if (typeof obj === 'string') {
          obj = { success: true, message: obj };
        } else if (typeof obj === 'object') {
          obj = Object.assign({ success: true }, obj);
        } else {
          obj = { success: true };
        }
        ctx.body = obj;
      } catch (err) {
        console.warn('[jsonErr]', err);
      }
    };
    await next();
  };
};

module.exports = { jsonErr, jsonSucc };
