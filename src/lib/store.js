import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// XRPL Store for wallet and blockchain state
export const useXRPLStore = create(
  persist(
    (set, get) => ({
      // Wallet state
      isConnected: false,
      walletAddress: null,
      balance: 0,
      client: null,
      wallet: null,
      
      // User profile
      userProfile: null,
      userType: null,
      
      // Connection methods
      connectWallet: async (walletInfo) => {
        set({ 
          isConnected: true, 
          walletAddress: walletInfo.address,
          wallet: walletInfo,
          userProfile: {
            id: walletInfo.address,
            walletAddress: walletInfo.address,
            userType: 'investor',
            verified: true,
            totalInvested: 0,
            totalYieldEarned: 0,
            activeBonds: 0
          }
        });
      },
      
      disconnectWallet: () => {
        set({ 
          isConnected: false, 
          walletAddress: null, 
          balance: 0,
          wallet: null,
          userProfile: null,
          userType: null
        });
      },
      
      updateBalance: (newBalance) => {
        set({ balance: newBalance });
      },
      
      setUserType: (type) => {
        set({ userType: type });
        const profile = get().userProfile;
        if (profile) {
          set({ 
            userProfile: { 
              ...profile, 
              userType: type 
            }
          });
        }
      }
    }),
    {
      name: 'xrpl-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        walletAddress: state.walletAddress,
        wallet: state.wallet,
        userProfile: state.userProfile,
        userType: state.userType
      })
    }
  )
);

// BioBonds Store for application state
export const useBioBondsStore = create((set, get) => ({
  // Bonds data
  bonds: [],
  selectedBond: null,
  
  // Investments
  investments: [],
  
  // Health credentials
  credentials: [],
  
  // UI state
  isLoading: false,
  error: null,
  
  // Actions
  setBonds: (bonds) => set({ bonds }),
  
  setSelectedBond: (bond) => set({ selectedBond: bond }),
  
  addBond: (bond) => {
    const bonds = get().bonds;
    set({ bonds: [...bonds, bond] });
  },
  
  updateBond: (bondId, updates) => {
    const bonds = get().bonds;
    const updatedBonds = bonds.map(bond => 
      bond.id === bondId ? { ...bond, ...updates } : bond
    );
    set({ bonds: updatedBonds });
  },
  
  addInvestment: (investment) => {
    const investments = get().investments;
    set({ investments: [...investments, investment] });
  },
  
  addCredential: (credential) => {
    const credentials = get().credentials;
    set({ credentials: [...credentials, credential] });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null })
}));
