const lmdb = require('node-lmdb');
const assert = require('assert');
const fs = require('fs');
class Database {
  constructor () {
    this.db = {};
    this.isOpen = false;
    this.db.txns = 0;
    this.dbpath = `${__dirname}/.storage`;
    if (!fs.existsSync(this.dbpath)) {
      fs.mkdirSync(this.dbpath);
    }
    this.open();
  }
  open () {
    if (this.isOpen) {
      return this.db;
    }
    this.db.env = new lmdb.Env();
    this.db.env.open({
      path: this.dbpath,
      create: true,
      maxDbs: 6,
      mapSize: 268435456 * 4096,
      maxReaders: 126
    });
    this.db.users = this.db.env.openDbi({
      name: 'users',
      create: true
    });
    this.db.emailMap = this.db.env.openDbi({
      name: 'emailMap',
      create: true
    });
    this.db.history = this.db.env.openDbi({
      name: 'history',
      create: true
    });
    this.db.session = this.db.env.openDbi({
      name: 'session',
      create: true
    });
    this.db.timein = this.db.env.openDbi({
      name: 'timein',
      create: true
    });
    this.isOpen = true;
  }
  del (dbname, key) {
    this.beginTransaction();
    this.db.txn.del(this.db[dbname], key);
    this.commit();
  }
  close () {
    if (!this.db.env) return false;
    if (!this.isOpen) {
      return false;
    }
    this.db.users.close();
    this.db.email_map.close();
    this.db.history.close();
    this.db.session.close();
    this.db.timein.close();
    this.db.env.close();
    this.isOpen = false;
  }
  commit () {
    this.db.txns -= 1;
    if (this.db.txns == 0) {
      this.db.txn.commit();
      delete this.db.txn;
    }
  }
  abort () {
    this.db.txns = 0;
    this.db.txn.abort();
    delete this.db.txn;
  }
  count (dbname) {
    this.beginTransaction();
    const stat = this.db[dbname].stat(this.db.txn);
    this.commit();
    return stat.entryCount;
  }
  beginTransaction () {
    if (!this.db.txn) {
      this.db.txn = this.db.env.beginTxn();
    }
    this.db.txns += 1;
    return this.db.txn;
  }
  putString (db, key, value) {
    return this.db.txn.putString(db, key, value);
  }
  getString (db, key) {
    return this.db.txn.getString(db, key);
  }
  get (dbname, key) {
    this.beginTransaction();
    const value = this.getString(this.db[dbname], key);
    this.commit();
    return this._parser(value);
  }
  set (dbname, key, value, opts) {
    assert(typeof key === 'string');
    opts = opts || { append: false };
    this.beginTransaction();
    if (opts.append) {
      let dbdata = this.getString(this.db[dbname], key);
      if (!dbdata && opts.type === 'array') {
        dbdata = [];
      } else if (!dbdata && opts.type === 'object') {
        dbdata = {};
      } else {
        dbdata = JSON.parse(dbdata);
      }
      if (opts.type === 'array') {
        dbdata.push(value);
      } else if (opts.type === 'object') {
        dbdata = Object.assign(dbdata, value);
      }
      this.putString(this.db[dbname], key, JSON.stringify(dbdata));
    } else {
      this.putString(this.db[dbname], key, JSON.stringify(value));
    }
    this.commit();
  }
  _parser (value) {
    try {
      return JSON.parse(value);
    } catch (err) {
      return value;
    }
  }
}
const opendb = new Database();

exports.db = opendb;
exports.start = () => async (ctx, next) => {
  ctx.db = opendb;

  await next();
};
