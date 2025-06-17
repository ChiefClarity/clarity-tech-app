export const MOCK_CUSTOMER = {
  id: 'test-001',
  firstName: 'John',
  lastName: 'TestCustomer',
  email: 'test@example.com',
  phone: '(555) 123-4567',
  address: '123 Test Pool Lane',
  city: 'Miami',
  state: 'FL',
  zipCode: '33101',
};

export const MOCK_ONBOARDING_SESSION = {
  customerId: 'test-001',
  customerName: 'John TestCustomer',
  address: '123 Test Pool Lane, Miami, FL 33101',
  status: 'in-progress',
};

// Mock AI analysis results
export const MOCK_AI_RESPONSES = {
  equipment: {
    pump: {
      type: 'variable-speed',
      manufacturer: 'Pentair',
      model: 'IntelliFlo VSF',
      serialNumber: 'PNT123456',
      condition: 'good',
    },
    filter: {
      type: 'cartridge',
      manufacturer: 'Hayward',
      model: 'C4030',
      serialNumber: 'HAY789012',
      cartridgeModel: 'CX580XRE',
      condition: 'fair',
    },
    sanitizer: {
      type: 'salt',
      manufacturer: 'Hayward',
      model: 'AquaRite 900',
      serialNumber: 'AR900-2023',
      condition: 'excellent',
    },
    heater: {
      type: 'gas',
      manufacturer: 'Raypak',
      model: '406A',
      serialNumber: 'RP406-456',
      condition: 'good',
    },
    timer: {
      type: 'digital',
      manufacturer: 'Intermatic',
      model: 'PE153',
      condition: 'good',
      startTime: { hour: '8', minute: '00', period: 'AM' },
      endTime: { hour: '6', minute: '00', period: 'PM' },
    },
    pressureGauge: {
      reading: '18',
    },
  },
  poolProfile: {
    shape: 'kidney',
    length: 32,
    width: 16,
    avgDepth: 5.5,
    gallons: 18000,
    surface: 'plaster',
    features: ['spa', 'waterfall'],
  },
  waterChemistry: {
    pH: 7.4,
    chlorine: 2.5,
    alkalinity: 100,
    calcium: 250,
    cyanuric: 50,
    phosphates: 200,
    salt: 3200,
  },
};

// Additional mock data for complete forms
export const MOCK_POOL_DATA = {
  poolType: 'pool-spa',
  poolShape: 'kidney',
  poolLength: '32',
  poolWidth: '16',
  shallowDepth: '3.5',
  deepDepth: '8',
  avgDepth: '5.5',
  poolGallons: '18000',
  poolSurface: 'plaster',
  poolAge: '8',
  tileCondition: 'good',
  caulkingCondition: 'fair',
  deckingCondition: 'good',
  features: ['spa', 'waterfall', 'lights'],
};

export const MOCK_WATER_DATA = {
  ph: '7.4',
  chlorine: '2.5',
  alkalinity: '100',
  calcium: '250',
  cyanuricAcid: '50',
  phosphates: '200',
  salt: '3200',
  totalDissolvedSolids: '1500',
  metals: '0',
  temperature: '82',
};

export const MOCK_CHALLENGES = [
  'algae',
  'staining',
  'cloudy_water',
];

export const MOCK_NOTES = {
  voiceTranscription: "This is a mock transcription. The pool equipment is in good condition. The pump is working well and running quietly. The filter was recently cleaned and cartridge looks good for another season. The salt cell was inspected and is producing chlorine properly. Overall the equipment pad is well organized and maintained.",
  textNotes: "Customer mentioned they had algae issues last summer. They prefer to maintain higher chlorine levels. Equipment pad has good drainage. All valves are labeled properly.",
};