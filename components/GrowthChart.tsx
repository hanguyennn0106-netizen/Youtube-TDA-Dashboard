
import React, { useState, useMemo } from 'react';
import { DailyMetric } from '../types';
import { formatNumber } from '../utils/helpers';

interface GrowthChartProps {
    history: DailyMetric[];
}

type ChartMetric = 'subscriberCount' | 'viewCount';

export const GrowthChart: React.FC<GrowthChartProps> = ({ history }) => {
    const [metric, setMetric] = useState<ChartMetric>('subscriberCount');

    const chartData = useMemo(() => {
        if (!history || history.length < 2) return null;
        
        const data = history.map(item => ({
            date: new Date(item.date),
            value: parseInt(item[metric], 10)
        })).sort((a,b) => a.date.getTime() - b.date.getTime());

        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        const dates = data.map(d => d.date);
        const startTime = dates[0].getTime();
        const endTime = dates[dates.length - 1].getTime();

        const width = 800;
        const height = 400;
        const padding = 50;

        const points = data.map(d => {
            const x = ((d.date.getTime() - startTime) / (endTime - startTime)) * (width - padding * 2) + padding;
            const y = height - (((d.value - min) / (max - min)) * (height - padding * 2) + padding);
            return { x, y, value: d.value, date: d.date.toLocaleDateString() };
        });

        const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');

        return { width, height, padding, min, max, points, path };

    }, [history, metric]);

    if (!chartData) {
        return (
            <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Growth Chart</h2>
                <p className="text-gray-400">Not enough historical data to display a chart. Track this channel for a few days to see its growth.</p>
            </div>
        );
    }
    
    const { width, height, padding, min, max, points, path } = chartData;

    return (
        <div className="bg-gray-800/50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Growth Chart</h2>
                <div className="flex items-center gap-2">
                     <button 
                        onClick={() => setMetric('subscriberCount')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${metric === 'subscriberCount' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        Subscribers
                    </button>
                    <button 
                        onClick={() => setMetric('viewCount')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${metric === 'viewCount' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        Views
                    </button>
                </div>
            </div>
            <div className="w-full overflow-x-auto">
                 <svg viewBox={`0 0 ${width} ${height}`} className="font-sans">
                    {/* Y Axis Labels */}
                    <text x={padding - 10} y={padding} textAnchor="end" fill="#9ca3af" fontSize="12">{formatNumber(max)}</text>
                    <text x={padding - 10} y={height - padding} textAnchor="end" fill="#9ca3af" fontSize="12">{formatNumber(min)}</text>
                    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4b5563" strokeWidth="1" />

                    {/* X Axis Labels */}
                     <text x={padding} y={height - padding + 20} textAnchor="start" fill="#9ca3af" fontSize="12">{points[0].date}</text>
                     <text x={width - padding} y={height - padding + 20} textAnchor="end" fill="#9ca3af" fontSize="12">{points[points.length - 1].date}</text>
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4b5563" strokeWidth="1" />

                    {/* Chart Path */}
                    <path d={path} fill="none" stroke="#4f46e5" strokeWidth="2" />
                    
                    {/* Data Points and Tooltips */}
                    {points.map((point, i) => (
                        <g key={i} className="group">
                             <circle cx={point.x} cy={point.y} r="4" fill="#4f46e5" className="cursor-pointer" />
                             <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <rect x={point.x - 50} y={point.y - 45} width="100" height="35" rx="5" fill="#1f2937" stroke="#4f46e5" />
                                <text x={point.x} y={point.y - 30} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{formatNumber(point.value)}</text>
                                <text x={point.x} y={point.y - 15} textAnchor="middle" fill="#9ca3af" fontSize="10">{point.date}</text>
                            </g>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};
