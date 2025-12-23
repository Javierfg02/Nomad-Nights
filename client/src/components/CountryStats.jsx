import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { getCountryColor } from '../utils/colors';
import { clsx } from 'clsx';
import { Settings2, AlertCircle, Info } from 'lucide-react';

export default function CountryStats({ logs }) {
    const [limits, setLimits] = useState(() => {
        const saved = localStorage.getItem('nomad_nights_limits');
        return saved ? JSON.parse(saved) : {};
    });
    const [editingCountry, setEditingCountry] = useState(null);
    const [tempLimit, setTempLimit] = useState("");

    useEffect(() => {
        localStorage.setItem('nomad_nights_limits', JSON.stringify(limits));
    }, [limits]);

    // Calculate stats
    const stats = React.useMemo(() => {
        const counts = {};
        logs.forEach(log => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(log.date)) return;
            const country = log.country_name || 'Unknown';
            if (!counts[country]) {
                counts[country] = { count: 0, code: log.country_code };
            }
            counts[country].count += 1;
        });

        return Object.entries(counts)
            .map(([country, data]) => ({
                country,
                count: data.count,
                code: data.code,
                limit: limits[country] || 183 // Default to 183 days
            }))
            .sort((a, b) => b.count - a.count);
    }, [logs, limits]);

    const handleEditStart = (country, currentLimit) => {
        setEditingCountry(country);
        setTempLimit(currentLimit.toString());
    };

    const handleEditSave = () => {
        if (!editingCountry) return;
        const val = parseInt(tempLimit);
        if (!isNaN(val) && val >= 0) {
            setLimits(prev => ({ ...prev, [editingCountry]: val }));
        }
        setEditingCountry(null);
    };

    const handleKeyDown = (e, country) => {
        if (e.key === 'Enter') handleEditSave(country);
        if (e.key === 'Escape') setEditingCountry(null);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {stats.map(({ country, count, code, limit }) => {
                const daysLeft = Math.max(0, limit - count);
                const percentageLeft = Math.round((daysLeft / limit) * 100);
                const color = getCountryColor(code || country);
                const isOverLimit = count > limit;

                return (
                    <Card
                        key={country}
                        onClick={() => handleEditStart(country, limit)}
                        className={clsx(
                            "group relative border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm",
                            isOverLimit ? "ring-1 ring-red-500/50" : "hover:scale-[1.02]"
                        )}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-black text-slate-300 uppercase tracking-wider">
                                {country}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                {isOverLimit && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
                                <div
                                    className="h-3 w-3 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)] border border-white/10"
                                    style={{ backgroundColor: color }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <div className="text-3xl font-black text-white tracking-tighter">
                                        {count}
                                        <span className="text-xs font-bold text-slate-500 ml-2 uppercase tracking-widest">Spent</span>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                        <Info className="w-3 h-3" />
                                        {daysLeft} days remaining
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="group/limit flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Limit</span>
                                        <span className="text-sm font-black text-indigo-400 group-hover:text-indigo-300 transition-colors uppercase flex items-center gap-1">
                                            {limit}
                                            <Settings2 className="w-3 h-3 opacity-30 group-hover/limit:opacity-100 transition-opacity" />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-800/30">
                                    <div
                                        className={clsx(
                                            "h-full rounded-full transition-all duration-1000 ease-out",
                                            isOverLimit ? "bg-red-500" : ""
                                        )}
                                        style={{
                                            width: `${isOverLimit ? 100 : percentageLeft}%`,
                                            backgroundColor: isOverLimit ? undefined : color,
                                            boxShadow: isOverLimit ? '0 0 10px rgba(239, 68, 68, 0.3)' : `0 0 10px ${color}33`
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between items-center px-0.5">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em]">{percentageLeft}% Available</span>
                                    <Settings2 className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </CardContent>

                        {/* Interactive hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                );
            })}

            {/* Edit Limit Dialog */}
            <Dialog open={!!editingCountry} onOpenChange={() => setEditingCountry(null)}>
                <DialogContent className="sm:max-w-[400px] border-slate-800 bg-slate-950 text-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                            <Settings2 className="w-6 h-6 text-indigo-500" />
                            Edit {editingCountry} Limit
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Set the maximum number of days allowed in {editingCountry} for this tax year.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="limit-input" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Maximum Days Allowed
                            </Label>
                            <div className="relative">
                                <Input
                                    id="limit-input"
                                    type="number"
                                    value={tempLimit}
                                    onChange={(e) => setTempLimit(e.target.value)}
                                    className="h-14 bg-slate-900 border-slate-800 text-xl font-black text-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl pl-4"
                                    placeholder="e.g. 183"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xs uppercase tracking-widest pointer-events-none">
                                    Days
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-3 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setEditingCountry(null)}
                            className="flex-1 sm:flex-none h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-900 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSave}
                            className="flex-1 sm:flex-none h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 transition-all"
                        >
                            Save Limit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
