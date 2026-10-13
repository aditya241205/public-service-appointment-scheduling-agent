const dataStore = require('../../models/dataStore');

const customerToolSchemas = [
  {
    type: 'function',
    function: {
      name: 'get_service_catalog',
      description: 'Get the list of all available public services, their required documents, checklist, and durations.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_slot_availability',
      description: 'Check available time slots for a specific service on a specific date (YYYY-MM-DD).',
      parameters: {
        type: 'object',
        properties: {
          serviceId: {
            type: 'string',
            description: 'The service ID (e.g., "documents", "permits", "tax", "housing", "business", "community").'
          },
          date: {
            type: 'string',
            description: 'The date in YYYY-MM-DD format (e.g., "2026-10-15").'
          }
        },
        required: ['serviceId', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Create and confirm a new appointment booking for a citizen.',
      parameters: {
        type: 'object',
        properties: {
          serviceId: {
            type: 'string',
            description: 'The service identifier (e.g., "documents", "permits", "tax", "housing", "business", "community").'
          },
          date: {
            type: 'string',
            description: 'Appointment date in YYYY-MM-DD format.'
          },
          timeSlot: {
            type: 'string',
            description: 'The exact time slot string (e.g., "10:00 AM", "11:30 AM").'
          },
          citizenName: {
            type: 'string',
            description: 'Full name of the citizen.'
          },
          citizenEmail: {
            type: 'string',
            description: 'Valid email address of the citizen.'
          }
        },
        required: ['serviceId', 'date', 'timeSlot', 'citizenName', 'citizenEmail']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'lookup_booking',
      description: 'Look up existing bookings by reference code (e.g. "CE-XXXXXX") or email address.',
      parameters: {
        type: 'object',
        properties: {
          referenceOrEmail: {
            type: 'string',
            description: 'Booking reference code (like "CE-A7B291") or citizen email.'
          }
        },
        required: ['referenceOrEmail']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_appointment',
      description: 'Reschedule an existing booking to a new date and time slot.',
      parameters: {
        type: 'object',
        properties: {
          bookingReference: {
            type: 'string',
            description: 'The booking reference code (e.g., "CE-XXXXXX").'
          },
          newDate: {
            type: 'string',
            description: 'New date in YYYY-MM-DD format.'
          },
          newTimeSlot: {
            type: 'string',
            description: 'New time slot (e.g., "11:00 AM").'
          }
        },
        required: ['bookingReference', 'newDate', 'newTimeSlot']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Cancel an existing confirmed booking.',
      parameters: {
        type: 'object',
        properties: {
          bookingReference: {
            type: 'string',
            description: 'The booking reference code (e.g., "CE-XXXXXX").'
          },
          reason: {
            type: 'string',
            description: 'Reason for cancellation (optional).'
          }
        },
        required: ['bookingReference']
      }
    }
  }
];

function executeCustomerTool(name, args) {
  switch (name) {
    case 'get_service_catalog': {
      return dataStore.getServices().map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        requirements: s.requirements
      }));
    }
    case 'check_slot_availability': {
      const slots = dataStore.getSlots(args.serviceId, args.date);
      const available = slots.filter(s => s.available).map(s => s.time);
      const unavailable = slots.filter(s => !s.available).map(s => `${s.time} (${s.reason})`);
      return {
        serviceId: args.serviceId,
        date: args.date,
        availableSlots: available,
        unavailableSlots: unavailable
      };
    }
    case 'book_appointment': {
      return dataStore.createBooking({
        serviceId: args.serviceId,
        date: args.date,
        time: args.timeSlot,
        name: args.citizenName,
        email: args.citizenEmail
      });
    }
    case 'lookup_booking': {
      const results = dataStore.findBookings({ query: args.referenceOrEmail });
      return results.length > 0 ? results : { message: 'No bookings found matching query.' };
    }
    case 'reschedule_appointment': {
      return dataStore.rescheduleBooking({
        ref: args.bookingReference,
        newDate: args.newDate,
        newTime: args.newTimeSlot
      });
    }
    case 'cancel_appointment': {
      return dataStore.cancelBooking({
        ref: args.bookingReference,
        reason: args.reason || 'Citizen requested cancellation'
      });
    }
    default:
      throw new Error(`Unknown customer tool: ${name}`);
  }
}

module.exports = {
  customerToolSchemas,
  executeCustomerTool
};
