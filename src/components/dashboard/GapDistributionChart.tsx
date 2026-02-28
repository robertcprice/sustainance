'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GapDistItem {
  family: string;
  familyColor: string;
  critical: number;
  moderate: number;
  no_gap: number;
}

export default function GapDistributionChart({ data }: { data: GapDistItem[] }) {
  const chartData = data.map(d => ({
    ...d,
    name: d.family.replace('& ', '').split(' ').slice(0, 2).join(' '),
  }));

  return (
    <div className="panel rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Gap Distribution by Skill Family</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              label={{ value: 'Employee Count', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11, textAnchor: 'middle' } }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#d1d5db' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#1e293b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            />
            <Legend wrapperStyle={{ color: '#64748b', fontSize: 12 }} />
            <Bar dataKey="critical" name="Critical" fill="#ef4444" radius={[2, 2, 0, 0]} />
            <Bar dataKey="moderate" name="Moderate" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            <Bar dataKey="no_gap" name="On Track" fill="#10b981" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
