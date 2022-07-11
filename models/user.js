/** User class for message.ly */
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const db = require('../db');
const expressError = require('../expressError');

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp) RETURNING username, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]
    );
    if (results.rows.length === 0) {
      throw new expressError(`User: ${username} not found`, 404);
    }
    const hashedPassword = results.rows[0].password;
    return bcrypt.compare(password, hashedPassword);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(
      `UPDATE users SET last_login_at = current_timestamp WHERE username = $1 RETURNING username`,
      [username]
    );
    if (results.rows.length === 0) {
      throw new expressError(`User: ${username} not found`, 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`SELECT * FROM users`);
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);
    if (results.rows.length === 0) {
      throw new expressError(`User: ${username} not found`, 404);
    }
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT * FROM messages WHERE from_username = $1`,
      [username]
    );
    return results.rows;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT * FROM messages WHERE to_username = $1`,
      [username]
    );
    return results.rows;
  }
}

module.exports = User;
