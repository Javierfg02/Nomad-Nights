import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getCountryColor } from '../utils/colors';

export default function CountryStats({ logs }) {
    // Calculate stats
    const stats = React.useMemo(() => {
        const counts = {};
        logs.forEach(log => {
            // Validate date format YYYY-MM-DD to avoid counting bad legacy data
            if (!/^\d{4}-\d{2}-\d{2}$/.test(log.date)) return;

            // Use country_name as primary key, fallback to 'Unknown'
            const country = log.country_name || 'Unknown';
            if (!counts[country]) {
                counts[country] = { count: 0, code: log.country_code };
            }
            counts[country].count += 1;
        });

        // Convert to array and sort by count descending
        return Object.entries(counts)
            .map(([country, data]) => ({
                country,
                count: data.count,
                code: data.code
            }))
            .sort((a, b) => b.count - a.count);
    }, [logs]);

    const totalDays = logs.length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {stats.map(({ country, count, code }) => {
                const percentage = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
                const color = getCountryColor(code || country);

                return (
                    <Card key={country} className="border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">
                                {country}
                            </CardTitle>
                            <div
                                className="h-4 w-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                style={{ backgroundColor: color }}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white mb-1">{count} <span className="text-xs font-normal text-slate-500">days</span></div>
                            <div className="flex items-center space-x-2">
                                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 ease-in-out"
                                        style={{ width: `${percentage}%`, backgroundColor: color }}
                                    />
                                </div>
                                <span className="text-xs text-slate-400 font-mono w-8 text-right">{percentage}%</span>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
