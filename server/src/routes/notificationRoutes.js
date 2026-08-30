const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { isRead: true },
      { new: true }
    );
    res.status(200).json({ success: true, data: notif });
  } catch (err) {
    next(err);
  }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ owner: req.user.id }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
