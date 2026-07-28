'use client';

import React, { useState } from 'react';
import styles from './MiniBarChart.module.css';

export interface MiniBarChartPoint {
    label: string;
    value: number;
}

interface MiniBarChartProps {
    title: string;
    data: MiniBarChartPoint[];
    color?: string;
    format?: (value: number) => string;
}

const WIDTH = 100;
const HEIGHT = 40;
const GAP = 2.5;

export default function MiniBarChart({ title, data, color = '#1CBCAD', format }: MiniBarChartProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const max = Math.max(1, ...data.map((d) => d.value));
    const barWidth = data.length ? (WIDTH - GAP * (data.length - 1)) / data.length : WIDTH;

    return (
        <div className={styles.card}>
            <h2 className={styles.title}>{title}</h2>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 14}`} width="100%" role="img" aria-label={title}>
                {data.map((d, i) => {
                    const barHeight = (d.value / max) * HEIGHT;
                    const x = i * (barWidth + GAP);
                    const y = HEIGHT - barHeight;
                    const isHovered = hovered === i;
                    return (
                        <g
                            key={d.label}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {isHovered && (
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 3}
                                    textAnchor="middle"
                                    className={styles.value}
                                >
                                    {format ? format(d.value) : d.value}
                                </text>
                            )}
                            <rect
                                className={styles.bar}
                                x={x}
                                y={y}
                                width={barWidth}
                                height={Math.max(barHeight, 1)}
                                rx={1.5}
                                fill={color}
                                opacity={isHovered ? 1 : 0.85}
                            />
                            <text
                                x={x + barWidth / 2}
                                y={HEIGHT + 10}
                                textAnchor="middle"
                                className={styles.label}
                            >
                                {d.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
