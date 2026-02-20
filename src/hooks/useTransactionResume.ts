import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { Token } from '@/types/tokens';

export interface TransactionState {
  step: string;
  token0: Token;
  token1: Token;
  amount0: string;
  amount1: string;
  createdPoolAddress?: Address;
  completedSteps: string[];
  timestamp: number;
}

interface UseTransactionResumeReturn {
  savedState: TransactionState | null;
  saveState: (state: TransactionState) => void;
  clearState: () => void;
  canResume: boolean;
}

const STORAGE_KEY = 'samm_pool_creation_state';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to save and restore transaction state for resume capability
 * State expires after 30 minutes
 */
export function useTransactionResume(): UseTransactionResumeReturn {
  const [savedState, setSavedState] = useState<TransactionState | null>(null);

  // Load saved state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored) as TransactionState;
        
        // Check if state is expired
        const age = Date.now() - state.timestamp;
        if (age < EXPIRY_TIME) {
          setSavedState(state);
        } else {
          // Clear expired state
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load transaction state:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveState = useCallback((state: TransactionState) => {
    try {
      const stateWithTimestamp = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
      setSavedState(stateWithTimestamp);
    } catch (error) {
      console.error('Failed to save transaction state:', error);
    }
  }, []);

  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedState(null);
    } catch (error) {
      console.error('Failed to clear transaction state:', error);
    }
  }, []);

  const canResume = savedState !== null && 
    (Date.now() - savedState.timestamp) < EXPIRY_TIME;

  return {
    savedState,
    saveState,
    clearState,
    canResume,
  };
}
