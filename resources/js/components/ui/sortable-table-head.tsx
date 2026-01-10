import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableTableHeadProps<T extends string> {
    field: T;
    currentSortField: T | null;
    currentSortDirection: 'asc' | 'desc';
    onSort: (field: T) => void;
    children: React.ReactNode;
    className?: string;
}

export function SortableTableHead<T extends string>({
    field,
    currentSortField,
    currentSortDirection,
    onSort,
    children,
    className = '',
}: SortableTableHeadProps<T>) {
    const isActive = currentSortField === field;

    return (
        <th className={`px-4 py-3 ${className}`}>
            <button
                onClick={() => onSort(field)}
                className={`flex items-center gap-1 w-full transition-colors hover:text-foreground ${
                    isActive ? 'text-foreground font-semibold' : 'text-muted-foreground font-semibold'
                }`}
                title={
                    isActive
                        ? `Sorted ${currentSortDirection === 'asc' ? 'Ascending' : 'Descending'}`
                        : 'Click to sort'
                }
            >
                {children}
                <span className="flex flex-col justify-center h-4 w-4 ml-auto">
                    {isActive ? (
                        currentSortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                            <ArrowDown className="h-3 w-3 text-primary" />
                        )
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                </span>
            </button>
        </th>
    );
}
