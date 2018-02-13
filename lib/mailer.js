const Mailgun = require('mailgun-js');
const api_key = process.env.EMAIL_KEY;
const domain = process.env.EMAIL_DOMAIN;
const from_who = process.env.EMAIL;
const mailgun = new Mailgun({ apiKey: api_key, domain });

const send = data => new Promise((resolve, reject) => {
  mailgun.messages().send(data, (err, body) => {
    if (err) {
      console.log(err.stack || err.message || err);
      reject(err);
    } else {
      resolve(body);
    }
  });
});

module.exports = async (email, code) => {
  const data = {
    from: from_who,
    to: email,
    subject: '✔ ClockIn Invitation Code ✔',
    html: `<p>Your invitation code is: <b>${code}</b></p>`
  };
  return await send(data);
};
