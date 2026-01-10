import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
    data: T[];
    initialItemsPerPage?: number;
}

interface UsePaginationReturn<T> {
    paginatedData: T[];
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    setPage: (page: number) => void;
    setItemsPerPage: (perPage: number) => void;
    resetPage: () => void;
    showingFrom: number;
    showingTo: number;
    totalItems: number;
}

export function usePagination<T>({
    data,
    initialItemsPerPage = 25,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

    // Calculate total pages
    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

    // Ensure current page is valid
    const validCurrentPage = Math.min(currentPage, totalPages);

    // Calculate pagination indexes
    const showingFrom = data.length === 0 ? 0 : (validCurrentPage - 1) * itemsPerPage + 1;
    const showingTo = Math.min(validCurrentPage * itemsPerPage, data.length);

    // Get paginated data
    const paginatedData = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    }, [data, validCurrentPage, itemsPerPage]);

    const setPage = (page: number) => {
        const validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
    };

    const setItemsPerPage = (perPage: number) => {
        setItemsPerPageState(perPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const resetPage = () => {
        setCurrentPage(1);
    };

    return {
        paginatedData,
        currentPage: validCurrentPage,
        totalPages,
        itemsPerPage,
        setPage,
        setItemsPerPage,
        resetPage,
        showingFrom,
        showingTo,
        totalItems: data.length,
    };
}
