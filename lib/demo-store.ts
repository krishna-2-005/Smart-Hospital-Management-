type Role = 'admin' | 'doctor' | 'reception' | 'driver' | 'patient';

type DemoUser = {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  phone?: string;
};

type DemoDoctor = {
  id: number;
  userId: number;
  specialization: string;
  licenseNumber: string;
  isAvailable: boolean;
};

type DemoPatient = {
  id: number;
  userId: number;
  patientId: string;
  bloodType?: string;
  allergies?: string;
  dateOfBirth?: string;
  gender?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

type DemoQueue = {
  id: number;
  doctorId: number;
  patientId: number;
  queuePosition: number;
  priority: 'normal' | 'high' | 'emergency' | 'low';
  status: 'waiting' | 'in-consultation' | 'completed';
  checkInTime: string;
  estimatedWaitTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

type DemoAppointment = {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  reasonForVisit: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
};

type DemoPrescription = {
  id: number;
  doctorId: number;
  patientId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  status: 'active' | 'inactive' | 'expired' | 'pending';
  issuedDate: string;
};

type DemoPrescriptionRefill = {
  id: number;
  prescriptionId: number;
  requestedAt: string;
  status: 'pending' | 'approved';
};

type DemoBed = {
  id: number;
  bedNumber: string;
  ward: string;
  bedType: 'general' | 'icu' | 'pediatric' | 'maternity' | 'isolation';
  floorNumber: number;
  isAvailable: boolean;
  allocatedToPatientId: number | null;
  allocatedAt: string | null;
};

type DemoBedAllocation = {
  id: number;
  bedId: number;
  patientId: number;
  allocatedByUserId: number | null;
  admissionReason: string;
  admissionDiagnosis: string;
  admittingDoctorName: string;
  expectedStayDays: number | null;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  clinicalNotes: string;
  requiresVentilator: boolean;
  requiresIsolation: boolean;
  dietType: string;
  allergiesConfirmed: boolean;
  status: 'active' | 'released';
  allocatedAt: string;
  releasedAt: string | null;
};

type BedAllocationInput = {
  admissionReason?: string;
  admissionDiagnosis?: string;
  admittingDoctorName?: string;
  expectedStayDays?: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  clinicalNotes?: string;
  requiresVentilator?: boolean;
  requiresIsolation?: boolean;
  dietType?: string;
  allergiesConfirmed?: boolean;
};

type DemoEmergency = {
  id: number;
  patientId: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  assignedDoctorId: number | null;
  assignmentAuditTrail: DemoEmergencyAssignmentAuditEvent[];
  createdAt: string;
};

type DemoEmergencyAssignmentAuditEvent = {
  time: string;
  actorUserId: number;
  actorLabel: string;
  previousDoctorId: number | null;
  previousDoctorName: string;
  newDoctorId: number | null;
  newDoctorName: string;
  note: string;
};

type EmergencyType =
  | 'accident'
  | 'cardiac'
  | 'stroke'
  | 'breathing'
  | 'trauma'
  | 'other';

type EmergencyStatus =
  | 'requested'
  | 'ambulance-assigned'
  | 'en-route'
  | 'hospital-notified'
  | 'arriving'
  | 'arrived';

type DemoAmbulance = {
  id: number;
  vehicleCode: string;
  driverName: string;
  driverPhone: string;
  driverUserId: number | null;
  lat: number;
  lng: number;
  status: 'available' | 'dispatched';
  currentRequestId: number | null;
  shiftStatus: 'on-duty' | 'break' | 'off-duty';
  fuelLevelPercent: number;
  standbyZone: string;
  oxygenKitReady: boolean;
  defibrillatorReady: boolean;
  stretcherReady: boolean;
  vehicleNotes: string;
  lastMaintenanceDate: string;
  updatedAt: string;
};

type DemoHospitalNode = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  availableIcuBeds: number;
  availableGeneralBeds: number;
  hasOxygenSupport: boolean;
};

type DemoEmergencyTimelineEvent = {
  status: EmergencyStatus;
  message: string;
  time: string;
};

type DemoEmergencyNotification = {
  id?: number;
  target: 'patient' | 'ambulance' | 'hospital';
  message: string;
  time: string;
  priority?: 'normal' | 'emergency';
  category?: string;
  senderRole?: Role;
  acknowledgedAt?: string | null;
};

type DemoSmartEmergencyRequest = {
  id: number;
  patientId: number;
  patientName: string;
  patientUniqueId: string;
  age: number | null;
  emergencyType: EmergencyType;
  conditionSummary: string;
  pickupLat: number;
  pickupLng: number;
  requestedAt: string;
  baseEtaMinutes: number;
  currentEtaMinutes: number;
  status: EmergencyStatus;
  assignedAmbulanceId: number;
  selectedHospitalId: number;
  selectedHospitalScore: number;
  selectedHospitalDistanceKm: number;
  requiredBedType: 'icu' | 'general';
  ambulanceStartLat: number;
  ambulanceStartLng: number;
  pickupLegDistanceKm: number;
  routeDistanceKm: number;
  lastKnownAmbulanceLat: number;
  lastKnownAmbulanceLng: number;
  timeline: DemoEmergencyTimelineEvent[];
  notifications: DemoEmergencyNotification[];
  updatedAt: string;
};

type DemoStore = {
  users: DemoUser[];
  doctors: DemoDoctor[];
  patients: DemoPatient[];
  queues: DemoQueue[];
  appointments: DemoAppointment[];
  prescriptions: DemoPrescription[];
  prescriptionRefills: DemoPrescriptionRefill[];
  beds: DemoBed[];
  bedAllocations: DemoBedAllocation[];
  emergencies: DemoEmergency[];
  ambulances: DemoAmbulance[];
  hospitals: DemoHospitalNode[];
  smartEmergencies: DemoSmartEmergencyRequest[];
  counters: {
    userId: number;
    doctorId: number;
    patientId: number;
    queueId: number;
    appointmentId: number;
    prescriptionId: number;
    prescriptionRefillId: number;
    bedAllocationId: number;
    emergencyId: number;
    ambulanceId: number;
    hospitalId: number;
    smartEmergencyId: number;
    notificationId: number;
  };
};

const globalKey = '__healthHubDemoStore__';

function seedStore(): DemoStore {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 1,
        email: 'admin@hospital.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        phone: '9000000001',
      },
      {
        id: 2,
        email: 'doctor@hospital.com',
        password: 'doctor123',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'doctor',
        isActive: true,
        phone: '9000000002',
      },
      {
        id: 3,
        email: 'reception@hospital.com',
        password: 'reception123',
        firstName: 'Emma',
        lastName: 'Davis',
        role: 'reception',
        isActive: true,
        phone: '9000000003',
      },
      {
        id: 4,
        email: 'driver@hospital.com',
        password: 'driver123',
        firstName: 'Rahul',
        lastName: 'Singh',
        role: 'driver',
        isActive: true,
        phone: '9000011111',
      },
      {
        id: 5,
        email: 'patient@hospital.com',
        password: 'patient123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'patient',
        isActive: true,
        phone: '9000000004',
      },
    ],
    doctors: [
      {
        id: 1,
        userId: 2,
        specialization: 'General Medicine',
        licenseNumber: 'DOC-001',
        isAvailable: true,
      },
    ],
    patients: [
      {
        id: 1,
        userId: 5,
        patientId: 'PAT-5',
        bloodType: 'O+',
        allergies: 'None',
        dateOfBirth: '1997-07-14',
        gender: 'Male',
      },
    ],
    queues: [
      {
        id: 1,
        doctorId: 1,
        patientId: 1,
        queuePosition: 1,
        priority: 'normal',
        status: 'waiting',
        checkInTime: now,
        estimatedWaitTimeMinutes: 15,
        createdAt: now,
        updatedAt: now,
      },
    ],
    appointments: [
      {
        id: 1,
        patientId: 1,
        doctorId: 1,
        appointmentDate: new Date().toISOString().slice(0, 10),
        appointmentTime: '10:00',
        reasonForVisit: 'Routine checkup',
        status: 'scheduled',
      },
    ],
    prescriptions: [
      {
        id: 1,
        doctorId: 1,
        patientId: 1,
        medication: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: 'Take after meals',
        status: 'active',
        issuedDate: now,
      },
    ],
    prescriptionRefills: [],
    beds: [
      {
        id: 1,
        bedNumber: 'A-101',
        ward: 'General',
        bedType: 'general',
        floorNumber: 1,
        isAvailable: true,
        allocatedToPatientId: null,
        allocatedAt: null,
      },
      {
        id: 2,
        bedNumber: 'ICU-1',
        ward: 'Critical Care',
        bedType: 'icu',
        floorNumber: 2,
        isAvailable: false,
        allocatedToPatientId: 1,
        allocatedAt: now,
      },
      {
        id: 3,
        bedNumber: 'P-22',
        ward: 'Pediatric',
        bedType: 'pediatric',
        floorNumber: 3,
        isAvailable: true,
        allocatedToPatientId: null,
        allocatedAt: null,
      },
    ],
    bedAllocations: [
      {
        id: 1,
        bedId: 2,
        patientId: 1,
        allocatedByUserId: 1,
        admissionReason: 'Post observation monitoring',
        admissionDiagnosis: 'Chest pain with mild respiratory distress',
        admittingDoctorName: 'Dr. Sarah Wilson',
        expectedStayDays: 2,
        insuranceProvider: 'HealthSecure',
        insurancePolicyNumber: 'HS-001-7782',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '9000009000',
        clinicalNotes: 'Monitor vitals every 4 hours.',
        requiresVentilator: false,
        requiresIsolation: false,
        dietType: 'cardiac',
        allergiesConfirmed: true,
        status: 'active',
        allocatedAt: now,
        releasedAt: null,
      },
    ],
    emergencies: [
      {
        id: 1,
        patientId: 1,
        severity: 'high',
        description: 'Chest pain and breathlessness',
        status: 'in-progress',
        assignedDoctorId: 1,
        assignmentAuditTrail: [],
        createdAt: now,
      },
    ],
    ambulances: [
      {
        id: 1,
        vehicleCode: 'AMB-101',
        driverName: 'Rahul Singh',
        driverPhone: '9000011111',
        driverUserId: 4,
        lat: 28.611,
        lng: 77.219,
        status: 'available',
        currentRequestId: null,
        shiftStatus: 'on-duty',
        fuelLevelPercent: 78,
        standbyZone: 'Central Zone - Gate 2',
        oxygenKitReady: true,
        defibrillatorReady: true,
        stretcherReady: true,
        vehicleNotes: 'Ready for rapid dispatch.',
        lastMaintenanceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        updatedAt: now,
      },
      {
        id: 2,
        vehicleCode: 'AMB-102',
        driverName: 'Maya Verma',
        driverPhone: '9000011112',
        driverUserId: null,
        lat: 28.624,
        lng: 77.206,
        status: 'available',
        currentRequestId: null,
        shiftStatus: 'on-duty',
        fuelLevelPercent: 64,
        standbyZone: 'North Zone - Trauma Wing',
        oxygenKitReady: true,
        defibrillatorReady: true,
        stretcherReady: true,
        vehicleNotes: 'Backup oxygen cylinder loaded.',
        lastMaintenanceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        updatedAt: now,
      },
      {
        id: 3,
        vehicleCode: 'AMB-103',
        driverName: 'Arjun Patel',
        driverPhone: '9000011113',
        driverUserId: null,
        lat: 28.598,
        lng: 77.234,
        status: 'available',
        currentRequestId: null,
        shiftStatus: 'break',
        fuelLevelPercent: 51,
        standbyZone: 'South Zone - City Border',
        oxygenKitReady: true,
        defibrillatorReady: true,
        stretcherReady: true,
        vehicleNotes: 'Refuel planned after current standby period.',
        lastMaintenanceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 23).toISOString(),
        updatedAt: now,
      },
    ],
    hospitals: [
      {
        id: 1,
        name: 'HealthHub Central Hospital',
        lat: 28.6139,
        lng: 77.209,
        availableIcuBeds: 1,
        availableGeneralBeds: 2,
        hasOxygenSupport: true,
      },
      {
        id: 2,
        name: 'City Care Multispeciality',
        lat: 28.628,
        lng: 77.223,
        availableIcuBeds: 2,
        availableGeneralBeds: 6,
        hasOxygenSupport: true,
      },
      {
        id: 3,
        name: 'Metro Life Trauma Center',
        lat: 28.601,
        lng: 77.194,
        availableIcuBeds: 1,
        availableGeneralBeds: 4,
        hasOxygenSupport: false,
      },
    ],
    smartEmergencies: [],
    counters: {
      userId: 6,
      doctorId: 2,
      patientId: 2,
      queueId: 2,
      appointmentId: 2,
      prescriptionId: 2,
      prescriptionRefillId: 1,
      bedAllocationId: 2,
      emergencyId: 2,
      ambulanceId: 4,
      hospitalId: 4,
      smartEmergencyId: 1,
      notificationId: 1,
    },
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getAgeFromDate(dateOfBirth?: string) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

