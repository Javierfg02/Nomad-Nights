import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, parseISO } from 'date-fns';
import { getCountryColor } from '../../utils/colors';

// Mini Calendar for a single month
function MonthGrid({ year, month, logsMap }) {
  const date = new Date(year, month, 1);
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));

  // ensure we don't have a huge range if endOfWeek spills too much, but standard is fine (max 6 weeks)
  const days = eachDayOfInterval({ start, end });

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
      <h4 className="text-sm font-bold text-slate-300 mb-2">{format(date, 'MMMM')}</h4>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d, i) => (
          <div key={`${month}-${d}-${i}`} className="text-[10px] text-slate-500 text-center font-medium">{d}</div>
        ))}
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const log = logsMap[dateKey];
          const isCurrentMonth = isSameMonth(day, date);

          if (!isCurrentMonth) {
            return <div key={dateKey} className="invisible" />;
          }

          return (
            <div
              key={dateKey}
              className="aspect-square rounded-sm flex items-center justify-center text-[10px] relative group cursor-default transition-transform hover:scale-110"
              style={{
                backgroundColor: log ? getCountryColor(log.country_code || log.country_name) : '#1E293B',
                color: log ? '#fff' : '#475569'
              }}
            >
              {day.getDate()}
              {log && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 whitespace-nowrap bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg border border-slate-700 pointer-events-none">
                  {log.city || log.country_name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function YearlyView({ logs, year }) {
  const logsMap = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      map[log.date] = log;
    });
    return map;
  }, [logs]);

  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {months.map(month => (
        <MonthGrid key={month} year={year} month={month} logsMap={logsMap} />
      ))}
    </div>
  );
}
