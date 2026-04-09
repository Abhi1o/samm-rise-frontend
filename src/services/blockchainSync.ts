import { PublicClient, Address, TransactionReceipt, formatUnits } from 'viem';
import { StoredTransaction } from '@/types/transaction';
import { transactionStorage } from './transactionStorage';
import { getTokensForChain } from '@/config/tokens';
import { getCrossPoolRouter, hasContracts } from '@/config/contracts';

/**
 * Service to sync transaction history from the blockchain
 * Fetches past transactions and stores them in localStorage
 */
export class BlockchainSyncService {
  /**
   * Fetch transaction details by hash and convert to StoredTransaction
   */
  async fetchTransactionByHash(
    publicClient: PublicClient,
    txHash: Address,
    userAddress: Address,
    chainId: number
  ): Promise<StoredTransaction | null> {
    try {
      console.log('[BlockchainSync] Fetching transaction:', txHash);

      // Get transaction receipt
      const receipt = await publicClient.getTransactionReceipt({
        hash: txHash,
      });

      // Get full transaction data
      const transaction = await publicClient.getTransaction({
        hash: txHash,
      });

      if (!receipt || !transaction) {
        console.warn('[BlockchainSync] Transaction not found:', txHash);
        return null;
      }

      // Parse transaction to determine type and details
      // Note: Transactions can go to router (swaps) or pool contracts (add/remove liquidity)
      // The parseTransaction method will determine if it's a relevant transaction
      const storedTx = await this.parseTransaction(
        transaction,
        receipt,
        userAddress,
        chainId,
        publicClient
      );

      return storedTx;
    } catch (error) {
      console.error('[BlockchainSync] Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Parse transaction data to create StoredTransaction
   */
  private async parseTransaction(
    transaction: any,
    receipt: TransactionReceipt,
    userAddress: Address,
    chainId: number,
    publicClient: PublicClient
  ): Promise<StoredTransaction | null> {
    try {
      const tokens = getTokensForChain(chainId);

      // Determine status from receipt
      const status: 'success' | 'failed' | 'pending' =
        receipt.status === 'success' ? 'success' : receipt.status === 'reverted' ? 'failed' : 'pending';

      // Get block timestamp
      const block = await publicClient.getBlock({
        blockNumber: receipt.blockNumber,
      });
      const timestamp = Number(block.timestamp) * 1000; // Convert to ms

      // Parse transfer events from logs to determine transaction details
      const transferEvents = receipt.logs.filter((log: any) => {
        return log.data && log.data !== '0x' && log.address;
      });

      // Determine transaction type based on transfers, function selector, and contract
      let txType: 'swap' | 'add_liquidity' | 'remove_liquidity' = 'swap';

      // Get function selector from input data
      const functionSelector = transaction.input?.slice(0, 10);
      console.log('[BlockchainSync] Function selector:', functionSelector);

      // Function selectors for SAMM contracts
      const ADD_LIQUIDITY_SELECTOR = '0xd3487997'; // addLiquidity function
      const REMOVE_LIQUIDITY_SELECTOR = '0xbaa2abde'; // removeLiquidity function
      const SWAP_SELECTOR = '0x07ed6b09'; // swapExactOutput function

      // First, try to detect based on function selector
      if (functionSelector === ADD_LIQUIDITY_SELECTOR || functionSelector?.startsWith('0xd348')) {
        txType = 'add_liquidity';
      } else if (functionSelector === REMOVE_LIQUIDITY_SELECTOR || functionSelector?.startsWith('0xbaa2')) {
        txType = 'remove_liquidity';
      } else if (functionSelector === SWAP_SELECTOR || functionSelector?.startsWith('0x07ed')) {
        txType = 'swap';
      } else if (transferEvents.length >= 2) {
        // Fallback: Analyze transfer patterns
        const uniqueTokens = new Set(transferEvents.map((e: any) => e.address.toLowerCase()));

        // Add liquidity: User sends tokens TO pool (no LP tokens back in same tx usually)
        // Remove liquidity: User receives tokens FROM pool
        // Swap: User sends one token, receives another

        if (uniqueTokens.size >= 2) {
          // Count transfers from user (user is sender)
          const fromUser = transferEvents.filter((e: any) => {
            // In Transfer events, topics[1] is the 'from' address (padded to 32 bytes)
            const from = e.topics && e.topics[1] ? '0x' + e.topics[1].slice(-40) : '';
            return from.toLowerCase() === userAddress.toLowerCase();
          });

          // Count transfers to user (user is receiver)
          const toUser = transferEvents.filter((e: any) => {
            // topics[2] is the 'to' address
            const to = e.topics && e.topics[2] ? '0x' + e.topics[2].slice(-40) : '';
            return to.toLowerCase() === userAddress.toLowerCase();
          });

          console.log('[BlockchainSync] Transfer analysis:', {
            fromUser: fromUser.length,
            toUser: toUser.length,
            uniqueTokens: uniqueTokens.size
          });

          // If user is mostly sending tokens (2+ different tokens) = add liquidity
          if (fromUser.length >= 2 && toUser.length <= 1) {
            txType = 'add_liquidity';
          }
          // If user is mostly receiving tokens (2+ different tokens) = remove liquidity
          else if (toUser.length >= 2 && fromUser.length <= 1) {
            txType = 'remove_liquidity';
          }
          // If balanced transfers (1 out, 1 in different token) = swap
          else if (fromUser.length === 1 && toUser.length === 1) {
            txType = 'swap';
          }
        }
      }

      console.log('[BlockchainSync] Detected transaction type:', txType);

      // Parse based on transaction type
      if (txType === 'swap') {
        // Parse swap data
        const firstTransfer = transferEvents[0];
        const lastTransfer = transferEvents[transferEvents.length - 1];

        const fromTokenInfo = tokens.find(
          (t) => t.address.toLowerCase() === firstTransfer.address.toLowerCase()
        );
        const toTokenInfo = tokens.find(
          (t) => t.address.toLowerCase() === lastTransfer.address.toLowerCase()
        );

        const fromToken = fromTokenInfo?.symbol || 'Unknown';
        const toToken = toTokenInfo?.symbol || 'Unknown';

        let fromAmount = '0';
        let toAmount = '0';

        if (firstTransfer.data !== '0x' && fromTokenInfo) {
          const amount = BigInt(firstTransfer.data);
          fromAmount = formatUnits(amount, fromTokenInfo.decimals);
        }

        if (lastTransfer.data !== '0x' && toTokenInfo) {
          const amount = BigInt(lastTransfer.data);
          toAmount = formatUnits(amount, toTokenInfo.decimals);
        }

        const storedTx: StoredTransaction = {
          id: `synced_${transaction.hash}`,
          hash: transaction.hash,
          type: 'swap',
          status,
          timestamp,
          chainId,
          userAddress: userAddress.toLowerCase(),
          swapData: {
            fromToken,
            toToken,
            fromAmount,
            toAmount,
          },
        };

        return storedTx;
      } else {
        // Parse liquidity data
        const tokenAddresses = [...new Set(transferEvents.map((e: any) => e.address.toLowerCase()))];

        if (tokenAddresses.length >= 2) {
          const token0Info = tokens.find((t) => t.address.toLowerCase() === tokenAddresses[0]);
          const token1Info = tokens.find((t) => t.address.toLowerCase() === tokenAddresses[1]);

          const token0 = token0Info?.symbol || 'Unknown';
          const token1 = token1Info?.symbol || 'Unknown';

          // Get amounts from transfers
          const token0Transfers = transferEvents.filter((e: any) => e.address.toLowerCase() === tokenAddresses[0]);
          const token1Transfers = transferEvents.filter((e: any) => e.address.toLowerCase() === tokenAddresses[1]);

          let amount0 = '0';
          let amount1 = '0';

          if (token0Transfers[0]?.data !== '0x' && token0Info) {
            const amount = BigInt(token0Transfers[0].data);
            amount0 = formatUnits(amount, token0Info.decimals);
          }

          if (token1Transfers[0]?.data !== '0x' && token1Info) {
            const amount = BigInt(token1Transfers[0].data);
            amount1 = formatUnits(amount, token1Info.decimals);
          }

          // Pool name for display
          const pool = `${token0}-${token1}`;

          const storedTx: StoredTransaction = {
            id: `synced_${transaction.hash}`,
            hash: transaction.hash,
            type: txType,
            status,
            timestamp,
            chainId,
            userAddress: userAddress.toLowerCase(),
            liquidityData: {
              pool,
              token0,
              token1,
              amount0,
              amount1,
            },
          };

          return storedTx;
        }
      }

      // Fallback to swap if we couldn't determine
      return {
        id: `synced_${transaction.hash}`,
        hash: transaction.hash,
        type: 'swap',
        status,
        timestamp,
        chainId,
        userAddress: userAddress.toLowerCase(),
        swapData: {
          fromToken: 'Unknown',
          toToken: 'Unknown',
          fromAmount: '0',
          toAmount: '0',
        },
      };
    } catch (error) {
      console.error('[BlockchainSync] Error parsing transaction:', error);
      return null;
    }
  }

  /**
   * Fetch transactions from block explorer API
   */
  private async fetchFromExplorer(
    userAddress: Address
  ): Promise<any[]> {
    try {
      // RiseChain explorer API (BlockScout-compatible)
      const explorerUrl = 'https://explorer.testnet.riselabs.xyz';
      const apiUrl = `${explorerUrl}/api?module=account&action=txlist&address=${userAddress}&sort=desc`;

      console.log('[BlockchainSync] Fetching from explorer API:', apiUrl);

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        console.log('[BlockchainSync] Found transactions from explorer:', data.result.length);
        return data.result;
      }

      return [];
    } catch (error) {
      console.warn('[BlockchainSync] Explorer API not available, will scan blocks:', error);
      return [];
    }
  }

  /**
   * Scan recent blocks for transactions
   */
  private async scanRecentBlocks(
    publicClient: PublicClient,
    userAddress: Address,
    routerAddress: Address,
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<Address[]> {
    const txHashes: Address[] = [];
    const batchSize = 100n; // Scan in batches of 100 blocks

    try {
      console.log(`[BlockchainSync] Scanning blocks ${fromBlock} to ${toBlock}`);

      for (let block = fromBlock; block <= toBlock; block += batchSize) {
        const endBlock = block + batchSize > toBlock ? toBlock : block + batchSize;

        try {
          // Get blocks in this range
          const blockPromises: Promise<any>[] = [];
          for (let b = block; b <= endBlock; b++) {
            blockPromises.push(
              publicClient.getBlock({ blockNumber: b, includeTransactions: true })
            );
          }

          const blocks = await Promise.all(blockPromises);

          // Filter transactions from user to router
          for (const blockData of blocks) {
            if (blockData && blockData.transactions) {
              for (const tx of blockData.transactions) {
                if (
                  typeof tx !== 'string' &&
                  tx.from.toLowerCase() === userAddress.toLowerCase() &&
                  tx.to?.toLowerCase() === routerAddress.toLowerCase()
                ) {
                  txHashes.push(tx.hash);
                }
              }
            }
          }
        } catch (error) {
          console.warn(`[BlockchainSync] Error scanning blocks ${block}-${endBlock}:`, error);
        }
      }

      console.log('[BlockchainSync] Found transaction hashes:', txHashes.length);
      return txHashes;
    } catch (error) {
      console.error('[BlockchainSync] Error scanning blocks:', error);
      return txHashes;
    }
  }

  /**
   * Sync recent transactions for a user from the blockchain
   * Automatically fetches all transactions without manual hash entry
   */
  async syncRecentTransactions(
    publicClient: PublicClient,
    userAddress: Address,
    chainId: number,
    fromBlock?: bigint,
    toBlock?: bigint
  ): Promise<StoredTransaction[]> {
    try {
      console.log('[BlockchainSync] Starting automatic sync for:', userAddress);

      if (!hasContracts(chainId)) {
        console.warn('[BlockchainSync] No contracts on chain', chainId);
        return [];
      }
      const routerAddress = getCrossPoolRouter(chainId);
      const syncedTransactions: StoredTransaction[] = [];

      // Try explorer API first
      const explorerTxs = await this.fetchFromExplorer(userAddress);

      let txHashes: Address[] = [];

      if (explorerTxs.length > 0) {
        // Filter for ALL contract interactions (router + pools)
        // We'll filter by analyzing the transaction logs later
        txHashes = explorerTxs
          .filter((tx: any) => {
            // Include router transactions
            if (tx.to?.toLowerCase() === routerAddress.toLowerCase()) return true;

            // Include transactions that have token transfers (likely pool interactions)
            // These will be parsed later to determine if they're add/remove liquidity
            if (tx.input && tx.input !== '0x' && tx.input.length > 10) return true;

            return false;
          })
          .map((tx: any) => tx.hash as Address)
          .slice(0, 100); // Increase limit to catch more transactions

        console.log('[BlockchainSync] Found contract transactions from explorer:', txHashes.length);
      } else {
        // Fallback to block scanning
        const currentBlock = toBlock || (await publicClient.getBlockNumber());
        const startBlock = fromBlock || currentBlock - 5000n; // Look back ~5k blocks

        txHashes = await this.scanRecentBlocks(
          publicClient,
          userAddress,
          routerAddress,
          startBlock,
          currentBlock
        );
      }

      // Fetch and parse each transaction
      for (const txHash of txHashes) {
        try {
          // Check if already exists
          const existing = transactionStorage.getTransaction(userAddress, chainId, txHash);
          if (existing) {
            console.log('[BlockchainSync] Transaction already exists, skipping:', txHash);
            continue;
          }

          const storedTx = await this.fetchTransactionByHash(
            publicClient,
            txHash,
            userAddress,
            chainId
          );

          if (storedTx) {
            // Save to localStorage
            transactionStorage.saveTransaction(userAddress, chainId, storedTx);
            syncedTransactions.push(storedTx);
            console.log('[BlockchainSync] Synced transaction:', txHash);
          }
        } catch (error) {
          console.warn('[BlockchainSync] Error syncing transaction:', txHash, error);
        }
      }

      console.log('[BlockchainSync] Sync complete. Total synced:', syncedTransactions.length);
      return syncedTransactions;
    } catch (error) {
      console.error('[BlockchainSync] Error syncing transactions:', error);
      return [];
    }
  }

  /**
   * Sync a single transaction by hash and save to localStorage
   */
  async syncTransactionByHash(
    publicClient: PublicClient,
    txHash: Address,
    userAddress: Address,
    chainId: number
  ): Promise<boolean> {
    try {
      const storedTx = await this.fetchTransactionByHash(
        publicClient,
        txHash,
        userAddress,
        chainId
      );

      if (!storedTx) {
        return false;
      }

      // Check if transaction already exists
      const existing = transactionStorage.getTransaction(
        userAddress,
        chainId,
        txHash
      );

      if (existing) {
        console.log('[BlockchainSync] Transaction already exists in storage');
        return true;
      }

      // Save to localStorage
      transactionStorage.saveTransaction(userAddress, chainId, storedTx);
      console.log('[BlockchainSync] Transaction synced and saved:', txHash);

      return true;
    } catch (error) {
      console.error('[BlockchainSync] Error syncing transaction by hash:', error);
      return false;
    }
  }
}

// Export singleton instance
export const blockchainSyncService = new BlockchainSyncService();
