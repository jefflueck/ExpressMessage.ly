const Message = require('../models/message');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
// * My code:
// router.get('/:id', async (req, res, next) => {
//   try {
//     let message = await Message.get(req.params.id);
//     ensureCorrectUser(req, message.from_user.username);
//     return res.json({ message });
//   } catch (err) {
//     return next(err);
//   }
// });

// * Solution code:
router.get('/:id', ensureLoggedIn, async function (req, res, next) {
  try {
    let username = req.user.username;
    let msg = await Message.get(req.params.id);

    if (
      msg.to_user.username !== username &&
      msg.from_user.username !== username
    ) {
      throw new ExpressError('Cannot read this message', 401);
    }

    return res.json({ message: msg });
  } catch (err) {
    return next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', async (req, res, next) => {
  try {
    let message = await Message.create(req.body);
    return res.json({ message });
  } catch (err) {
    return next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
// * My code:
// router.post('/:id/read', async (req, res, next) => {
//   try {
//     let message = await Message.read(req.params.id);
//     return res.json({ message });
//   } catch (err) {
//     return next(err);
//   }
// });

// * Solution code:
router.post('/:id/read', ensureLoggedIn, async function (req, res, next) {
  try {
    let username = req.user.username;
    let msg = await Message.get(req.params.id);

    if (msg.to_user.username !== username) {
      throw new ExpressError('Cannot set this message to read', 401);
    }
    let message = await Message.markRead(req.params.id);

    return res.json({ message });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