function getRequiredBedType(emergencyType: EmergencyType) {
  if (emergencyType === 'cardiac' || emergencyType === 'stroke' || emergencyType === 'breathing') {
    return 'icu' as const;
  }
  return 'general' as const;
}

function getEmergencyStatusRank(status: EmergencyStatus) {
  const rank: Record<EmergencyStatus, number> = {
    requested: 0,
    'ambulance-assigned': 1,
    'en-route': 2,
    'hospital-notified': 3,
    arriving: 4,
    arrived: 5,
  };
  return rank[status] ?? 0;
}

function getLiveMainHospitalCapacity(store: DemoStore) {
  const availableIcuBeds = store.beds.filter((bed) => bed.isAvailable && bed.bedType === 'icu').length;
  const availableGeneralBeds = store.beds.filter(
    (bed) => bed.isAvailable && bed.bedType !== 'icu'
  ).length;
  return { availableIcuBeds, availableGeneralBeds };
}

function ensureAmbulanceDefaults(ambulance: DemoAmbulance) {
  ambulance.shiftStatus = ambulance.shiftStatus || 'on-duty';
  ambulance.fuelLevelPercent = Number.isFinite(ambulance.fuelLevelPercent)
    ? Math.min(100, Math.max(0, ambulance.fuelLevelPercent))
    : 100;
  ambulance.standbyZone = ambulance.standbyZone || 'Unassigned Zone';
  ambulance.oxygenKitReady = typeof ambulance.oxygenKitReady === 'boolean' ? ambulance.oxygenKitReady : true;
  ambulance.defibrillatorReady =
    typeof ambulance.defibrillatorReady === 'boolean' ? ambulance.defibrillatorReady : true;
  ambulance.stretcherReady = typeof ambulance.stretcherReady === 'boolean' ? ambulance.stretcherReady : true;
  ambulance.vehicleNotes = ambulance.vehicleNotes || '';
  ambulance.lastMaintenanceDate = ambulance.lastMaintenanceDate || new Date().toISOString();
}

function normalizeStore(store: DemoStore) {
  if (!Number.isInteger(store.counters.notificationId) || store.counters.notificationId < 1) {
    store.counters.notificationId = 1;
  }

  store.ambulances.forEach((ambulance) => ensureAmbulanceDefaults(ambulance));
}

function appendEmergencyEvent(request: DemoSmartEmergencyRequest, status: EmergencyStatus, message: string) {
  const now = new Date().toISOString();
  if (request.timeline.some((event) => event.status === status)) {
    return;
  }

  request.timeline.push({ status, message, time: now });
  request.updatedAt = now;
}

function appendEmergencyNotification(
  request: DemoSmartEmergencyRequest,
  target: DemoEmergencyNotification['target'],
  message: string,
  options?: {
    priority?: 'normal' | 'emergency';
    category?: string;
    senderRole?: Role;
    notificationId?: number;
  }
) {
  request.notifications.push({
    id: options?.notificationId,
    target,
    message,
    time: new Date().toISOString(),
    priority: options?.priority || 'normal',
    category: options?.category,
    senderRole: options?.senderRole,
    acknowledgedAt: null,
  });
}

function updateSmartEmergencyProgress(store: DemoStore, request: DemoSmartEmergencyRequest) {
  const hospital = store.hospitals.find((item) => item.id === request.selectedHospitalId);
  const ambulance = store.ambulances.find((item) => item.id === request.assignedAmbulanceId);
  if (!hospital || !ambulance) return;

  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(request.requestedAt).getTime()) / 60000)
  );

  const nextEta = Math.max(0, request.baseEtaMinutes - elapsedMinutes);
  request.currentEtaMinutes = nextEta;

  if (request.baseEtaMinutes <= 0) {
    request.lastKnownAmbulanceLat = hospital.lat;
    request.lastKnownAmbulanceLng = hospital.lng;
    request.status = 'arrived';
    appendEmergencyEvent(request, 'arrived', 'Patient reached hospital. Handover completed.');
    ambulance.status = 'available';
    ambulance.currentRequestId = null;
    return;
  }

  const progress = Math.min(1, elapsedMinutes / request.baseEtaMinutes);
  const pickupWeight = request.routeDistanceKm > 0 ? request.pickupLegDistanceKm / request.routeDistanceKm : 0;

  if (progress <= pickupWeight) {
    const localProgress = pickupWeight > 0 ? progress / pickupWeight : 1;
    request.lastKnownAmbulanceLat =
      request.ambulanceStartLat + (request.pickupLat - request.ambulanceStartLat) * localProgress;
    request.lastKnownAmbulanceLng =
      request.ambulanceStartLng + (request.pickupLng - request.ambulanceStartLng) * localProgress;
  } else {
    const remainingWeight = 1 - pickupWeight;
    const localProgress = remainingWeight > 0 ? (progress - pickupWeight) / remainingWeight : 1;
    request.lastKnownAmbulanceLat = request.pickupLat + (hospital.lat - request.pickupLat) * localProgress;
    request.lastKnownAmbulanceLng = request.pickupLng + (hospital.lng - request.pickupLng) * localProgress;
  }

  if (nextEta <= 0) {
    request.status = 'arrived';
    request.lastKnownAmbulanceLat = hospital.lat;
    request.lastKnownAmbulanceLng = hospital.lng;
    appendEmergencyEvent(request, 'arrived', 'Patient reached hospital. Handover completed.');
    appendEmergencyNotification(request, 'hospital', 'Patient arrived at emergency bay.', {
      priority: 'normal',
      notificationId: store.counters.notificationId++,
    });
    ambulance.status = 'available';
    ambulance.currentRequestId = null;
  } else {
    const computedStatus: EmergencyStatus =
      nextEta <= 2
        ? 'arriving'
        : nextEta <= Math.ceil(request.baseEtaMinutes * 0.5)
          ? 'hospital-notified'
          : 'en-route';

    if (getEmergencyStatusRank(computedStatus) > getEmergencyStatusRank(request.status)) {
      request.status = computedStatus;
    }

    if (request.status === 'arriving') {
      appendEmergencyEvent(request, 'arriving', 'Ambulance is entering hospital perimeter.');
    } else if (request.status === 'hospital-notified') {
      appendEmergencyEvent(
        request,
        'hospital-notified',
        `Hospital notified. Team preparing ${request.requiredBedType.toUpperCase()} bed.`
      );
    } else {
      appendEmergencyEvent(request, 'en-route', 'Ambulance is on fastest route with live traffic optimization.');
    }
  }

  request.updatedAt = new Date().toISOString();
}

function getStore(): DemoStore {
  const globalObj = globalThis as unknown as { [globalKey]?: DemoStore };
  if (!globalObj[globalKey]) {
    globalObj[globalKey] = seedStore();
  }

  const store = globalObj[globalKey] as DemoStore;
  normalizeStore(store);
  return store;
}

export function validateDemoCredentials(email: string, password: string) {
  const store = getStore();
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
  if (!user || user.password !== password) {
    return null;
  }
  return user;
}

