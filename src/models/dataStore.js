const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const INITIAL_SERVICES = [
  {
    id: 'documents',
    icon: 'DOC',
    name: 'Document Services',
    short: 'Apply for or renew identity documents, certificates, and affidavits.',
    duration: 'About 20 minutes',
    description: 'Get help with government identity documents, citizenship proofs, and official certificates at your local service centre.',
    requirements: [
      'A valid government photo ID (Aadhaar / Voter ID / Passport)',
      'Completed application form',
      'Original supporting documents and photocopies',
      'Two recent passport-size photographs'
    ],
    slots: ['9:00 AM', '10:00 AM', '11:00 AM', '11:45 AM', '1:30 PM', '2:30 PM', '3:30 PM']
  },
  {
    id: 'permits',
    icon: 'LIC',
    name: 'Permits and Licences',
    short: 'Guidance and processing for municipal permits, trade licences, and approvals.',
    duration: 'About 30 minutes',
    description: 'Speak with a municipal service officer about residential approvals, trade licences, vehicle endorsements, and building clearances.',
    requirements: [
      'Applicant Photo ID',
      'Application reference number (if submitted online)',
      'Site plan / Property tax receipt or deed',
      'No Objection Certificate (NOC) if applicable'
    ],
    slots: ['9:30 AM', '10:30 AM', '11:30 AM', '1:30 PM', '2:45 PM', '3:45 PM']
  },
  {
    id: 'tax',
    icon: 'TAX',
    name: 'Tax Assistance',
    short: 'Help with property tax assessment, municipal dues, and revenue forms.',
    duration: 'About 25 minutes',
    description: 'An officer will guide you through municipal assessment, property tax payment records, challan generation, and dispute resolution.',
    requirements: [
      'Government Photo ID',
      'Property assessment number / Unique property ID',
      'Previous tax payment receipts or demand notice',
      'Bank passbook copy if requesting refund or reconciliation'
    ],
    slots: ['9:00 AM', '10:15 AM', '11:00 AM', '12:30 PM', '2:00 PM', '3:15 PM']
  },
  {
    id: 'housing',
    icon: 'HSG',
    name: 'Housing Support',
    short: 'Assistance with public housing schemes, allotments, and tenant support.',
    duration: 'About 30 minutes',
    description: 'Consult with civic housing counsellors on public housing allotments, registry verifications, and welfare housing schemes.',
    requirements: [
      'Income certificate / proof of household income',
      'Proof of current residence (rent agreement / electricity bill)',
      'Aadhaar cards of all family members',
      'Application scheme reference number'
    ],
    slots: ['9:15 AM', '10:45 AM', '11:30 AM', '1:00 PM', '2:15 PM', '3:45 PM']
  },
  {
    id: 'business',
    icon: 'BIZ',
    name: 'Small Business Help',
    short: 'Registration guidance, MSME certification, and local vendor permits.',
    duration: 'About 30 minutes',
    description: 'One-stop facilitation for micro and small enterprises seeking local trade licensing, vendor stands, or MSME registration guidance.',
    requirements: [
      'Business Owner Photo ID and PAN card',
      'Business address proof / Rental lease',
      'GSTIN or MSME Udyam registration (if already initiated)',
      'Brief outline of business activity'
    ],
    slots: ['9:30 AM', '10:30 AM', '12:00 PM', '1:15 PM', '2:45 PM', '3:30 PM']
  },
  {
    id: 'community',
    icon: 'COM',
    name: 'Community and Welfare Services',
    short: 'Pensions, disability support, senior citizen schemes, and welfare benefits.',
    duration: 'About 20 minutes',
    description: 'Enrol or verify eligibility for social welfare schemes including senior citizen pensions, disability pensions, and student subsidies.',
    requirements: [
      'Aadhaar card and Age proof',
      'Disability / Caste / BPL certificate if applicable',
      'Bank account details (linked with Aadhaar)',
      '2 Passport size photographs'
    ],
    slots: ['9:00 AM', '10:00 AM', '11:15 AM', '1:30 PM', '2:15 PM', '3:00 PM']
  }
];

class DataStore {
  constructor() {
    this.services = INITIAL_SERVICES;
    this.bookings = [];
    this.blockedSlots = [];
    this.users = [
      { id: 'usr-1', name: 'Officer Sharma', email: 'officer@civicease.gov', password: 'admin123', role: 'officer' },
      { id: 'usr-2', name: 'Rahul Verma', email: 'rahul@gmail.com', password: 'password123', role: 'citizen' }
    ];
    this.load();
  }

