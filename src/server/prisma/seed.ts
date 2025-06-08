import { PrismaClient, UserType, BondStatus, InvestmentStatus } from '@prisma/client'
import * as xrpl from 'xrpl'

const prisma = new PrismaClient()

async function createTestWallet(): Promise<{ address: string; seed: string }> {
  const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233')
  await client.connect()
  const wallet = await client.fundWallet()
  await client.disconnect()
  return {
    address: wallet.wallet.address,
    seed: wallet.wallet.seed as string
  }
}

async function main() {
  console.log('Seeding database...')
  
  // Create test wallets
  console.log('Creating test wallets...')
  const investorWallet = await createTestWallet()
  const provider1Wallet = await createTestWallet()
  const provider2Wallet = await createTestWallet()
  const patientWallet = await createTestWallet()
  
  // Create users
  console.log('Creating users...')
  const investor = await prisma.user.create({
    data: {
      walletAddress: investorWallet.address,
      userType: UserType.INVESTOR,
      verified: true,
      totalInvested: 5000,
      totalYieldEarned: 250,
      activeBonds: 2
    }
  })
  
  const provider1 = await prisma.user.create({
    data: {
      walletAddress: provider1Wallet.address,
      userType: UserType.PROVIDER,
      verified: true
    }
  })
  
  const provider2 = await prisma.user.create({
    data: {
      walletAddress: provider2Wallet.address,
      userType: UserType.PROVIDER,
      verified: true
    }
  })
  
  const patient = await prisma.user.create({
    data: {
      walletAddress: patientWallet.address,
      userType: UserType.PATIENT,
      verified: true
    }
  })
  
  // Create BioBonds
  console.log('Creating BioBonds...')
  const diabetesBond = await prisma.bioBond.create({
    data: {
      title: 'Diabetes Prevention Program',
      description: 'A program focused on preventing diabetes through lifestyle changes and early intervention.',
      healthOutcome: 'Reduced diabetes incidence by 30% in high-risk populations',
      targetAmount: 1000000,
      currentAmount: 750000,
      yieldRate: 5.5,
      maturityDate: new Date('2026-12-31'),
      status: BondStatus.ACTIVE,
      escrowAddress: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      conditionHash: '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF',
      providerId: provider1.id,
      outcomes: {
        create: [
          {
            target: 'Reduce HbA1c levels by 1% in pre-diabetic patients',
            achieved: false
          },
          {
            target: 'Achieve 10% weight loss in 50% of participants',
            achieved: true,
            verificationDate: new Date('2025-03-15')
          }
        ]
      }
    }
  })
  
  const heartBond = await prisma.bioBond.create({
    data: {
      title: 'Cardiovascular Health Initiative',
      description: 'A comprehensive program to reduce heart disease risk through preventive care and education.',
      healthOutcome: 'Decreased heart attack incidence by 25% in target population',
      targetAmount: 2000000,
      currentAmount: 1200000,
      yieldRate: 6.2,
      maturityDate: new Date('2027-06-30'),
      status: BondStatus.ACTIVE,
      escrowAddress: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      providerId: provider2.id,
      outcomes: {
        create: [
          {
            target: 'Reduce blood pressure to normal levels in 60% of hypertensive patients',
            achieved: false
          },
          {
            target: 'Increase physical activity to 150 minutes per week in 70% of participants',
            achieved: false
          }
        ]
      }
    }
  })
  
  const mentalHealthBond = await prisma.bioBond.create({
    data: {
      title: 'Community Mental Health Access',
      description: 'Expanding access to mental health services in underserved communities.',
      healthOutcome: 'Improved mental health outcomes and reduced hospitalization rates',
      targetAmount: 1500000,
      currentAmount: 500000,
      yieldRate: 4.8,
      maturityDate: new Date('2026-09-30'),
      status: BondStatus.ACTIVE,
      providerId: provider1.id,
      outcomes: {
        create: [
          {
            target: 'Provide mental health screening to 10,000 individuals',
            achieved: true,
            verificationDate: new Date('2025-01-10')
          },
          {
            target: 'Reduce emergency psychiatric admissions by 15%',
            achieved: false
          }
        ]
      }
    }
  })
  
  // Create Investments
  console.log('Creating Investments...')
  await prisma.investment.create({
    data: {
      bondId: diabetesBond.id,
      investorId: investor.id,
      amount: 250000,
      investmentDate: new Date('2025-01-15'),
      status: InvestmentStatus.ACTIVE,
      escrowTxHash: '0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890'
    }
  })
  
  await prisma.investment.create({
    data: {
      bondId: heartBond.id,
      investorId: investor.id,
      amount: 500000,
      investmentDate: new Date('2025-02-10'),
      status: InvestmentStatus.ACTIVE,
      yieldEarned: 15500,
      escrowTxHash: '0xFEDCBA0987654321FEDCBA0987654321FEDCBA0987654321FEDCBA0987654321'
    }
  })
  
  // Create Credentials
  console.log('Creating Credentials...')
  await prisma.credential.create({
    data: {
      bondId: diabetesBond.id,
      issuerId: provider1.id,
      subjectId: patient.id,
      issuerDid: `did:xrpl:${provider1Wallet.address}`,
      subjectDid: `did:xrpl:${patientWallet.address}`,
      credentialType: 'HealthOutcomeVerification',
      issuedAt: new Date('2025-03-01'),
      expiresAt: new Date('2026-03-01'),
      verified: true,
      outcomeData: {
        metric: 'HbA1c',
        initialValue: 6.5,
        currentValue: 5.7,
        targetValue: 5.6,
        improvementPercentage: 12.3,
        verificationMethod: 'Laboratory Test',
        verificationDate: '2025-03-01'
      },
      xrplTxHash: '0x123456789ABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF1234'
    }
  })
  
  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
