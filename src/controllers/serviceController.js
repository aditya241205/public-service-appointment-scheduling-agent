const dataStore = require('../models/dataStore');

exports.getAllServices = (req, res) => {
  try {
    const services = dataStore.getServices();
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getServiceSlots = (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, error: 'Query parameter "date" (YYYY-MM-DD) is required.' });
    }
    const slots = dataStore.getSlots(id, date);
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
