import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, getMonth, setMonth } from 'date-fns';
import { getCountryColor } from '../../utils/colors';

export default function MonthlyView({ logs, year }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  // If year prop changes, we might want to stay on similar month or reset? 
  // But year is controlled by parent. The 'month' state is local to this view 
  // BUT the displayed date must respect the 'year' prop.

  const displayDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(year);
    d.setMonth(currentMonth);
    d.setDate(1);
    return d;
  }, [year, currentMonth]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(displayDate));
    const end = endOfWeek(endOfMonth(displayDate));
    return eachDayOfInterval({ start, end });
  }, [displayDate]);

  const logsMap = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      map[log.date] = log;
    });
    return map;
  }, [logs]);

  const nextMonth = () => {
    if (currentMonth === 11) {
      // We only stay in current selected year or allow year change?
      // Requirement: "Global filter should always apply to the entire page."
      // So we should probably wrap around or just clamp?
      // "swipe through the months of the year" -> typically implies staying in year or crossing?
      // If strict year filter, we wrap or clamp. Let's clamp for now or loop.
      setCurrentMonth(0);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">
          {format(displayDate, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded text-slate-300">
            ← Prev
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded text-slate-300">
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-700 border border-slate-700 rounded-lg overflow-hidden">
        {weekDays.map(day => (
          <div key={day} className="bg-slate-800 p-2 text-center text-xs font-semibold text-slate-400">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const log = logsMap[dateKey];
          const isCurrentMonth = isSameMonth(day, displayDate);

          return (
            <div
              key={dateKey}
              className={`min-h-[100px] p-2 bg-slate-900/95 relative border-t border-slate-800 ${!isCurrentMonth ? 'opacity-30' : ''
                }`}
            >
              <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-slate-400'}`}>
                {format(day, 'd')}
              </span>

              {log && (
                <div
                  className="mt-1 p-1 rounded text-xs text-white truncate"
                  style={{ backgroundColor: getCountryColor(log.country_code) }}
                  title={`${log.city || ''}, ${log.country_name}`}
                >
                  {log.city || log.country_code}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
