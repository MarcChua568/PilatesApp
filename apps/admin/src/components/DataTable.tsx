import type { ReactNode } from 'react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  error,
  empty = 'Nothing here yet.',
  onRowClick,
}: DataTableProps<T>) {
  return (
    <Table>
      <THead>
        <TR>
          {columns.map((c) => (
            <TH key={c.key} className={c.className}>
              {c.header}
            </TH>
          ))}
        </TR>
      </THead>
      <TBody>
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <TR key={i}>
              {columns.map((c) => (
                <TD key={c.key}>
                  <div className="h-4 w-24 animate-pulse rounded bg-line/60" />
                </TD>
              ))}
            </TR>
          ))}

        {!isLoading && error != null && (
          <TR>
            <TD colSpan={columns.length} className="py-6 text-danger">
              Couldn’t load this.{' '}
              {error instanceof Error ? error.message : ''}
            </TD>
          </TR>
        )}

        {!isLoading && !error && rows && rows.length === 0 && (
          <TR>
            <TD colSpan={columns.length} className="py-6 text-muted">
              {empty}
            </TD>
          </TR>
        )}

        {!isLoading &&
          !error &&
          rows?.map((row) => (
            <TR
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer hover:bg-line/30' : undefined}
            >
              {columns.map((c) => (
                <TD key={c.key} className={c.className}>
                  {c.cell(row)}
                </TD>
              ))}
            </TR>
          ))}
      </TBody>
    </Table>
  );
}
