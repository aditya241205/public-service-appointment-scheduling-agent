const dataStore = require('../../models/dataStore');

const retailerToolSchemas = [
  {
    type: 'function',
    function: {
      name: 'get_daily_schedule',
      description: 'Get all scheduled appointments and slot bookings for a particular date.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Date in YYYY-MM-DD format (defaults to today if omitted).'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_all_appointments',
      description: 'Search and filter all center appointments by status, service, date, or query string.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword (name, ref, email)' },
          status: { type: 'string', description: 'Filter by "confirmed" or "cancelled"' },
          serviceId: { type: 'string', description: 'Filter by service ID' },
          date: { type: 'string', description: 'Filter by date YYYY-MM-DD' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'block_or_unblock_slot',
      description: 'Block or unblock a specific time slot on a date (e.g. for officer absence, lunch, or maintenance).',
      parameters: {
        type: 'object',
        properties: {
          serviceId: { type: 'string', description: 'Service ID (e.g. "documents")' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          timeSlot: { type: 'string', description: 'Time slot string (e.g. "1:30 PM")' },
          action: { type: 'string', enum: ['block', 'unblock'], description: 'Action to perform' }
        },
        required: ['serviceId', 'date', 'timeSlot', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_citizen_booking',
      description: 'Reschedule an appointment on citizen request or operational necessity.',
      parameters: {
        type: 'object',
        properties: {
          bookingReference: { type: 'string', description: 'Booking reference (e.g. "CE-XXXXXX")' },
          newDate: { type: 'string', description: 'New date in YYYY-MM-DD format' },
          newTimeSlot: { type: 'string', description: 'New time slot (e.g. "2:30 PM")' }
        },
        required: ['bookingReference', 'newDate', 'newTimeSlot']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_citizen_booking',
      description: 'Cancel an appointment with an administrative note.',
      parameters: {
        type: 'object',
        properties: {
          bookingReference: { type: 'string', description: 'Booking reference code' },
          reason: { type: 'string', description: 'Officer cancellation reason' }
        },
        required: ['bookingReference']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_center_analytics',
      description: 'Get operational analytics including total bookings, active appointments, cancellation rate, and demand breakdown per service.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
];

function executeRetailerTool(name, args) {
  switch (name) {
    case 'get_daily_schedule': {
      const date = args.date || new Date().toISOString().split('T')[0];
      const bookings = dataStore.findBookings({ date, status: 'confirmed' });
      return {
        date,
        totalBookedToday: bookings.length,
        appointments: bookings.map(b => ({
          reference: b.ref,
          service: b.serviceName,
          time: b.time,
          citizen: b.name,
          email: b.email
        }))
      };
    }
    case 'get_all_appointments': {
      return dataStore.findBookings(args);
    }
    case 'block_or_unblock_slot': {
      return dataStore.toggleBlockSlot({
        serviceId: args.serviceId,
        date: args.date,
        time: args.timeSlot,
        action: args.action
      });
    }
    case 'reschedule_citizen_booking': {
      return dataStore.rescheduleBooking({
        ref: args.bookingReference,
        newDate: args.newDate,
        newTime: args.newTimeSlot
      });
    }
    case 'cancel_citizen_booking': {
      return dataStore.cancelBooking({
        ref: args.bookingReference,
        reason: args.reason || 'Administrative cancellation'
      });
    }
    case 'get_center_analytics': {
      return dataStore.getAnalytics();
    }
    default:
      throw new Error(`Unknown retailer tool: ${name}`);
  }
}

module.exports = {
  retailerToolSchemas,
  executeRetailerTool
};