export function registerDemoUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  userType?: string;
}) {
  const store = getStore();
  const existing = store.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (existing) return null;

  const user: DemoUser = {
    id: store.counters.userId++,
    email: input.email,
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    isActive: true,
  };
  store.users.push(user);

  if (input.role === 'patient') {
    store.patients.push({
      id: store.counters.patientId++,
      userId: user.id,
      patientId: `PAT-${user.id}`,
      allergies: '',
      bloodType: '',
    });
  }

  if (input.role === 'doctor') {
    store.doctors.push({
      id: store.counters.doctorId++,
      userId: user.id,
      specialization: input.userType || 'General Medicine',
      licenseNumber: `DOC-${user.id}`,
      isAvailable: true,
    });
  }

  if (input.role === 'driver') {
    const matchedByName = store.ambulances.find(
      (ambulance) =>
        ambulance.driverUserId == null &&
        ambulance.driverName.toLowerCase() === `${input.firstName} ${input.lastName}`.toLowerCase()
    );

    const availableSlot = matchedByName || store.ambulances.find((ambulance) => ambulance.driverUserId == null);

    if (availableSlot) {
      availableSlot.driverUserId = user.id;
      availableSlot.driverName = `${input.firstName} ${input.lastName}`;
      availableSlot.driverPhone = user.phone || availableSlot.driverPhone;
      availableSlot.updatedAt = new Date().toISOString();
    }
  }

  return user;
}

export function getDemoAuthProfile(userId: number) {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;

  const base = {
    userId: user.id,
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
  };

  if (user.role === 'patient') {
    const patient = store.patients.find((p) => p.userId === user.id);
    return { ...base, ...patient };
  }

  if (user.role === 'doctor') {
    const doctor = store.doctors.find((d) => d.userId === user.id);
    return { ...base, ...doctor };
  }

  if (user.role === 'driver') {
    const ambulance = store.ambulances.find((item) => item.driverUserId === user.id);
    return {
      ...base,
      ambulance: ambulance
        ? {
            id: ambulance.id,
            vehicleCode: ambulance.vehicleCode,
            status: ambulance.status,
          }
        : null,
    };
  }

  return base;
}

export function getPatientProfile(userId: number) {
  const store = getStore();
  const patient = store.patients.find((p) => p.userId === userId);
  const user = store.users.find((u) => u.id === userId);
  if (!patient || !user) return null;

  const activeAllocation = store.bedAllocations
    .filter((allocation) => allocation.patientId === patient.id && allocation.status === 'active')
    .sort((a, b) => (a.allocatedAt > b.allocatedAt ? -1 : 1))[0];

  const activeBed = activeAllocation ? store.beds.find((bed) => bed.id === activeAllocation.bedId) : null;

  const bedHistory = store.bedAllocations
    .filter((allocation) => allocation.patientId === patient.id)
    .sort((a, b) => (a.allocatedAt > b.allocatedAt ? -1 : 1))
    .slice(0, 10)
    .map((allocation) => {
      const bed = store.beds.find((item) => item.id === allocation.bedId);
      return {
        id: allocation.id,
        bedNumber: bed?.bedNumber || 'NA',
        ward: bed?.ward || 'Unknown',
        bedType: bed?.bedType || 'general',
        admissionReason: allocation.admissionReason,
        diagnosis: allocation.admissionDiagnosis,
        allocatedAt: allocation.allocatedAt,
        releasedAt: allocation.releasedAt,
        status: allocation.status,
      };
    });

  return {
    patientId: patient.patientId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    dateOfBirth: patient.dateOfBirth || '',
    gender: patient.gender || '',
    bloodType: patient.bloodType || '',
    allergies: patient.allergies || '',
    medicalHistory: patient.medicalHistory || '',
    emergencyContactName: patient.emergencyContactName || '',
    emergencyContactPhone: patient.emergencyContactPhone || '',
    address: patient.address || '',
    city: patient.city || '',
    state: patient.state || '',
    zipCode: patient.zipCode || '',
    currentBed: activeAllocation && activeBed
      ? {
          bedNumber: activeBed.bedNumber,
          ward: activeBed.ward,
          bedType: activeBed.bedType,
          allocatedAt: activeAllocation.allocatedAt,
          admissionReason: activeAllocation.admissionReason,
          diagnosis: activeAllocation.admissionDiagnosis,
          admittingDoctorName: activeAllocation.admittingDoctorName,
          expectedStayDays: activeAllocation.expectedStayDays,
          dietType: activeAllocation.dietType,
        }
      : null,
    bedHistory,
  };
}

function appendMedicalHistory(patient: DemoPatient, line: string) {
  const prefix = patient.medicalHistory ? `${patient.medicalHistory}\n` : '';
  patient.medicalHistory = `${prefix}[${new Date().toISOString()}] ${line}`;
}

export function updatePatientProfile(userId: number, data: any) {
  const store = getStore();
  const patient = store.patients.find((p) => p.userId === userId);
  const user = store.users.find((u) => u.id === userId);
  if (!patient || !user) return false;

  patient.dateOfBirth = data.dateOfBirth || patient.dateOfBirth;
  patient.gender = data.gender || patient.gender;
  patient.bloodType = data.bloodType || patient.bloodType;
  patient.allergies = data.allergies || patient.allergies;
  patient.medicalHistory = data.medicalHistory || patient.medicalHistory;
  patient.emergencyContactName = data.emergencyContactName || patient.emergencyContactName;
  patient.emergencyContactPhone = data.emergencyContactPhone || patient.emergencyContactPhone;
  patient.address = data.address || patient.address;
  patient.city = data.city || patient.city;
  patient.state = data.state || patient.state;
  patient.zipCode = data.zipCode || patient.zipCode;
  user.phone = data.phone || user.phone;

  return true;
}

export function getPatientQueueStatus(userId: number) {
  const store = getStore();
  const patient = store.patients.find((p) => p.userId === userId);
  if (!patient) return null;

  const queue = [...store.queues]
    .filter((q) => q.patientId === patient.id && q.status !== 'completed')
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))[0];

  if (!queue) {
    return {
      queuePosition: null,
      message: 'Not currently in any queue',
    };
  }

  const doctor = store.doctors.find((d) => d.id === queue.doctorId);
  const doctorUser = doctor ? store.users.find((u) => u.id === doctor.userId) : null;

  return {
    queuePosition: queue.queuePosition,
    status: queue.status,
    doctorName: doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : 'Doctor',
    specialization: doctor?.specialization || 'General Medicine',
    estimatedWaitTime: queue.estimatedWaitTimeMinutes,
    priority: queue.priority,
    checkInTime: queue.checkInTime,
  };
}

export function joinQueueForPatient(userId: number, doctorId: number, priority: DemoQueue['priority']) {
  const store = getStore();
  const patient = store.patients.find((p) => p.userId === userId);
  if (!patient) return null;

  const activeForDoctor = store.queues.filter(
    (q) => q.doctorId === doctorId && q.status !== 'completed'
  );
  const nextPosition = activeForDoctor.length + 1;
  const now = new Date().toISOString();

  const item: DemoQueue = {
    id: store.counters.queueId++,
    doctorId,
    patientId: patient.id,
    queuePosition: nextPosition,
    priority,
    status: 'waiting',
    checkInTime: now,
    estimatedWaitTimeMinutes: nextPosition * 10,
    createdAt: now,
    updatedAt: now,
  };

  store.queues.push(item);
  return item;
}

export function getPatientAppointments(userId: number) {
  const store = getStore();
  const patient = store.patients.find((p) => p.userId === userId);
  if (!patient) return [];

  return store.appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => (a.appointmentDate > b.appointmentDate ? -1 : 1))
    .map((apt) => {
      const doctor = store.doctors.find((d) => d.id === apt.doctorId);
      const doctorUser = doctor ? store.users.find((u) => u.id === doctor.userId) : null;
      return {
        id: apt.id,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        doctorName: doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : 'Doctor',
        specialization: doctor?.specialization || 'General Medicine',
        reason: apt.reasonForVisit,
        status: apt.status,
      };
    });
}

export function createPatientAppointment(
  userId: number,
  input: { doctorId?: number; appointmentDate: string; appointmentTime: string; reasonForVisit: string }
) {
  const store = getStore();
  const patient = store.patients.find((p) => p.userId === userId);
  if (!patient) return null;

  const doctorId = input.doctorId || store.doctors[0]?.id;
  if (!doctorId) return null;

  const item: DemoAppointment = {
    id: store.counters.appointmentId++,
    patientId: patient.id,
    doctorId,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    reasonForVisit: input.reasonForVisit,
    status: 'scheduled',
  };
  store.appointments.push(item);
  return item;
}

export function getReceptionQueues() {
  const store = getStore();
  return store.queues
    .filter((q) => q.status === 'waiting' || q.status === 'in-consultation')
    .sort((a, b) => b.priority.localeCompare(a.priority) || a.queuePosition - b.queuePosition)
    .map((q) => {
      const patient = store.patients.find((p) => p.id === q.patientId);
      const patientUser = patient ? store.users.find((u) => u.id === patient.userId) : null;
      const doctor = store.doctors.find((d) => d.id === q.doctorId);
      const doctorUser = doctor ? store.users.find((u) => u.id === doctor.userId) : null;

      return {
        id: q.id,
        position: q.queuePosition,
        patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Unknown',
        patientId: patient?.patientId || 'NA',
        doctorName: doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : 'Doctor',
        priority: q.priority,
        status: q.status,
        checkInTime: q.checkInTime,
      };
    });
}

export function addQueueByReception(patientId: number, doctorId: number, priority: DemoQueue['priority']) {
  const store = getStore();
  const patient = store.patients.find((p) => p.id === patientId);
  if (!patient) return null;

  const nextPosition =
    store.queues.filter((q) => q.doctorId === doctorId && q.status !== 'completed').length + 1;
  const now = new Date().toISOString();

  const item: DemoQueue = {
    id: store.counters.queueId++,
    doctorId,
    patientId,
    queuePosition: nextPosition,
    priority,
    status: 'waiting',
    checkInTime: now,
    estimatedWaitTimeMinutes: nextPosition * 10,
    createdAt: now,
    updatedAt: now,
  };

  store.queues.push(item);
  return item;
}

export function getDoctorQueue(userId: number) {
  const store = getStore();
  const doctor = store.doctors.find((d) => d.userId === userId);
  if (!doctor) return [];

  return store.queues
    .filter((q) => q.doctorId === doctor.id && (q.status === 'waiting' || q.status === 'in-consultation'))
    .sort((a, b) => a.queuePosition - b.queuePosition)
    .map((q) => {
      const patient = store.patients.find((p) => p.id === q.patientId);
      const patientUser = patient ? store.users.find((u) => u.id === patient.userId) : null;
      return {
        id: q.id,
        position: q.queuePosition,
        patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Unknown',
        patientId: patient?.patientId || 'NA',
        priority: q.priority,
        status: q.status,
        estimatedWaitTime: q.estimatedWaitTimeMinutes,
      };
    });
}

