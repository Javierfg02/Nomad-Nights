import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCountryColor } from '../utils/colors';

export default function Summary({ logs }) {
  const data = useMemo(() => {
    const counts = {};
    logs.forEach(log => {
      const code = log.country_code || log.country_name || 'Unknown';
      const name = log.country_name || log.country_code || 'Unknown';
      if (!counts[code]) {
        counts[code] = { code, name, days: 0 };
      }
      counts[code].days += 1;
    });

    return Object.values(counts).sort((a, b) => b.days - a.days);
  }, [logs]);



  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-4">Tax Residency Summary</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#CBD5E1' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
              itemStyle={{ color: '#F8FAFC' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCountryColor(entry.code)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((item, index) => (
          <div key={item.code} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between">
            <span className="text-slate-300 font-medium">{item.name}</span>
            <span className="text-white font-bold">{item.days} days</span>
          </div>
        ))}
      </div>
    </div>
  );
}
