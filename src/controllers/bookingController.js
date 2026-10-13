const dataStore = require('../models/dataStore');

exports.getBookings = (req, res) => {
  try {
    const { query, date, status, serviceId } = req.query;
    const bookings = dataStore.findBookings({ query, date, status, serviceId });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createBooking = (req, res) => {
  try {
    const { serviceId, date, time, name, email } = req.body;
    const booking = dataStore.createBooking({ serviceId, date, time, name, email });
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.rescheduleBooking = (req, res) => {
  try {
    const { ref } = req.params;
    const { newDate, newTime } = req.body;
    const booking = dataStore.rescheduleBooking({ ref, newDate, newTime });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.cancelBooking = (req, res) => {
  try {
    const { ref } = req.params;
    const { reason } = req.body || {};
    const booking = dataStore.cancelBooking({ ref, reason });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
