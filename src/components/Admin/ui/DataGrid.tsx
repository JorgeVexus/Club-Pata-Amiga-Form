'use client';

import React from 'react';
import styles from './DataGrid.module.css';

export interface DataGridColumn {
    label: string;
    width?: string;
}

interface DataGridProps<T> {
    columns: DataGridColumn[];
    rows: T[];
    rowKey: (row: T) => string;
    renderRow: (row: T) => React.ReactNode;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    minWidth?: number;
}

export default function DataGrid<T>({
    columns,
    rows,
    rowKey,
    renderRow,
    onRowClick,
    emptyMessage = 'Sin resultados.',
    minWidth = 560,
}: DataGridProps<T>) {
    const gridTemplateColumns = columns.map((c) => c.width ?? '1fr').join(' ');

    return (
        <div className={styles.wrapper}>
            <div
                className={styles.headerRow}
                style={{ gridTemplateColumns, minWidth }}
            >
                {columns.map((c) => (
                    <span key={c.label}>{c.label}</span>
                ))}
            </div>
            {rows.map((row) => (
                <div
                    key={rowKey(row)}
                    className={`${styles.row} ${onRowClick ? styles.rowLink : ''}`}
                    style={{ gridTemplateColumns, minWidth }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                    {renderRow(row)}
                </div>
            ))}
            {rows.length === 0 && <span className={styles.empty}>{emptyMessage}</span>}
        </div>
    );
}
