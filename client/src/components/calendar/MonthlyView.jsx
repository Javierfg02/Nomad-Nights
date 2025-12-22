import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, addMonths, subMonths, setMonth, setYear } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { getCountryColor } from '../../utils/colors';

export default function MonthlyView({ logs, year, onDayClick }) {
  // Initialize with January of the selected year, or current month if it matches year
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return now.getFullYear() === year ? now : new Date(year, 0, 1);
  });

  // Sync internal date when prop year changes
  useEffect(() => {
    setCurrentDate(prev => setYear(prev, year));
  }, [year]);

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    // If we go back a year, we might want to notify parent to change year?
    // For now, let's just keep it simple: staying within the view logic, 
    // but if the UI global filter says "2025", showing "Dec 2024" might be confusing.
    // However, usually detailed view allows traversing boundaries.
    // Given the request "Global Year Filter", let's strictly constrain to the selected year 
    // OR allow traversing and have it update the global year?
    // To minimize complexity causing bugs: Restrict navigation to valid months in the selected year? 
    // OR just update local state and let the user see what they see. 
    // Let's just update local state. If it crosses year boundary, it crosses it.
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const logsMap = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      map[log.date] = log;
    });
    return map;
  }, [logs]);

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
        <h2 className="text-2xl font-bold text-slate-100">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-b border-slate-700">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-sm font-semibold text-slate-400 border-r border-slate-700 last:border-r-0 bg-slate-900/50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const log = logsMap[dateKey];
          const isCurrentMonth = isSameMonth(day, currentDate);

          // Background color logic
          // If log exists, use country color.
          // If not and not current month, really dark
          // If current month and empty, slate-900

          let bgStyle = {};
          if (log) {
            bgStyle = { backgroundColor: getCountryColor(log.country_code || log.country_name) + '40' }; // 40 = 25% opacity for huge cell
            // Wait, Calendar view usually has solid colors. Large cells might look overwhelming if fully colored.
            // Let's keep the design consistent: Solid color pill or marker?
            // User liked the yearly look. Let's make the WHOLE cell colored but maybe slightly transparent?
            // Or just solid like yearly view but bigger.
            bgStyle = { backgroundColor: getCountryColor(log.country_code || log.country_name) };
          }

          return (
            <div
              key={dateKey}
              onClick={() => onDayClick(dateKey, log)}
              className={`
                        min-h-[120px] p-2 border-b border-r border-slate-700 relative group cursor-pointer transition-colors
                        ${!isCurrentMonth ? 'bg-slate-950/50 text-slate-600' : 'bg-slate-900/30 text-slate-300 hover:bg-slate-800'}
                    `}
              style={log ? bgStyle : undefined}
            >
              <span className={`text-sm font-medium ${log ? 'text-white drop-shadow-md' : ''}`}>
                {format(day, 'd')}
              </span>

              {log && (
                <div className="mt-2 text-white font-bold text-shadow-sm truncate">
                  {log.city || log.country_name}
                </div>
              )}

              {/* Add Hint on Hover for empty cells */}
              {!log && isCurrentMonth && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                  <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">Add Log</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
