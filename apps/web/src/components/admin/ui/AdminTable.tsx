import React from 'react';
import { Loader2, Inbox } from 'lucide-react';
import { AdminCheckbox } from './AdminCheckbox';

export interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  selectedIds?: string[];
  onSelectAll?: (checked: boolean) => void;
  onSelectRow?: (id: string, checked: boolean) => void;
  getId?: (item: T) => string;
  className?: string;
}

export function AdminTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu hiển thị',
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  getId,
  className = '',
}: AdminTableProps<T>) {
  const isAllSelected =
    data.length > 0 && selectedIds.length === data.length;
  const isPartiallySelected =
    selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 ${className}`}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
              {onSelectAll && (
                <th className="py-3.5 pl-4 pr-2 w-10">
                  <AdminCheckbox
                    checked={isAllSelected}
                    indeterminate={isPartiallySelected}
                    onChange={(checked) => onSelectAll(checked)}
                    size="sm"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`py-3.5 px-4 font-semibold ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {onSelectAll && (
                    <td className="py-3.5 pl-4 pr-2">
                      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800/70 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + (onSelectAll ? 1 : 0)}
                  className="py-12 text-center text-slate-400 dark:text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-1" />
                    <span className="text-xs font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const id = getId ? getId(item) : String(index);
                const isSelected = selectedIds.includes(id);

                return (
                  <tr
                    key={id}
                    className={`transition-colors duration-150 select-none ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/15'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {onSelectRow && (
                      <td className="py-3.5 pl-4 pr-2">
                        <AdminCheckbox
                          checked={isSelected}
                          onChange={(checked) => onSelectRow(id, checked)}
                          size="sm"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-3 px-4 text-slate-800 dark:text-slate-200 ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {col.render
                          ? col.render(item, index)
                          : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
