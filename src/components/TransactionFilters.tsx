import { TransactionFilters as TxFilters } from '@/types/transaction';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface TransactionFiltersProps {
  filters: TxFilters;
  onFiltersChange: (filters: TxFilters) => void;
}

export function TransactionFilters({ filters, onFiltersChange }: TransactionFiltersProps) {
  const handleTypeChange = (type: TxFilters['type']) => {
    onFiltersChange({ ...filters, type });
  };

  const handleStatusChange = (status: TxFilters['status']) => {
    onFiltersChange({ ...filters, status });
  };

  const handleSearchChange = (searchQuery: string) => {
    onFiltersChange({ ...filters, searchQuery });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by transaction hash..."
          value={filters.searchQuery || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Type Filters */}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-2">Type</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTypeChange('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.type === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleTypeChange('swap')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.type === 'swap'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              Swaps
            </button>
            <button
              onClick={() => handleTypeChange('add_liquidity')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.type === 'add_liquidity'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              Add Liquidity
            </button>
            <button
              onClick={() => handleTypeChange('remove_liquidity')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.type === 'remove_liquidity'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              Remove Liquidity
            </button>
            <button
              onClick={() => handleTypeChange('approval')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.type === 'approval'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              Approvals
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="sm:w-64">
          <p className="text-xs text-muted-foreground mb-2">Status</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('all')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.status === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusChange('success')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.status === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => handleStatusChange('pending')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.status === 'pending'
                  ? 'bg-blue-500 text-white'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleStatusChange('failed')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.status === 'failed'
                  ? 'bg-red-500 text-white'
                  : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              Failed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