export function updateDoctorQueue(queueId: number, status: DemoQueue['status']) {
  const store = getStore();
  const queue = store.queues.find((q) => q.id === queueId);
  if (!queue) return false;
  queue.status = status;
  queue.updatedAt = new Date().toISOString();
  return true;
}

export function getBeds() {
  const store = getStore();
  return store.beds.map((bed) => {
    const patient = bed.allocatedToPatientId
      ? store.patients.find((p) => p.id === bed.allocatedToPatientId)
      : null;
    const user = patient ? store.users.find((u) => u.id === patient.userId) : null;
    const activeAllocation = store.bedAllocations
      .filter((allocation) => allocation.bedId === bed.id && allocation.status === 'active')
      .sort((a, b) => (a.allocatedAt > b.allocatedAt ? -1 : 1))[0];
    return {
      id: bed.id,
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      bedType: bed.bedType,
      floor: bed.floorNumber,
      isAvailable: bed.isAvailable,
      allocatedPatient: patient && user
        ? { id: patient.id, name: `${user.firstName} ${user.lastName}`, patientId: patient.patientId }
        : null,
      allocationDetails: activeAllocation
        ? {
            id: activeAllocation.id,
            admissionReason: activeAllocation.admissionReason,
            admissionDiagnosis: activeAllocation.admissionDiagnosis,
            admittingDoctorName: activeAllocation.admittingDoctorName,
            expectedStayDays: activeAllocation.expectedStayDays,
            insuranceProvider: activeAllocation.insuranceProvider,
            insurancePolicyNumber: activeAllocation.insurancePolicyNumber,
            emergencyContactName: activeAllocation.emergencyContactName,
            emergencyContactPhone: activeAllocation.emergencyContactPhone,
            clinicalNotes: activeAllocation.clinicalNotes,
            requiresVentilator: activeAllocation.requiresVentilator,
            requiresIsolation: activeAllocation.requiresIsolation,
            dietType: activeAllocation.dietType,
            allergiesConfirmed: activeAllocation.allergiesConfirmed,
            allocatedAt: activeAllocation.allocatedAt,
          }
        : null,
      allocatedAt: bed.allocatedAt,
    };
  });
}

export function updateBedAllocation(
  bedId: number,
  allocatedToPatientId: number | null,
  isAvailable: boolean,
  details?: BedAllocationInput,
) {
  const store = getStore();
  const bed = store.beds.find((b) => b.id === bedId);
  if (!bed) return false;

  if (!isAvailable && allocatedToPatientId) {
    bed.allocatedToPatientId = allocatedToPatientId;
    bed.isAvailable = false;
    bed.allocatedAt = new Date().toISOString();

    const allocation: DemoBedAllocation = {
      id: store.counters.bedAllocationId++,
      bedId,
      patientId: allocatedToPatientId,
      allocatedByUserId: 1,
      admissionReason: details?.admissionReason || 'Admission',
      admissionDiagnosis: details?.admissionDiagnosis || '',
      admittingDoctorName: details?.admittingDoctorName || 'Assigned doctor',
      expectedStayDays: typeof details?.expectedStayDays === 'number' ? details.expectedStayDays : null,
      insuranceProvider: details?.insuranceProvider || '',
      insurancePolicyNumber: details?.insurancePolicyNumber || '',
      emergencyContactName: details?.emergencyContactName || '',
      emergencyContactPhone: details?.emergencyContactPhone || '',
      clinicalNotes: details?.clinicalNotes || '',
      requiresVentilator: Boolean(details?.requiresVentilator),
      requiresIsolation: Boolean(details?.requiresIsolation),
      dietType: details?.dietType || 'regular',
      allergiesConfirmed: Boolean(details?.allergiesConfirmed),
      status: 'active',
      allocatedAt: bed.allocatedAt,
      releasedAt: null,
    };

    store.bedAllocations.push(allocation);
    const patient = store.patients.find((p) => p.id === allocatedToPatientId);
    if (patient) {
      appendMedicalHistory(patient, `Bed allocated: ${bed.bedNumber} (${bed.ward}/${bed.bedType}). Reason: ${allocation.admissionReason}`);
    }
  } else {
    const existingPatientId = bed.allocatedToPatientId;
    bed.allocatedToPatientId = null;
    bed.isAvailable = true;
    bed.allocatedAt = null;

    const activeAllocation = store.bedAllocations
      .filter((allocation) => allocation.bedId === bedId && allocation.status === 'active')
      .sort((a, b) => (a.allocatedAt > b.allocatedAt ? -1 : 1))[0];

    if (activeAllocation) {
      activeAllocation.status = 'released';
      activeAllocation.releasedAt = new Date().toISOString();
    }

    if (existingPatientId) {
      const patient = store.patients.find((p) => p.id === existingPatientId);
      if (patient) {
        appendMedicalHistory(patient, `Bed released: ${bed.bedNumber} (${bed.ward}/${bed.bedType}).`);
      }
    }
  }

  return true;
}

export function getPatientBedHistory(userId: number) {
  const store = getStore();
  const patient = store.patients.find((p) => p.userId === userId);
  if (!patient) return [];

  return store.bedAllocations
    .filter((allocation) => allocation.patientId === patient.id)
    .sort((a, b) => (a.allocatedAt > b.allocatedAt ? -1 : 1))
    .map((allocation) => {
      const bed = store.beds.find((item) => item.id === allocation.bedId);
      return {
        id: allocation.id,
        bedNumber: bed?.bedNumber || 'NA',
        ward: bed?.ward || 'Unknown',
        bedType: bed?.bedType || 'general',
        admissionReason: allocation.admissionReason,
        diagnosis: allocation.admissionDiagnosis,
        admittingDoctorName: allocation.admittingDoctorName,
        expectedStayDays: allocation.expectedStayDays,
        status: allocation.status,
        allocatedAt: allocation.allocatedAt,
        releasedAt: allocation.releasedAt,
      };
    });
}

export function getDashboardStats() {
  const store = getStore();
  return {
    visitsTodayCount: 120 + store.appointments.length,
    appointmentsTodayCount: store.appointments.filter((a) => a.status === 'scheduled').length,
    emergencyCasesToday: store.emergencies.filter((e) => e.status !== 'resolved').length,
    totalBeds: store.beds.length,
    availableBeds: store.beds.filter((b) => b.isAvailable).length,
    patientsInQueue: store.queues.filter((q) => q.status !== 'completed').length,
    doctorsOnDuty: store.doctors.filter((d) => d.isAvailable).length,
    totalPatients: store.patients.length,
  };
}

export function getAdminDoctors() {
  const store = getStore();
  return store.doctors.map((doc) => {
    const user = store.users.find((u) => u.id === doc.userId);
    const queueLoad = store.queues.filter((q) => q.doctorId === doc.id && q.status !== 'completed').length;
    return {
      id: doc.id,
      name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      email: user?.email || '',
      specialization: doc.specialization,
      licenseNumber: doc.licenseNumber,
      isAvailable: doc.isAvailable,
      queueLoad,
    };
  });
}

export function getAdminPatients() {
  const store = getStore();
  return store.patients.map((patient) => {
    const user = store.users.find((u) => u.id === patient.userId);
    const lastAppointment = [...store.appointments]
      .filter((a) => a.patientId === patient.id)
      .sort((a, b) => (a.appointmentDate > b.appointmentDate ? -1 : 1))[0];
    return {
      id: patient.id,
      patientId: patient.patientId,
      name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      email: user?.email || '',
      bloodType: patient.bloodType || 'NA',
      allergies: patient.allergies || 'None',
      lastAppointmentDate: lastAppointment?.appointmentDate || null,
    };
  });
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'hidden';
  const keep = Math.min(2, name.length);
  return `${name.slice(0, keep)}***@${domain}`;
}

function maskPhone(phone: string | undefined) {
  if (!phone) return 'hidden';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return 'hidden';
  return `******${digits.slice(-4)}`;
}

