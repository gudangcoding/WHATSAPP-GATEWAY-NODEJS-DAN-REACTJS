import React from 'react';
import clsx from 'clsx';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Table = ({
  columns,
  data,
  loading = false,
  sortable = false,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  emptyMessage = 'Tidak ada data',
  className,
  ...props
}) => {
  const handleSort = (column) => {
    if (!sortable || !column.sortable || !onSort) return;
    
    const newOrder = sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newOrder);
  };
  
  const getSortIcon = (column) => {
    if (!sortable || !column.sortable || sortBy !== column.key) {
      return null;
    }
    
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };
  
  const tableClasses = clsx(
    'min-w-full divide-y divide-gray-200',
    className
  );
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-50 px-6 py-3">
          <div className="flex space-x-4">
            {columns.map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4">
              {columns.map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className={tableClasses} {...props}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  sortable && column.sortable && 'cursor-pointer hover:bg-gray-100',
                  column.width && `w-${column.width}`,
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.title}</span>
                  {getSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={clsx(
                  'hover:bg-gray-50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx(
                      'px-6 py-4 whitespace-nowrap text-sm',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Status Badge Component for Table
export const StatusBadge = ({ status, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  
  return (
    <span className={clsx(
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
      variants[variant]
    )}>
      {status}
    </span>
  );
};

export default Table;