  load() {
    try {
      const dir = path.dirname(config.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(config.dataPath)) {
        const raw = fs.readFileSync(config.dataPath, 'utf8');
        const data = JSON.parse(raw);
        this.services = data.services || INITIAL_SERVICES;
        this.bookings = data.bookings || [];
        this.blockedSlots = data.blockedSlots || [];
        this.users = data.users || [
          { id: 'usr-1', name: 'Officer Sharma', email: 'officer@civicease.gov', password: 'admin123', role: 'officer' },
          { id: 'usr-2', name: 'Rahul Verma', email: 'rahul@gmail.com', password: 'password123', role: 'citizen' }
        ];
      } else {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const day2 = new Date(today);
        day2.setDate(today.getDate() + 2);

        const formatDate = (d) => d.toISOString().split('T')[0];
        const formatLabel = (d) => new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);

        this.bookings = [
          {
            id: 'bk-101',
            ref: 'CE-A7B291',
            serviceId: 'documents',
            serviceName: 'Document Services',
            date: formatDate(tomorrow),
            dateLabel: formatLabel(tomorrow),
            time: '10:00 AM',
            name: 'Aarav Sharma',
            email: 'aarav.sharma@example.com',
            status: 'confirmed',
            created_at: new Date().toISOString()
          },
          {
            id: 'bk-102',
            ref: 'CE-C4D812',
            serviceId: 'permits',
            serviceName: 'Permits & Licences',
            date: formatDate(tomorrow),
            dateLabel: formatLabel(tomorrow),
            time: '11:30 AM',
            name: 'Pooja Verma',
            email: 'pooja.v@example.com',
            status: 'confirmed',
            created_at: new Date().toISOString()
          },
          {
            id: 'bk-103',
            ref: 'CE-E9F334',
            serviceId: 'business',
            serviceName: 'Small Business Help',
            date: formatDate(day2),
            dateLabel: formatLabel(day2),
            time: '1:15 PM',
            name: 'Rohan Mehta',
            email: 'rohan.mehta@startup.in',
            status: 'confirmed',
            created_at: new Date().toISOString()
          }
        ];
        this.blockedSlots = [
          { serviceId: 'documents', date: formatDate(tomorrow), time: '1:30 PM', reason: 'Staff Training' }
        ];
        this.save();
      }
    } catch (err) {
      console.error('Error loading data store:', err);
    }
  }

  save() {
    try {
      const data = {
        services: this.services,
        bookings: this.bookings,
        blockedSlots: this.blockedSlots,
        users: this.users
      };
      const dir = path.dirname(config.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(config.dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.warn('DataStore save warning (fallback to in-memory):', err.message);
    }
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  createUser({ name, email, password, role = 'citizen' }) {
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required.');
    }
    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role === 'officer' ? 'officer' : 'citizen',
      created_at: new Date().toISOString()
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  getServices() {
    return this.services;
  }

  getServiceById(id) {
    return this.services.find(s => s.id.toLowerCase() === (id || '').toLowerCase());
  }

  getSlots(serviceId, dateStr) {
    const service = this.getServiceById(serviceId);
    if (!service) return [];

    return service.slots.map(time => {
      const isBlocked = this.blockedSlots.some(
        b => b.serviceId === service.id && b.date === dateStr && b.time === time
      );
      const bookedCount = this.bookings.filter(
        b => b.serviceId === service.id && b.date === dateStr && b.time === time && b.status === 'confirmed'
      ).length;

      const capacity = 1;
      const isFull = bookedCount >= capacity;
      const isAvailable = !isBlocked && !isFull;

      return {
        time,
        available: isAvailable,
        status: isBlocked ? 'blocked' : (isFull ? 'full' : 'available'),
        reason: isBlocked ? 'Blocked by officer' : (isFull ? 'Slot full' : 'Available')
      };
    });
  }

  createBooking({ serviceId, date, time, name, email }) {
    const service = this.getServiceById(serviceId);
    if (!service) throw new Error(`Service "${serviceId}" not found`);

    if (!date || !time || !name || !email) {
      throw new Error('date, time, name, and email are required');
    }

    const slots = this.getSlots(service.id, date);
    const slot = slots.find(s => s.time.toLowerCase() === time.toLowerCase());
    if (!slot) {
      throw new Error(`Time slot "${time}" is not a valid slot for this service`);
    }
    if (!slot.available) {
      throw new Error(`Slot "${time}" on ${date} is unavailable (${slot.reason})`);
    }

    const d = new Date(date);
    const dateLabel = isNaN(d.getTime()) ? date : new Intl.DateTimeFormat('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short'
    }).format(d);

    const ref = `CE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newBooking = {
      id: `bk-${Date.now()}`,
      ref,
      serviceId: service.id,
      serviceName: service.name,
      date,
      dateLabel,
      time: slot.time,
      name: name.trim(),
      email: email.trim(),
      status: 'confirmed',
      created_at: new Date().toISOString()
    };

    this.bookings.push(newBooking);
    this.save();
    return newBooking;
  }

  rescheduleBooking({ ref, newDate, newTime }) {
    const booking = this.bookings.find(b => b.ref.toUpperCase() === (ref || '').toUpperCase());
    if (!booking) throw new Error(`No booking found with reference "${ref}"`);
    if (booking.status === 'cancelled') throw new Error(`Booking ${ref} has already been cancelled`);

    const slots = this.getSlots(booking.serviceId, newDate);
    const slot = slots.find(s => s.time.toLowerCase() === newTime.toLowerCase());
    if (!slot) throw new Error(`Slot "${newTime}" does not exist for this service`);
    if (!slot.available) throw new Error(`Slot "${newTime}" on ${newDate} is not available (${slot.reason})`);

    const d = new Date(newDate);
    const dateLabel = isNaN(d.getTime()) ? newDate : new Intl.DateTimeFormat('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short'
    }).format(d);

    booking.date = newDate;
    booking.dateLabel = dateLabel;
    booking.time = slot.time;
    booking.rescheduled_at = new Date().toISOString();

    this.save();
    return booking;
  }

  cancelBooking({ ref, reason = 'Cancelled by user' }) {
    const booking = this.bookings.find(b => b.ref.toUpperCase() === (ref || '').toUpperCase());
    if (!booking) throw new Error(`No booking found with reference "${ref}"`);
    if (booking.status === 'cancelled') throw new Error(`Booking ${ref} is already cancelled`);

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelled_at = new Date().toISOString();

    this.save();
    return booking;
  }

  findBookings({ query, status, serviceId, date }) {
    return this.bookings.filter(b => {
      if (status && b.status !== status) return false;
      if (serviceId && b.serviceId !== serviceId) return false;
      if (date && b.date !== date) return false;
      if (query) {
        const q = query.toLowerCase();
        const matchesRef = b.ref.toLowerCase().includes(q);
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesEmail = b.email.toLowerCase().includes(q);
        const matchesService = b.serviceName.toLowerCase().includes(q);
        if (!matchesRef && !matchesName && !matchesEmail && !matchesService) return false;
      }
      return true;
    });
  }

  toggleBlockSlot({ serviceId, date, time, action }) {
    const service = this.getServiceById(serviceId);
    if (!service) throw new Error(`Service "${serviceId}" not found`);

    const existingIdx = this.blockedSlots.findIndex(
      b => b.serviceId === service.id && b.date === date && b.time === time
    );

    if (action === 'block') {
      if (existingIdx === -1) {
        this.blockedSlots.push({ serviceId: service.id, date, time, reason: 'Officer blocked' });
      }
    } else if (action === 'unblock') {
      if (existingIdx !== -1) {
        this.blockedSlots.splice(existingIdx, 1);
      }
    } else {
      if (existingIdx !== -1) {
        this.blockedSlots.splice(existingIdx, 1);
      } else {
        this.blockedSlots.push({ serviceId: service.id, date, time, reason: 'Officer blocked' });
      }
    }

    this.save();
    return { serviceId: service.id, date, time, blockedSlots: this.blockedSlots };
  }

  getAnalytics() {
    const totalBookings = this.bookings.length;
    const activeBookings = this.bookings.filter(b => b.status === 'confirmed').length;
    const cancelledBookings = this.bookings.filter(b => b.status === 'cancelled').length;

    const serviceCounts = {};
    this.services.forEach(s => { serviceCounts[s.name] = 0; });
    this.bookings.forEach(b => {
      if (b.status === 'confirmed') {
        serviceCounts[b.serviceName] = (serviceCounts[b.serviceName] || 0) + 1;
      }
    });

    return {
      totalBookings,
      activeBookings,
      cancelledBookings,
      serviceCounts,
      blockedSlotsCount: this.blockedSlots.length
    };
  }
}

module.exports = new DataStore();