export function getAdminPatientData(filters?: { ward?: string; intakeType?: string }) {
  const store = getStore();

  const rows = store.appointments.map((apt) => {
    const patient = store.patients.find((p) => p.id === apt.patientId);
    const patientUser = patient ? store.users.find((u) => u.id === patient.userId) : null;
    const doctor = store.doctors.find((d) => d.id === apt.doctorId);
    const doctorUser = doctor ? store.users.find((u) => u.id === doctor.userId) : null;

    const allocation = store.bedAllocations
      .filter((allocationItem) => allocationItem.patientId === apt.patientId)
      .sort((a, b) => (a.allocatedAt > b.allocatedAt ? -1 : 1))[0];
    const bed = allocation ? store.beds.find((b) => b.id === allocation.bedId) : null;

    return {
      id: `apt-${apt.id}`,
      date: `${apt.appointmentDate} ${apt.appointmentTime}`,
      patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Unknown',
      patientId: patient?.patientId || 'NA',
      doctorName: doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : 'Unassigned',
      specialization: doctor?.specialization || 'General Medicine',
      ward: bed?.ward || 'General',
      intakeType: apt.status === 'scheduled' ? 'appointment' : 'walk-in',
      visitStatus: apt.status,
      reason: apt.reasonForVisit || 'Consultation',
      protectedEmail: maskEmail(patientUser?.email || 'hidden'),
      protectedPhone: maskPhone(patientUser?.phone),
    };
  });

  const filteredRows = rows.filter((row) => {
    if (filters?.ward && filters.ward !== 'all' && row.ward.toLowerCase() !== filters.ward.toLowerCase()) {
      return false;
    }
    if (filters?.intakeType && filters.intakeType !== 'all' && row.intakeType !== filters.intakeType) {
      return false;
    }
    return true;
  });

  return filteredRows.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getEmergencyCases() {
  const store = getStore();
  return store.emergencies.map((e) => {
    const patient = store.patients.find((p) => p.id === e.patientId);
    const patientUser = patient ? store.users.find((u) => u.id === patient.userId) : null;
    const doctor = e.assignedDoctorId ? store.doctors.find((d) => d.id === e.assignedDoctorId) : null;
    const doctorUser = doctor ? store.users.find((u) => u.id === doctor.userId) : null;
    return {
      id: e.id,
      patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Unknown',
      patientId: patient?.patientId || 'NA',
      severity: e.severity,
      description: e.description,
      status: e.status,
      assignedDoctorId: e.assignedDoctorId,
      assignedDoctor: doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : 'Unassigned',
      assignmentAuditTrail: e.assignmentAuditTrail,
      createdAt: e.createdAt,
    };
  });
}

export function getPrescriptions(userId: number, role: Role) {
  const store = getStore();

  const mapForPatientView = (rx: DemoPrescription) => {
    const doctor = store.doctors.find((d) => d.id === rx.doctorId);
    const doctorUser = doctor ? store.users.find((u) => u.id === doctor.userId) : null;
    return {
      id: rx.id,
      medication: rx.medication,
      dosage: rx.dosage,
      frequency: rx.frequency,
      duration: rx.duration,
      status: rx.status,
      doctorName: doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : 'Unknown Doctor',
      issuedDate: rx.issuedDate,
      instructions: rx.instructions || '',
    };
  };

  const mapForDoctorView = (rx: DemoPrescription) => {
    const patient = store.patients.find((p) => p.id === rx.patientId);
    const patientUser = patient ? store.users.find((u) => u.id === patient.userId) : null;
    return {
      id: rx.id,
      patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Unknown Patient',
      patientId: patient?.patientId || 'NA',
      medication: rx.medication,
      dosage: rx.dosage,
      frequency: rx.frequency,
      duration: rx.duration,
      status: rx.status,
      issuedDate: rx.issuedDate,
      instructions: rx.instructions || '',
    };
  };

  if (role === 'patient') {
    const patient = store.patients.find((p) => p.userId === userId);
    if (!patient) return [];
    return store.prescriptions
      .filter((rx) => rx.patientId === patient.id)
      .sort((a, b) => (a.issuedDate > b.issuedDate ? -1 : 1))
      .map(mapForPatientView);
  }

  if (role === 'doctor') {
    const doctor = store.doctors.find((d) => d.userId === userId);
    if (!doctor) return [];
    return store.prescriptions
      .filter((rx) => rx.doctorId === doctor.id)
      .sort((a, b) => (a.issuedDate > b.issuedDate ? -1 : 1))
      .map(mapForDoctorView);
  }

  return store.prescriptions
    .sort((a, b) => (a.issuedDate > b.issuedDate ? -1 : 1))
    .map((rx) => {
      const patientRow = mapForDoctorView(rx);
      const doctorRow = mapForPatientView(rx);
      return {
        ...patientRow,
        doctorName: doctorRow.doctorName,
      };
    });
}

export function issuePrescription(
  patientId: number | string,
  medication: string,
  dosage: string,
  frequency: string,
  duration: string
) {
  const store = getStore();
  const normalizedPatientId = Number(patientId);
  const now = new Date().toISOString();

  const patient = store.patients.find((p) => p.id === normalizedPatientId);
  const fallbackDoctorId = store.doctors[0]?.id || 1;

  const prescription: DemoPrescription = {
    id: store.counters.prescriptionId++,
    doctorId: fallbackDoctorId,
    patientId: patient?.id || 1,
    medication,
    dosage,
    frequency,
    duration,
    instructions: '',
    status: 'active',
    issuedDate: now,
  };

  store.prescriptions.push(prescription);
  return prescription;
}

export function requestRefill(prescriptionId: number | string) {
  const store = getStore();
  const now = new Date().toISOString();
  const refill: DemoPrescriptionRefill = {
    id: store.counters.prescriptionRefillId++,
    prescriptionId: Number(prescriptionId),
    requestedAt: now,
    status: 'pending',
  };

  store.prescriptionRefills.push(refill);
  return refill;
}

export function updateEmergencyStatus(caseId: number, status: DemoEmergency['status']) {
  const store = getStore();
  const emergency = store.emergencies.find((e) => e.id === caseId);
  if (!emergency) return false;
  emergency.status = status;
  return true;
}

export function updateEmergencyAssignment(
  caseId: number,
  assignedDoctorId: number | null,
  options?: {
    actorUserId?: number;
    actorLabel?: string;
    forceOverride?: boolean;
  }
) {
  const store = getStore();
  const emergency = store.emergencies.find((e) => e.id === caseId);
  if (!emergency) return false;

  const previousDoctorId = emergency.assignedDoctorId;

  if (!emergency.assignmentAuditTrail) {
    emergency.assignmentAuditTrail = [];
  }

  if (options?.forceOverride) {
    const lookupDoctorName = (doctorId: number | null) => {
      if (!doctorId) return 'Unassigned';
      const doctor = store.doctors.find((d) => d.id === doctorId);
      if (!doctor) return 'Unknown Doctor';
      const doctorUser = store.users.find((u) => u.id === doctor.userId);
      return doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : 'Unknown Doctor';
    };

    emergency.assignmentAuditTrail.push({
      time: new Date().toISOString(),
      actorUserId: options.actorUserId ?? 0,
      actorLabel: options.actorLabel ?? 'Admin',
      previousDoctorId,
      previousDoctorName: lookupDoctorName(previousDoctorId),
      newDoctorId: assignedDoctorId,
      newDoctorName: lookupDoctorName(assignedDoctorId),
      note: 'Override assignment used for pending critical emergency case.',
    });
  }

  emergency.assignedDoctorId = assignedDoctorId;
  return true;
}

export function createSmartEmergencyRequest(
  userId: number,
  input: {
    emergencyType: EmergencyType;
    conditionSummary: string;
    lat: number;
    lng: number;
  }
) {
  const store = getStore();
  const patient = store.patients.find((item) => item.userId === userId);
  const user = store.users.find((item) => item.id === userId);

  if (!patient || !user) {
    return { ok: false, error: 'Patient profile not found' as const };
  }

  const existingActive = store.smartEmergencies.find(
    (request) => request.patientId === patient.id && request.status !== 'arrived'
  );

  if (existingActive) {
    updateSmartEmergencyProgress(store, existingActive);
    return { ok: true, data: existingActive };
  }

  const availableAmbulances = store.ambulances.filter((item) => item.status === 'available');
  if (availableAmbulances.length === 0) {
    return { ok: false, error: 'No ambulance available right now' as const };
  }

  const nearestAmbulance = [...availableAmbulances].sort((first, second) => {
    const firstDistance = getDistanceKm(first.lat, first.lng, input.lat, input.lng);
    const secondDistance = getDistanceKm(second.lat, second.lng, input.lat, input.lng);
    return firstDistance - secondDistance;
  })[0];

  const requiredBedType = getRequiredBedType(input.emergencyType);
  const mainHospitalLiveCapacity = getLiveMainHospitalCapacity(store);

  const hospitalCandidates = store.hospitals.map((hospital) => {
    const useLiveMain = hospital.id === 1;
    const availableIcuBeds = useLiveMain
      ? mainHospitalLiveCapacity.availableIcuBeds
      : hospital.availableIcuBeds;
    const availableGeneralBeds = useLiveMain
      ? mainHospitalLiveCapacity.availableGeneralBeds
      : hospital.availableGeneralBeds;

    const distanceKm = getDistanceKm(input.lat, input.lng, hospital.lat, hospital.lng);
    const requiredAvailability = requiredBedType === 'icu' ? availableIcuBeds : availableGeneralBeds;

    let score = distanceKm * 6;
    score += requiredAvailability > 0 ? -8 : 80;
    score += (availableIcuBeds + availableGeneralBeds) > 0 ? -2 : 0;

    if ((input.emergencyType === 'cardiac' || input.emergencyType === 'breathing') && !hospital.hasOxygenSupport) {
      score += 25;
    }

    return {
      hospital,
      score,
      distanceKm,
      availableIcuBeds,
      availableGeneralBeds,
    };
  });

  const selectedHospitalMeta = hospitalCandidates.sort((first, second) => first.score - second.score)[0];
  const selectedHospital = selectedHospitalMeta.hospital;

  const pickupLegDistanceKm = getDistanceKm(nearestAmbulance.lat, nearestAmbulance.lng, input.lat, input.lng);
  const hospitalLegDistanceKm = getDistanceKm(input.lat, input.lng, selectedHospital.lat, selectedHospital.lng);
  const totalRouteDistanceKm = pickupLegDistanceKm + hospitalLegDistanceKm;

  // Assume average operational speed ~40 km/h including traffic and intersections.
  const baseEtaMinutes = Math.max(3, Math.ceil((totalRouteDistanceKm / 40) * 60));
  const now = new Date().toISOString();

  const request: DemoSmartEmergencyRequest = {
    id: store.counters.smartEmergencyId++,
    patientId: patient.id,
    patientName: `${user.firstName} ${user.lastName}`,
    patientUniqueId: patient.patientId,
    age: getAgeFromDate(patient.dateOfBirth),
    emergencyType: input.emergencyType,
    conditionSummary: input.conditionSummary,
    pickupLat: input.lat,
    pickupLng: input.lng,
    requestedAt: now,
    baseEtaMinutes,
    currentEtaMinutes: baseEtaMinutes,
    status: 'ambulance-assigned',
    assignedAmbulanceId: nearestAmbulance.id,
    selectedHospitalId: selectedHospital.id,
    selectedHospitalScore: Number(selectedHospitalMeta.score.toFixed(2)),
    selectedHospitalDistanceKm: Number(selectedHospitalMeta.distanceKm.toFixed(2)),
    requiredBedType,
    ambulanceStartLat: nearestAmbulance.lat,
    ambulanceStartLng: nearestAmbulance.lng,
    pickupLegDistanceKm: Number(pickupLegDistanceKm.toFixed(2)),
    routeDistanceKm: Number(totalRouteDistanceKm.toFixed(2)),
    lastKnownAmbulanceLat: nearestAmbulance.lat,
    lastKnownAmbulanceLng: nearestAmbulance.lng,
    timeline: [
      {
        status: 'requested',
        message: `Emergency request received from ${patient.patientId}.`,
        time: now,
      },
      {
        status: 'ambulance-assigned',
        message: `${nearestAmbulance.vehicleCode} assigned. Driver: ${nearestAmbulance.driverName}.`,
        time: now,
      },
      {
        status: 'hospital-notified',
        message: `${selectedHospital.name} pre-alerted with patient details and ETA ${baseEtaMinutes} min.`,
        time: now,
      },
    ],
    notifications: [
      {
        target: 'patient',
        message: `${nearestAmbulance.vehicleCode} is on the way. ETA ${baseEtaMinutes} minutes.`,
        time: now,
      },
      {
        target: 'ambulance',
        message: `Navigate to pickup and then to ${selectedHospital.name}.`,
        time: now,
      },
      {
        target: 'hospital',
        message: `Incoming ${input.emergencyType} case. Prepare ${requiredBedType.toUpperCase()} bed.`,
        time: now,
      },
    ],
    updatedAt: now,
  };

  nearestAmbulance.status = 'dispatched';
  nearestAmbulance.currentRequestId = request.id;
  nearestAmbulance.updatedAt = now;

  store.smartEmergencies.push(request);
  updateSmartEmergencyProgress(store, request);

  return { ok: true, data: request };
}

export function getPatientSmartEmergencyStatus(userId: number) {
  const store = getStore();
  const patient = store.patients.find((item) => item.userId === userId);
  if (!patient) return null;

  const request = [...store.smartEmergencies]
    .filter((item) => item.patientId === patient.id)
    .sort((first, second) => (first.requestedAt > second.requestedAt ? -1 : 1))[0];

  if (!request) return null;

  updateSmartEmergencyProgress(store, request);

  const ambulance = store.ambulances.find((item) => item.id === request.assignedAmbulanceId);
  const hospital = store.hospitals.find((item) => item.id === request.selectedHospitalId);

  return {
    id: request.id,
    status: request.status,
    emergencyType: request.emergencyType,
    conditionSummary: request.conditionSummary,
    requestedAt: request.requestedAt,
    etaMinutes: request.currentEtaMinutes,
    patient: {
      name: request.patientName,
      patientId: request.patientUniqueId,
      age: request.age,
    },
    ambulance: ambulance
      ? {
          id: ambulance.id,
          vehicleCode: ambulance.vehicleCode,
          driverName: ambulance.driverName,
          driverPhone: ambulance.driverPhone,
          lat: Number(request.lastKnownAmbulanceLat.toFixed(5)),
          lng: Number(request.lastKnownAmbulanceLng.toFixed(5)),
        }
      : null,
    route: {
      pickup: { lat: request.pickupLat, lng: request.pickupLng },
      distanceKm: request.routeDistanceKm,
      optimized: true,
    },
    hospital: hospital
      ? {
          id: hospital.id,
          name: hospital.name,
          distanceKm: request.selectedHospitalDistanceKm,
          score: request.selectedHospitalScore,
          requiredBedType: request.requiredBedType,
          hasOxygenSupport: hospital.hasOxygenSupport,
        }
      : null,
    timeline: request.timeline,
    notifications: request.notifications,
  };
}

export function createPublicSmartEmergencyRequest(input: {
  callerName: string;
  callerPhone?: string;
  age?: number | null;
  emergencyType: EmergencyType;
  conditionSummary: string;
  lat: number;
  lng: number;
}) {
  const store = getStore();
  const availableAmbulances = store.ambulances.filter((item) => item.status === 'available');
  if (availableAmbulances.length === 0) {
    return { ok: false, error: 'No ambulance available right now' as const };
  }

  const nearestAmbulance = [...availableAmbulances].sort((first, second) => {
    const firstDistance = getDistanceKm(first.lat, first.lng, input.lat, input.lng);
    const secondDistance = getDistanceKm(second.lat, second.lng, input.lat, input.lng);
    return firstDistance - secondDistance;
  })[0];

  const requiredBedType = getRequiredBedType(input.emergencyType);
  const mainHospitalLiveCapacity = getLiveMainHospitalCapacity(store);

  const hospitalCandidates = store.hospitals.map((hospital) => {
    const useLiveMain = hospital.id === 1;
    const availableIcuBeds = useLiveMain
      ? mainHospitalLiveCapacity.availableIcuBeds
      : hospital.availableIcuBeds;
    const availableGeneralBeds = useLiveMain
      ? mainHospitalLiveCapacity.availableGeneralBeds
      : hospital.availableGeneralBeds;

    const distanceKm = getDistanceKm(input.lat, input.lng, hospital.lat, hospital.lng);
    const requiredAvailability = requiredBedType === 'icu' ? availableIcuBeds : availableGeneralBeds;

    let score = distanceKm * 6;
    score += requiredAvailability > 0 ? -8 : 80;
    score += (availableIcuBeds + availableGeneralBeds) > 0 ? -2 : 0;

    if ((input.emergencyType === 'cardiac' || input.emergencyType === 'breathing') && !hospital.hasOxygenSupport) {
      score += 25;
    }

    return {
      hospital,
      score,
      distanceKm,
    };
  });

  const selectedHospitalMeta = hospitalCandidates.sort((first, second) => first.score - second.score)[0];
  const selectedHospital = selectedHospitalMeta.hospital;

  const pickupLegDistanceKm = getDistanceKm(nearestAmbulance.lat, nearestAmbulance.lng, input.lat, input.lng);
  const hospitalLegDistanceKm = getDistanceKm(input.lat, input.lng, selectedHospital.lat, selectedHospital.lng);
  const totalRouteDistanceKm = pickupLegDistanceKm + hospitalLegDistanceKm;
  const baseEtaMinutes = Math.max(3, Math.ceil((totalRouteDistanceKm / 40) * 60));
  const now = new Date().toISOString();
  const requestId = store.counters.smartEmergencyId++;

  const request: DemoSmartEmergencyRequest = {
    id: requestId,
    patientId: 0,
    patientName: input.callerName,
    patientUniqueId: `PUBLIC-${requestId}`,
    age: input.age ?? null,
    emergencyType: input.emergencyType,
    conditionSummary: input.conditionSummary,
    pickupLat: input.lat,
    pickupLng: input.lng,
    requestedAt: now,
    baseEtaMinutes,
    currentEtaMinutes: baseEtaMinutes,
    status: 'ambulance-assigned',
    assignedAmbulanceId: nearestAmbulance.id,
    selectedHospitalId: selectedHospital.id,
    selectedHospitalScore: Number(selectedHospitalMeta.score.toFixed(2)),
    selectedHospitalDistanceKm: Number(selectedHospitalMeta.distanceKm.toFixed(2)),
    requiredBedType,
    ambulanceStartLat: nearestAmbulance.lat,
    ambulanceStartLng: nearestAmbulance.lng,
    pickupLegDistanceKm: Number(pickupLegDistanceKm.toFixed(2)),
    routeDistanceKm: Number(totalRouteDistanceKm.toFixed(2)),
    lastKnownAmbulanceLat: nearestAmbulance.lat,
    lastKnownAmbulanceLng: nearestAmbulance.lng,
    timeline: [
      {
        status: 'requested',
        message: `Public emergency request received from ${input.callerName}.`,
        time: now,
      },
      {
        status: 'ambulance-assigned',
        message: `${nearestAmbulance.vehicleCode} assigned. Driver: ${nearestAmbulance.driverName}.`,
        time: now,
      },
      {
        status: 'hospital-notified',
        message: `${selectedHospital.name} pre-alerted with condition and ETA ${baseEtaMinutes} min.`,
        time: now,
      },
    ],
    notifications: [
      {
        target: 'patient',
        message: `${nearestAmbulance.vehicleCode} is on the way. ETA ${baseEtaMinutes} minutes.`,
        time: now,
      },
      {
        target: 'ambulance',
        message: `Navigate to pickup and then to ${selectedHospital.name}.`,
        time: now,
      },
      {
        target: 'hospital',
        message: `Incoming ${input.emergencyType} case. Prepare ${requiredBedType.toUpperCase()} bed.`,
        time: now,
      },
    ],
    updatedAt: now,
  };

  if (input.callerPhone) {
    request.notifications.push({
      target: 'patient',
      message: `Caller phone shared with ambulance team: ${input.callerPhone}.`,
      time: now,
    });
  }

  nearestAmbulance.status = 'dispatched';
  nearestAmbulance.currentRequestId = request.id;
  nearestAmbulance.updatedAt = now;

  store.smartEmergencies.push(request);
  updateSmartEmergencyProgress(store, request);

  return { ok: true, data: request };
}

export function getSmartEmergencyStatusById(requestId: number) {
  const store = getStore();
  const request = store.smartEmergencies.find((item) => item.id === requestId);
  if (!request) return null;

  updateSmartEmergencyProgress(store, request);

  const ambulance = store.ambulances.find((item) => item.id === request.assignedAmbulanceId);
  const hospital = store.hospitals.find((item) => item.id === request.selectedHospitalId);

  return {
    id: request.id,
    status: request.status,
    emergencyType: request.emergencyType,
    conditionSummary: request.conditionSummary,
    requestedAt: request.requestedAt,
    etaMinutes: request.currentEtaMinutes,
    patient: {
      name: request.patientName,
      patientId: request.patientUniqueId,
      age: request.age,
    },
    ambulance: ambulance
      ? {
          id: ambulance.id,
          vehicleCode: ambulance.vehicleCode,
          driverName: ambulance.driverName,
          driverPhone: ambulance.driverPhone,
          lat: Number(request.lastKnownAmbulanceLat.toFixed(5)),
          lng: Number(request.lastKnownAmbulanceLng.toFixed(5)),
        }
      : null,
    route: {
      pickup: { lat: request.pickupLat, lng: request.pickupLng },
      distanceKm: request.routeDistanceKm,
      optimized: true,
    },
    hospital: hospital
      ? {
          id: hospital.id,
          name: hospital.name,
          distanceKm: request.selectedHospitalDistanceKm,
          score: request.selectedHospitalScore,
          requiredBedType: request.requiredBedType,
          hasOxygenSupport: hospital.hasOxygenSupport,
        }
      : null,
    timeline: request.timeline,
    notifications: request.notifications,
  };
}

export function getSmartEmergencyAdminOverview() {
  const store = getStore();
  store.smartEmergencies.forEach((request) => updateSmartEmergencyProgress(store, request));

  const active = store.smartEmergencies
    .filter((request) => request.status !== 'arrived')
    .sort((first, second) => (first.requestedAt > second.requestedAt ? -1 : 1));

  const averageEta =
    active.length > 0
      ? Number((active.reduce((sum, request) => sum + request.currentEtaMinutes, 0) / active.length).toFixed(1))
      : 0;

  return {
    uspLine: 'We do not just send ambulances - we prepare the hospital before the patient arrives.',
    stats: {
      activeRequests: active.length,
      availableAmbulances: store.ambulances.filter((item) => item.status === 'available').length,
      hospitalsOnNetwork: store.hospitals.length,
      averageEtaMinutes: averageEta,
    },
    requests: active.map((request) => {
      const ambulance = store.ambulances.find((item) => item.id === request.assignedAmbulanceId);
      const hospital = store.hospitals.find((item) => item.id === request.selectedHospitalId);
      const latestAlert = request.notifications[request.notifications.length - 1] || null;
      const latestEmergencyAlert = [...request.notifications]
        .reverse()
        .find((note) => note.target === 'hospital' && note.priority === 'emergency') || null;
      return {
        id: request.id,
        patientName: request.patientName,
        patientId: request.patientUniqueId,
        emergencyType: request.emergencyType,
        conditionSummary: request.conditionSummary,
        status: request.status,
        etaMinutes: request.currentEtaMinutes,
        requestedAt: request.requestedAt,
        ambulance: ambulance
          ? {
              vehicleCode: ambulance.vehicleCode,
              driverName: ambulance.driverName,
            }
          : null,
        hospital: hospital
          ? {
              name: hospital.name,
              score: request.selectedHospitalScore,
              distanceKm: request.selectedHospitalDistanceKm,
              requiredBedType: request.requiredBedType,
            }
          : null,
        latestAlert,
        latestEmergencyAlert: latestEmergencyAlert
          ? {
              id: latestEmergencyAlert.id || null,
              message: latestEmergencyAlert.message,
              time: latestEmergencyAlert.time,
              acknowledgedAt: latestEmergencyAlert.acknowledgedAt || null,
              category: latestEmergencyAlert.category || 'critical-update',
            }
          : null,
      };
    }),
    ambulances: store.ambulances.map((item) => ({
      id: item.id,
      vehicleCode: item.vehicleCode,
      driverName: item.driverName,
      status: item.status,
      lat: Number(item.lat.toFixed(5)),
      lng: Number(item.lng.toFixed(5)),
      currentRequestId: item.currentRequestId,
    })),
  };
}

export function getHospitalEmergencyInbox(userId: number) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user || !['admin', 'doctor', 'reception'].includes(user.role)) return null;

  const overview = getSmartEmergencyAdminOverview();

  const pending = store.smartEmergencies
    .filter((request) => request.status !== 'arrived')
    .map((request) => {
      const latestEmergencyAlert = [...request.notifications]
        .reverse()
        .find((note) => note.target === 'hospital' && note.priority === 'emergency') || null;

      const unacknowledgedCount = request.notifications.filter(
        (note) => note.target === 'hospital' && note.priority === 'emergency' && !note.acknowledgedAt
      ).length;

      return {
        requestId: request.id,
        patientName: request.patientName,
        status: request.status,
        etaMinutes: request.currentEtaMinutes,
        unacknowledgedCount,
        latestEmergencyAlert: latestEmergencyAlert
          ? {
              id: latestEmergencyAlert.id || null,
              message: latestEmergencyAlert.message,
              time: latestEmergencyAlert.time,
              category: latestEmergencyAlert.category || 'critical-update',
              acknowledgedAt: latestEmergencyAlert.acknowledgedAt || null,
            }
          : null,
      };
    })
    .filter((item) => item.latestEmergencyAlert)
    .sort((first, second) => {
      if ((second.unacknowledgedCount || 0) !== (first.unacknowledgedCount || 0)) {
        return (second.unacknowledgedCount || 0) - (first.unacknowledgedCount || 0);
      }
      const firstTime = first.latestEmergencyAlert ? new Date(first.latestEmergencyAlert.time).getTime() : 0;
      const secondTime = second.latestEmergencyAlert ? new Date(second.latestEmergencyAlert.time).getTime() : 0;
      return secondTime - firstTime;
    });

  return {
    role: user.role,
    overview,
    pending,
    pendingEmergencyAlerts: pending.reduce((sum, item) => sum + item.unacknowledgedCount, 0),
  };
}

