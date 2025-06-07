// Mock data for demonstration
export const mockBonds = [
  {
    id: 'bond_001',
    title: 'Diabetes Prevention Screening',
    description: 'Fund HbA1c screening for at-risk populations in rural communities',
    healthOutcome: 'Early diabetes detection and prevention',
    targetAmount: 50000,
    currentAmount: 32500,
    yieldRate: 0.08,
    maturityDate: '2025-12-31',
    status: 'active',
    provider: {
      name: 'Community Health Center',
      location: 'Rural Kenya',
      verified: true
    },
    outcomes: [
      {
        target: '500 HbA1c screenings completed',
        achieved: false
      },
      {
        target: '50+ early diabetes cases identified',
        achieved: false
      }
    ]
  },
  {
    id: 'bond_002',
    title: 'Maternal Health Vaccination',
    description: 'Provide prenatal vaccinations to reduce maternal mortality',
    healthOutcome: 'Reduced maternal and infant mortality',
    targetAmount: 75000,
    currentAmount: 75000,
    yieldRate: 0.12,
    maturityDate: '2025-09-30',
    status: 'funded',
    provider: {
      name: 'Global Health Initiative',
      location: 'Bangladesh',
      verified: true
    },
    outcomes: [
      {
        target: '1000 prenatal vaccinations',
        achieved: true,
        verificationDate: '2025-06-01'
      },
      {
        target: '95% vaccination completion rate',
        achieved: true,
        verificationDate: '2025-06-01'
      }
    ]
  },
  {
    id: 'bond_003',
    title: 'Hypertension Management',
    description: 'Blood pressure monitoring and medication adherence program',
    healthOutcome: 'Improved cardiovascular health outcomes',
    targetAmount: 100000,
    currentAmount: 45000,
    yieldRate: 0.10,
    maturityDate: '2026-03-31',
    status: 'active',
    provider: {
      name: 'Urban Health Network',
      location: 'São Paulo, Brazil',
      verified: true
    },
    outcomes: [
      {
        target: '300 patients enrolled in program',
        achieved: false
      },
      {
        target: '80% medication adherence rate',
        achieved: false
      },
      {
        target: '15% average blood pressure reduction',
        achieved: false
      }
    ]
  },
  {
    id: 'bond_004',
    title: 'Mental Health Screening',
    description: 'Depression and anxiety screening in underserved communities',
    healthOutcome: 'Early mental health intervention',
    targetAmount: 60000,
    currentAmount: 60000,
    yieldRate: 0.09,
    maturityDate: '2025-08-15',
    status: 'completed',
    provider: {
      name: 'Mental Wellness Foundation',
      location: 'Detroit, USA',
      verified: true
    },
    outcomes: [
      {
        target: '800 mental health screenings',
        achieved: true,
        verificationDate: '2025-05-15'
      },
      {
        target: '200 referrals to treatment',
        achieved: true,
        verificationDate: '2025-05-15'
      }
    ]
  }
];

export const mockInvestments = [
  {
    id: 'inv_001',
    bondId: 'bond_001',
    amount: 5000,
    investmentDate: '2025-03-15',
    status: 'active',
    yieldEarned: 0,
    escrowTxHash: '0x1234567890abcdef'
  },
  {
    id: 'inv_002',
    bondId: 'bond_002',
    amount: 10000,
    investmentDate: '2025-02-01',
    status: 'settled',
    yieldEarned: 1200,
    escrowTxHash: '0xabcdef1234567890'
  },
  {
    id: 'inv_003',
    bondId: 'bond_004',
    amount: 7500,
    investmentDate: '2025-01-10',
    status: 'settled',
    yieldEarned: 675,
    escrowTxHash: '0x567890abcdef1234'
  }
];

export const mockCredentials = [
  {
    id: 'cred_001',
    bondId: 'bond_002',
    issuerDid: 'did:xrpl:rGlobalHealthInitiative123',
    subjectDid: 'did:xrpl:rPatient456',
    credentialType: 'VaccinationRecord',
    issuedAt: '2025-06-01T10:00:00Z',
    verified: true,
    outcomeData: {
      type: 'vaccination_completion',
      value: 95,
      unit: 'percentage'
    }
  },
  {
    id: 'cred_002',
    bondId: 'bond_004',
    issuerDid: 'did:xrpl:rMentalWellnessFoundation789',
    subjectDid: 'did:xrpl:rPatient789',
    credentialType: 'ScreeningCompletion',
    issuedAt: '2025-05-15T14:30:00Z',
    verified: true,
    outcomeData: {
      type: 'screenings_completed',
      value: 800,
      unit: 'count'
    }
  }
];

// Utility functions for mock data
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

