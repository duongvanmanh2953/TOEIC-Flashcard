import React, { useState } from 'react';
import { Search, Calendar, RotateCcw, Filter, Check, X } from 'lucide-react';
import { AdminSelect, SelectOption } from './AdminSelect';
import { AdminInput } from './AdminInput';
import { AdminButton } from './AdminButton';

export interface FilterConfig {
  key: string;
  label: string;
  options: SelectOption[];
  isMulti?: boolean;
  value?: any;
}

export interface DateRangePreset {
  key: string;
  label: string;
}

export const DATE_PRESETS: DateRangePreset[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: '7d', label: '7 ngày qua' },
  { key: '30d', label: '30 ngày qua' },
  { key: 'this_month', label: 'Tháng này' },
  { key: 'last_month', label: 'Tháng trước' },
  { key: 'this_quarter', label: 'Quý này' },
  { key: 'this_year', label: 'Năm nay' },
  { key: 'custom', label: 'Tùy chỉnh' },
];

export interface AdminFilterBarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  datePreset?: string;
  onDatePresetChange?: (preset: string) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  filters?: Array<{
    key: string;
    label: string;
    value: any;
    options: SelectOption[];
    isMulti?: boolean;
    onChange: (val: any) => void;
  }>;
  onReset?: () => void;
  onApply?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm từ khóa...',
  datePreset,
  onDatePresetChange,
  startDate,
  endDate,
  onCustomDateChange,
  filters = [],
  onReset,
  onApply,
  actions,
  className = '',
}) => {
  const [showCustomDate, setShowCustomDate] = useState(datePreset === 'custom');

  const dateOptions: SelectOption[] = DATE_PRESETS.map((p) => ({
    value: p.key,
    label: p.label,
  }));

  const handleDateSelect = (val: string) => {
    if (onDatePresetChange) {
      onDatePresetChange(val);
    }
    setShowCustomDate(val === 'custom');
  };

  const hasActiveFilters =
    Boolean(search) ||
    (datePreset && datePreset !== '30d' && datePreset !== 'all') ||
    filters.some((f) => f.value && f.value !== 'ALL' && (Array.isArray(f.value) ? f.value.length > 0 : true));

  return (
    <div
      className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 flex flex-col gap-3 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Select Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Search Box */}
          {onSearchChange !== undefined && (
            <div className="w-full sm:w-auto min-w-[180px] max-w-xs flex-1">
              <AdminInput
                type="text"
                value={search || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                onClear={() => onSearchChange('')}
                clearable
                placeholder={searchPlaceholder}
                prefixIcon={<Search className="w-4 h-4 text-slate-400" />}
                size="sm"
              />
            </div>
          )}

          {/* Date Range Preset Selector */}
          {onDatePresetChange !== undefined && (
            <div className="w-full sm:w-auto min-w-[140px] sm:min-w-[180px]">
              <AdminSelect
                options={dateOptions}
                value={datePreset || '30d'}
                onChange={handleDateSelect}
                clearable={false}
                searchable={false}
                size="sm"
              />
            </div>
          )}

          {/* Dynamic Select Filters */}
          {filters.map((f) => (
            <div key={f.key} className="w-full sm:w-auto min-w-[160px] sm:min-w-[200px]">
              <AdminSelect
                options={f.options}
                value={f.value}
                onChange={f.onChange}
                placeholder={f.label}
                isMulti={f.isMulti}
                clearable
                size="sm"
              />
            </div>
          ))}

          {/* Reset button */}
          {onReset && hasActiveFilters && (
            <AdminButton
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={onReset}
              title="Đặt lại toàn bộ bộ lọc"
            >
              Đặt lại
            </AdminButton>
          )}
        </div>

        {/* Right: Custom Action Buttons */}
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Custom Date Inputs if 'custom' is selected */}
      {showCustomDate && onCustomDateChange && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium shrink-0">
            <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span>Từ ngày:</span>
          </div>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onCustomDateChange(e.target.value, endDate || '')}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs outline-none focus:border-indigo-500"
          />
          <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Đến:</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onCustomDateChange(startDate || '', e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs outline-none focus:border-indigo-500"
          />
        </div>
      )}
    </div>
  );
};