export function acknowledgeHospitalEmergencyAlert(
  userId: number,
  input: {
    requestId: number;
    alertId?: number;
    note?: string;
  }
) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user || !['admin', 'doctor', 'reception'].includes(user.role)) {
    return { ok: false, error: 'Hospital team account not found' as const };
  }

  const request = store.smartEmergencies.find((item) => item.id === input.requestId);
  if (!request) {
    return { ok: false, error: 'Emergency request not found' as const };
  }

  const targetAlert =
    (typeof input.alertId === 'number'
      ? request.notifications.find(
          (note) => note.id === input.alertId && note.target === 'hospital' && note.priority === 'emergency'
        )
      : [...request.notifications]
          .reverse()
          .find((note) => note.target === 'hospital' && note.priority === 'emergency' && !note.acknowledgedAt)) || null;

  if (!targetAlert) {
    return { ok: false, error: 'No pending emergency alert found for this request' as const };
  }

  if (targetAlert.acknowledgedAt) {
    return { ok: false, error: 'Emergency alert is already acknowledged' as const };
  }

  const now = new Date().toISOString();
  targetAlert.acknowledgedAt = now;

  const actorName = `${user.firstName} ${user.lastName}`.trim();
  const ackMessage =
    input.note?.trim() ||
    `Hospital acknowledged emergency alert and initiated pre-arrival protocol (${actorName}, ${user.role}).`;

  appendEmergencyNotification(request, 'ambulance', ackMessage, {
    priority: 'normal',
    category: 'hospital-ack',
    senderRole: user.role,
    notificationId: store.counters.notificationId++,
  });

  appendEmergencyNotification(request, 'patient', 'Hospital team confirmed emergency alert and is prepared.', {
    priority: 'normal',
    category: 'hospital-ack',
    senderRole: user.role,
    notificationId: store.counters.notificationId++,
  });

  request.updatedAt = now;

  return {
    ok: true,
    data: {
      requestId: request.id,
      alertId: targetAlert.id || null,
      acknowledgedAt: now,
      acknowledgedBy: {
        userId: user.id,
        name: actorName,
        role: user.role,
      },
      status: getSmartEmergencyStatusById(request.id),
    },
  };
}

