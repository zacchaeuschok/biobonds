# BioBonds - DeFi Meets Preventive Health

![BioBonds Logo](./public/biobonds-logo.png)

## Overview

BioBonds is a decentralized finance (DeFi) platform that connects investors with preventive healthcare initiatives through blockchain-powered impact bonds. The platform enables investors to fund critical preventive health programs while earning returns based on verified health outcomes.

### Problem

Preventive health programs (e.g., diabetes screening, cancer tests, vaccines) are chronically underfunded because they don't generate immediate ROI. Governments and insurers often can't justify frontloading these costs—yet downstream savings (from avoided hospitalizations) are massive. There's no efficient way for private capital to finance upstream health outcomes and earn returns based on verifiable results.

### Solution: Health Impact Bonds on XRPL

BioBonds let investors fund preventive care (e.g., $10 for a screening) and earn tokenized returns only if the health outcome is met. These are programmable financial instruments:

1. Investors stake XRP into a smart contract (escrow)
2. Funds are released to healthcare providers only after a verified outcome is achieved
3. Investors earn impact yield (subsidized by insurers or NGOs)
4. All transactions and outcomes are publicly auditable and pseudonymous

## Technical Architecture

BioBonds leverages the XRP Ledger (XRPL) for secure, fast, and low-cost transactions:

- **XRPL Escrow**: Guarantees outcome-based disbursement
- **Wallet Integration**: Secure connection to XRPL wallets for investment transactions
- **Time-based Escrow**: Funds are locked until specific conditions are met
- **Transaction Verification**: All investments can be verified on the XRPL explorer
- **DID Verifiable Credentials**: Health outcomes are verified using XRPL's native DID credential system

## XRPL DID Verifiable Credentials

BioBonds uses XRPL's Decentralized Identifier (DID) system to create and verify health outcome credentials:

### How It Works

1. **Credential Issuance**: Healthcare providers issue verifiable credentials on the XRPL when health outcomes are achieved
2. **Credential Verification**: Investors can verify these credentials on-chain before funds are released
3. **Escrow Release**: Once credentials are verified, escrow funds can be released to healthcare providers

### Key Components

- **CredentialIssuer**: React component for healthcare providers to issue verifiable credentials
- **CredentialVerifier**: React component for investors to verify health outcome credentials
- **EscrowReleaseModal**: Component for releasing escrow funds based on verified credentials

### Technical Implementation

- Credentials are stored as `CredentialSet` transactions on the XRPL
- Each credential contains:
  - Issuer (healthcare provider's XRPL address)
  - Subject (patient's XRPL address)
  - Credential Type (e.g., "HealthOutcome")
  - Outcome Data (description, value, date, etc.)
  - Expiration Date
- Verification checks the XRPL ledger for valid credentials using the `ledger_entry` API
- All credential transactions can be viewed in the XRPL explorer

### Demo Flow

1. Connect a wallet using the WalletConnection component
2. Invest in a health bond (creates an XRPL escrow transaction)
3. Issue a health outcome credential (as a healthcare provider)
4. Verify the credential (as an investor)
5. Release the escrow funds based on the verified credential

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PNPM package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/biobonds.git
   cd biobonds
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
pnpm build
```

The build artifacts will be stored in the `dist/` directory.

## Using the Application

### 1. Connect Your Wallet

- Click on "Connect Wallet" in the top navigation bar
- For testing purposes, you can create a test wallet that will be funded with XRP from the XRPL testnet
- You can specify a funding amount (up to 100 XRP, though the testnet typically provides 10 XRP)
- Your wallet address and balance will be displayed once connected

### 2. Browse Available Health Bonds

- The dashboard displays a list of available health bonds
- Each bond shows:
  - Health initiative title and description
  - Target funding amount and current progress
  - Expected yield rate
  - Provider information
  - Health outcomes to be achieved

### 3. Invest in a Bond

- Click on a bond card to view detailed information
- Click "Invest" to open the investment modal
- Enter your desired investment amount (must be less than your wallet balance)
- Confirm the transaction to create an escrow on the XRPL testnet
- The transaction will be processed and you'll receive a confirmation with a transaction hash
- You can view your transaction on the XRPL explorer by clicking the provided link

### 4. Monitor Your Investments

- Your active investments are displayed in the "My Investments" section
- You can track the progress of each bond and see when outcomes are verified
- When health outcomes are achieved, your returns will be calculated and displayed

## Testing on XRPL Testnet

This application runs on the XRPL testnet, which means:

- No real money is at risk
- Test wallets are funded with test XRP from the XRPL testnet faucet
- Transactions are real but occur on the testnet blockchain
- Escrow transactions are time-based with:
  - FinishAfter: 1 minute (for demo purposes)
  - CancelAfter: 30 days

## Technical Details

- **Frontend**: React with Vite, Tailwind CSS, and Radix UI components
- **State Management**: Zustand for global state
- **Blockchain Integration**: XRPL JavaScript SDK (xrpl.js)
- **Wallet Management**: Custom wallet connection and management
- **Transaction Handling**: Real XRPL escrow transactions with proper signing and submission

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please open an issue on the GitHub repository.