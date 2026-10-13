const dataStore = require('../models/dataStore');

exports.toggleBlockSlot = (req, res) => {
  try {
    const { serviceId, date, time, action } = req.body;
    const result = dataStore.toggleBlockSlot({ serviceId, date, time, action });
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getAnalytics = (req, res) => {
  try {
    const analytics = dataStore.getAnalytics();
    res.json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