function findAmbulanceForDriver(store: DemoStore, userId: number, fullName: string) {
  return (
    store.ambulances.find((item) => item.driverUserId === userId) ||
    store.ambulances.find((item) => item.driverName.toLowerCase() === fullName)
  );
}

export function getDriverEmergencyOverview(userId: number) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user || user.role !== 'driver') return null;

  store.smartEmergencies.forEach((request) => updateSmartEmergencyProgress(store, request));

  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
  const ambulance = findAmbulanceForDriver(store, userId, fullName);

  if (!ambulance) {
    return {
      driver: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone || '',
      },
      ambulance: null,
      activeRequest: null,
      recentUpdates: [],
      emergencyAlerts: [],
      hospitalAcknowledgements: [],
      performance: {
        completedCasesToday: 0,
        activeCases: 0,
        emergencyAlertsSentToday: 0,
      },
    };
  }

  ensureAmbulanceDefaults(ambulance);

  const currentRequest = ambulance.currentRequestId
    ? store.smartEmergencies.find((item) => item.id === ambulance.currentRequestId)
    : null;

  const recentUpdates = store.smartEmergencies
    .filter((request) => request.assignedAmbulanceId === ambulance.id)
    .flatMap((request) =>
      request.notifications
        .filter((note) => note.target === 'ambulance')
        .map((note) => ({
          requestId: request.id,
          patientName: request.patientName,
          message: note.message,
          time: note.time,
        }))
    )
    .sort((first, second) => (first.time > second.time ? -1 : 1))
    .slice(0, 8);

  const emergencyAlerts = store.smartEmergencies
    .filter((request) => request.assignedAmbulanceId === ambulance.id)
    .flatMap((request) =>
      request.notifications
        .filter((note) => note.priority === 'emergency' && note.senderRole === 'driver')
        .map((note) => ({
          id: note.id || null,
          requestId: request.id,
          patientName: request.patientName,
          message: note.message,
          time: note.time,
          category: note.category || 'critical-update',
          target: note.target,
        }))
    )
    .sort((first, second) => (first.time > second.time ? -1 : 1))
    .slice(0, 6);

  const hospitalAcknowledgements = store.smartEmergencies
    .filter((request) => request.assignedAmbulanceId === ambulance.id)
    .flatMap((request) =>
      request.notifications
        .filter((note) => note.target === 'ambulance' && note.category === 'hospital-ack')
        .map((note) => ({
          requestId: request.id,
          patientName: request.patientName,
          message: note.message,
          time: note.time,
          senderRole: note.senderRole || 'hospital',
        }))
    )
    .sort((first, second) => (first.time > second.time ? -1 : 1))
    .slice(0, 6);

  const today = new Date().toISOString().slice(0, 10);
  const completedCasesToday = store.smartEmergencies.filter(
    (request) => request.assignedAmbulanceId === ambulance.id && request.status === 'arrived' && request.updatedAt.slice(0, 10) === today
  ).length;

  const emergencyAlertsSentToday = emergencyAlerts.filter((alert) => alert.time.slice(0, 10) === today).length;

  const activeRequest = currentRequest
    ? (() => {
        const hospital = store.hospitals.find((item) => item.id === currentRequest.selectedHospitalId);
        return {
          id: currentRequest.id,
          patientName: currentRequest.patientName,
          patientId: currentRequest.patientUniqueId,
          emergencyType: currentRequest.emergencyType,
          conditionSummary: currentRequest.conditionSummary,
          status: currentRequest.status,
          etaMinutes: currentRequest.currentEtaMinutes,
          pickup: {
            lat: currentRequest.pickupLat,
            lng: currentRequest.pickupLng,
          },
          hospital: hospital
            ? {
                name: hospital.name,
                requiredBedType: currentRequest.requiredBedType,
                lat: hospital.lat,
                lng: hospital.lng,
              }
            : null,
          timeline: currentRequest.timeline,
        };
      })()
    : null;

  return {
    driver: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone || ambulance.driverPhone,
    },
    ambulance: {
      id: ambulance.id,
      vehicleCode: ambulance.vehicleCode,
      status: ambulance.status,
      lat: Number(ambulance.lat.toFixed(5)),
      lng: Number(ambulance.lng.toFixed(5)),
      currentRequestId: ambulance.currentRequestId,
      shiftStatus: ambulance.shiftStatus,
      fuelLevelPercent: ambulance.fuelLevelPercent,
      standbyZone: ambulance.standbyZone,
      oxygenKitReady: ambulance.oxygenKitReady,
      defibrillatorReady: ambulance.defibrillatorReady,
      stretcherReady: ambulance.stretcherReady,
      vehicleNotes: ambulance.vehicleNotes,
      lastMaintenanceDate: ambulance.lastMaintenanceDate,
    },
    activeRequest,
    recentUpdates,
    emergencyAlerts,
    hospitalAcknowledgements,
    performance: {
      completedCasesToday,
      activeCases: currentRequest ? 1 : 0,
      emergencyAlertsSentToday,
    },
  };
}

