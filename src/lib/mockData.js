// mockData.ts

export const mockBonds = [
  {
    id: 'bond_001',
    title: 'Healthier SG: Diabetes Risk Screening',
    description: 'Screen seniors aged 60+ for diabetes risk under Healthier SG with subsidised follow-up',
    healthOutcome: 'Reduced risk of diabetes onset among elderly',
    targetAmount: 40000,
    currentAmount: 29000,
    yieldRate: 0.07,
    maturityDate: '2026-01-31',
    status: 'active',
    provider: {
      name: 'SingHealth Polyclinic (Punggol)',
      location: 'Singapore',
      verified: true
    },
    outcomes: [
      { target: '300 seniors screened', achieved: false },
      { target: '70% follow-up with care coordinators', achieved: false }
    ]
  },
  {
    id: 'bond_002',
    title: 'Vaccinations for Pregnant Women',
    description: 'Support prenatal Tdap vaccinations in Metro Manila clinics to reduce neonatal infections',
    healthOutcome: 'Improved maternal and neonatal outcomes',
    targetAmount: 50000,
    currentAmount: 50000,
    yieldRate: 0.11,
    maturityDate: '2025-10-30',
    status: 'funded',
    provider: {
      name: 'Philippine General Hospital Outreach',
      location: 'Philippines',
      verified: true
    },
    outcomes: [
      {
        target: '1000 women vaccinated',
        achieved: true,
        verificationDate: '2025-06-01'
      },
      {
        target: '90% reported reduced hospitalization post-birth',
        achieved: true,
        verificationDate: '2025-06-01'
      }
    ]
  },
  {
    id: 'bond_003',
    title: 'TB Screening for Migrant Workers in Johor',
    description: 'Mobile van screening and follow-up for tuberculosis in industrial zones',
    healthOutcome: 'Early detection and treatment initiation',
    targetAmount: 65000,
    currentAmount: 30000,
    yieldRate: 0.10,
    maturityDate: '2026-02-15',
    status: 'active',
    provider: {
      name: 'Hospital Sultanah Aminah Public Health Unit',
      location: 'Malaysia',
      verified: true
    },
    outcomes: [
      { target: '800 workers screened', achieved: false },
      { target: '50+ early TB cases treated within 2 weeks', achieved: false }
    ]
  },
  {
    id: 'bond_004',
    title: 'Youth Mental Health Screening in IHLs',
    description: 'Digital mental health screening for ITE, Poly, and JC students, with referral pathways',
    healthOutcome: 'Earlier detection of moderate/severe depression',
    targetAmount: 70000,
    currentAmount: 70000,
    yieldRate: 0.10,
    maturityDate: '2025-09-15',
    status: 'completed',
    provider: {
      name: 'National Council of Social Service (NCSS)',
      location: 'Singapore',
      verified: true
    },
    outcomes: [
      {
        target: '2000 students screened',
        achieved: true,
        verificationDate: '2025-05-10'
      },
      {
        target: '15% referred for professional care',
        achieved: true,
        verificationDate: '2025-05-10'
      }
    ]
  },
  {
    id: 'bond_005',
    title: 'Anemia Prevention in Rural Indonesia',
    description: 'Iron supplement delivery and nutrition education to teenage girls in West Java',
    healthOutcome: 'Reduced anemia prevalence in adolescent females',
    targetAmount: 30000,
    currentAmount: 18000,
    yieldRate: 0.09,
    maturityDate: '2026-06-01',
    status: 'active',
    provider: {
      name: 'Yayasan Gizi Sehat',
      location: 'Indonesia',
      verified: true
    },
    outcomes: [
      { target: '1000 girls enrolled', achieved: false },
      { target: '25% reduction in anemia (measured via Hb levels)', achieved: false }
    ]
  }
];

export const mockInvestments = [
  {
    id: 'inv_001',
    bondId: 'bond_001',
    amount: 8000,
    investmentDate: '2025-04-01',
    status: 'active',
    yieldEarned: 0,
    escrowTxHash: '0xsgdiab001xrp'
  },
  {
    id: 'inv_002',
    bondId: 'bond_002',
    amount: 15000,
    investmentDate: '2025-02-10',
    status: 'settled',
    yieldEarned: 1650,
    escrowTxHash: '0xphvac002xrp'
  },
  {
    id: 'inv_003',
    bondId: 'bond_004',
    amount: 12000,
    investmentDate: '2025-01-20',
    status: 'settled',
    yieldEarned: 1320,
    escrowTxHash: '0xsgmht003xrp'
  }
];

export const mockCredentials = [
  {
    id: 'cred_001',
    bondId: 'bond_002',
    issuerDid: 'did:xrpl:rPGH_Manila',
    subjectDid: 'did:xrpl:rMother123',
    credentialType: 'VaccinationRecord',
    issuedAt: '2025-06-01T08:00:00Z',
    verified: true,
    outcomeData: {
      type: 'vaccination_completion',
      value: 1000,
      unit: 'count'
    }
  },
  {
    id: 'cred_002',
    bondId: 'bond_004',
    issuerDid: 'did:xrpl:rNCSS_SG',
    subjectDid: 'did:xrpl:rStudent5678',
    credentialType: 'ScreeningCompletion',
    issuedAt: '2025-05-10T12:30:00Z',
    verified: true,
    outcomeData: {
      type: 'mental_health_screenings',
      value: 2000,
      unit: 'count'
    }
  }
];

// Utility functions
export const getBondById = (id) => {
  return mockBonds.find(bond => bond.id === id);
};

export const getInvestmentsByUser = (userAddress) => {
  // In a real app, this would filter by user
  return mockInvestments;
};

export const getCredentialsByBond = (bondId) => {
  return mockCredentials.filter(cred => cred.bondId === bondId);
};

export const calculateTotalInvested = (investments) => {
  return investments.reduce((total, inv) => total + inv.amount, 0);
};

export const calculateTotalYield = (investments) => {
  return investments.reduce((total, inv) => total + inv.yieldEarned, 0);
};

export const getActiveBondsCount = (investments) => {
  const activeBondIds = new Set(
      investments
          .filter(inv => inv.status === 'active')
          .map(inv => inv.bondId)
  );
  return activeBondIds.size;
};
