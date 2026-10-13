const express = require('express');
const router = express.Router();

const serviceController = require('../controllers/serviceController');
const bookingController = require('../controllers/bookingController');
const slotController = require('../controllers/slotController');
const agentController = require('../controllers/agentController');

// Services endpoints
router.get('/services', serviceController.getAllServices);
router.get('/services/:id/slots', serviceController.getServiceSlots);

// Bookings endpoints
router.get('/bookings', bookingController.getBookings);
router.post('/bookings', bookingController.createBooking);
router.put('/bookings/:ref/reschedule', bookingController.rescheduleBooking);
router.delete('/bookings/:ref', bookingController.cancelBooking);

// Retailer slot management & analytics
router.post('/slots/toggle', slotController.toggleBlockSlot);
router.get('/analytics', slotController.getAnalytics);

// Agentic AI Chat endpoint (supports mode: 'customer' | 'retailer')
router.post('/agent/chat', agentController.chatWithAgent);

module.exports = router;