export function updateDriverOperationalProfile(
  userId: number,
  input: {
    name?: string;
    phone?: string;
    lat?: number;
    lng?: number;
    shiftStatus?: 'on-duty' | 'break' | 'off-duty';
    fuelLevelPercent?: number;
    standbyZone?: string;
    oxygenKitReady?: boolean;
    defibrillatorReady?: boolean;
    stretcherReady?: boolean;
    vehicleNotes?: string;
    lastMaintenanceDate?: string;
  }
) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user || user.role !== 'driver') {
    return { ok: false, error: 'Driver account not found' as const };
  }

  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
  const ambulance = findAmbulanceForDriver(store, userId, fullName);

  if (!ambulance) {
    return { ok: false, error: 'No ambulance assigned to this driver' as const };
  }

  ensureAmbulanceDefaults(ambulance);

  if (typeof input.name === 'string') {
    const normalizedName = input.name.trim().replace(/\s+/g, ' ');
    if (normalizedName.length < 3) {
      return { ok: false, error: 'Driver name must be at least 3 characters' as const };
    }

    const parts = normalizedName.split(' ');
    user.firstName = parts[0];
    user.lastName = parts.slice(1).join(' ') || 'Driver';
    ambulance.driverName = normalizedName;
  }

  if (typeof input.phone === 'string') {
    const normalizedPhone = input.phone.replace(/[^0-9]/g, '').slice(0, 15);
    if (normalizedPhone.length < 10) {
      return { ok: false, error: 'Driver phone must be at least 10 digits' as const };
    }
    user.phone = normalizedPhone;
    ambulance.driverPhone = normalizedPhone;
  }

  if (typeof input.lat === 'number') {
    if (input.lat < -90 || input.lat > 90) {
      return { ok: false, error: 'Latitude must be between -90 and 90' as const };
    }
    ambulance.lat = Number(input.lat.toFixed(5));
  }

  if (typeof input.lng === 'number') {
    if (input.lng < -180 || input.lng > 180) {
      return { ok: false, error: 'Longitude must be between -180 and 180' as const };
    }
    ambulance.lng = Number(input.lng.toFixed(5));
  }

  if (typeof input.shiftStatus === 'string') {
    if (!['on-duty', 'break', 'off-duty'].includes(input.shiftStatus)) {
      return { ok: false, error: 'Invalid shift status' as const };
    }
    ambulance.shiftStatus = input.shiftStatus;
  }

  if (typeof input.fuelLevelPercent === 'number') {
    if (input.fuelLevelPercent < 0 || input.fuelLevelPercent > 100) {
      return { ok: false, error: 'Fuel level must be between 0 and 100' as const };
    }
    ambulance.fuelLevelPercent = Number(input.fuelLevelPercent.toFixed(0));
  }

  if (typeof input.standbyZone === 'string') {
    const value = input.standbyZone.trim();
    if (value.length < 3) {
      return { ok: false, error: 'Standby zone must be at least 3 characters' as const };
    }
    ambulance.standbyZone = value.slice(0, 80);
  }

  if (typeof input.oxygenKitReady === 'boolean') ambulance.oxygenKitReady = input.oxygenKitReady;
  if (typeof input.defibrillatorReady === 'boolean') ambulance.defibrillatorReady = input.defibrillatorReady;
  if (typeof input.stretcherReady === 'boolean') ambulance.stretcherReady = input.stretcherReady;

  if (typeof input.vehicleNotes === 'string') {
    ambulance.vehicleNotes = input.vehicleNotes.trim().slice(0, 240);
  }

  if (typeof input.lastMaintenanceDate === 'string') {
    const parsedDate = new Date(input.lastMaintenanceDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return { ok: false, error: 'Invalid maintenance date' as const };
    }
    ambulance.lastMaintenanceDate = parsedDate.toISOString();
  }

  ambulance.updatedAt = new Date().toISOString();

  return {
    ok: true,
    data: getDriverEmergencyOverview(userId),
  };
}

export function sendDriverEmergencyAlert(
  userId: number,
  input: {
    requestId: number;
    alertType:
      | 'patient-critical'
      | 'route-blocked'
      | 'requires-icu-prep'
      | 'oxygen-support-needed'
      | 'security-support';
    message?: string;
  }
) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user || user.role !== 'driver') {
    return { ok: false, error: 'Driver account not found' as const };
  }

  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
  const ambulance = findAmbulanceForDriver(store, userId, fullName);

  if (!ambulance) {
    return { ok: false, error: 'No ambulance assigned to this driver' as const };
  }

  if (ambulance.currentRequestId !== input.requestId) {
    return { ok: false, error: 'This emergency is not assigned to your ambulance' as const };
  }

  const request = store.smartEmergencies.find((item) => item.id === input.requestId);
  if (!request) {
    return { ok: false, error: 'Emergency request not found' as const };
  }

  const alertMessageMap: Record<typeof input.alertType, string> = {
    'patient-critical': 'Patient condition is worsening, immediate emergency bay support required.',
    'route-blocked': 'Primary route is blocked. Switching to alternate emergency route.',
    'requires-icu-prep': 'Please keep ICU stabilization team and bed ready before arrival.',
    'oxygen-support-needed': 'Prepare high-flow oxygen support at emergency entrance.',
    'security-support': 'Need security support for fast handover at emergency gate.',
  };

  const composedMessage = (input.message || alertMessageMap[input.alertType]).trim();
  if (!composedMessage) {
    return { ok: false, error: 'Alert message cannot be empty' as const };
  }

  const hospitalNotificationId = store.counters.notificationId++;
  const ambulanceNotificationId = store.counters.notificationId++;
  const prefixed = `EMERGENCY ALERT (${ambulance.vehicleCode}): ${composedMessage}`;

  appendEmergencyNotification(request, 'hospital', prefixed, {
    priority: 'emergency',
    category: input.alertType,
    senderRole: 'driver',
    notificationId: hospitalNotificationId,
  });

  appendEmergencyNotification(request, 'ambulance', `Alert broadcast to hospital: ${composedMessage}`, {
    priority: 'emergency',
    category: input.alertType,
    senderRole: 'driver',
    notificationId: ambulanceNotificationId,
  });

  request.updatedAt = new Date().toISOString();

  return {
    ok: true,
    data: {
      requestId: request.id,
      alertType: input.alertType,
      message: composedMessage,
      sentAt: request.updatedAt,
    },
  };
}

export function updateDriverEmergencyStatus(
  userId: number,
  input: {
    requestId: number;
    status: EmergencyStatus;
    note?: string;
  }
) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user || user.role !== 'driver') {
    return { ok: false, error: 'Driver account not found' as const };
  }

  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
  const ambulance = findAmbulanceForDriver(store, userId, fullName);

  if (!ambulance) {
    return { ok: false, error: 'No ambulance assigned to this driver' as const };
  }

  if (ambulance.currentRequestId !== input.requestId) {
    return { ok: false, error: 'This emergency is not assigned to your ambulance' as const };
  }

  const request = store.smartEmergencies.find((item) => item.id === input.requestId);
  if (!request) {
    return { ok: false, error: 'Emergency request not found' as const };
  }

  if (getEmergencyStatusRank(input.status) < getEmergencyStatusRank(request.status)) {
    return { ok: false, error: 'Cannot move request to an earlier status' as const };
  }

  const now = new Date().toISOString();
  request.status = input.status;
  request.updatedAt = now;

  const statusMessageMap: Record<EmergencyStatus, string> = {
    requested: 'Emergency request received by system.',
    'ambulance-assigned': `Driver ${user.firstName} acknowledged assignment.`,
    'en-route': 'Driver confirmed patient onboard and route started.',
    'hospital-notified': 'Hospital notified with driver live ETA update.',
    arriving: 'Driver reported arrival at hospital gate.',
    arrived: 'Driver completed patient handover at hospital.',
  };

  const noteText = input.note?.trim();
  appendEmergencyEvent(request, input.status, noteText || statusMessageMap[input.status]);

  appendEmergencyNotification(
    request,
    'ambulance',
    noteText || `Status updated to ${input.status.replace('-', ' ')} by ${user.firstName}.`,
    {
      priority: 'normal',
      senderRole: 'driver',
      notificationId: store.counters.notificationId++,
    }
  );

  if (input.status === 'hospital-notified' || input.status === 'arriving' || input.status === 'arrived') {
    appendEmergencyNotification(
      request,
      'hospital',
      noteText || `Ambulance ${ambulance.vehicleCode}: ${input.status.replace('-', ' ')}.`,
      {
        priority: 'normal',
        senderRole: 'driver',
        notificationId: store.counters.notificationId++,
      }
    );
  }

  if (input.status === 'arrived') {
    request.currentEtaMinutes = 0;
    request.baseEtaMinutes = 0;
    ambulance.status = 'available';
    ambulance.currentRequestId = null;
    const hospital = store.hospitals.find((item) => item.id === request.selectedHospitalId);
    if (hospital) {
      ambulance.lat = hospital.lat;
      ambulance.lng = hospital.lng;
      request.lastKnownAmbulanceLat = hospital.lat;
      request.lastKnownAmbulanceLng = hospital.lng;
    }
  } else {
    ambulance.status = 'dispatched';
    ambulance.updatedAt = now;
  }

  return { ok: true, data: getSmartEmergencyStatusById(request.id) };
}
