import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_STATS } from '../constants';

interface AnalyticsProps {
  isHighContrast: boolean;
}

export const AnalyticsScreen: React.FC<AnalyticsProps> = ({ isHighContrast }) => {
  // Calculate aggregate metrics dynamically from mock data
  const totalViews = MOCK_STATS.reduce((acc, curr) => acc + curr.views, 0);
  const totalClicks = MOCK_STATS.reduce((acc, curr) => acc + curr.clicks, 0);
  // We use 'any' here because pointsRedeemed was just added to the mock data structure implicitly
  const totalPoints = MOCK_STATS.reduce((acc, curr) => acc + ((curr as any).pointsRedeemed || 0), 0);
  
  const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";
  const avgPointsPerRedemption = totalClicks > 0 ? Math.round(totalPoints / totalClicks) : 0;

  return (
    <div className={`h-full flex flex-col p-4 pb-20 overflow-y-auto ${isHighContrast ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className={`text-2xl font-bold mb-6 ${isHighContrast ? 'text-yellow-400' : 'text-gray-900'}`}>Performance</h2>
      
      <div className={`w-full h-64 rounded-2xl p-4 shadow-sm mb-4 ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white'}`}>
        <h3 className="text-lg font-semibold mb-4">Views vs Conversions</h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={MOCK_STATS}>
            <CartesianGrid strokeDasharray="3 3" stroke={isHighContrast ? '#444' : '#eee'} />
            <XAxis dataKey="name" stroke={isHighContrast ? '#fff' : '#666'} />
            <YAxis stroke={isHighContrast ? '#fff' : '#666'} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isHighContrast ? '#000' : '#fff',
                borderColor: isHighContrast ? '#ffd700' : '#ccc',
                color: isHighContrast ? '#fff' : '#000'
              }} 
            />
            <Bar dataKey="views" fill={isHighContrast ? '#444' : '#8884d8'} radius={[4, 4, 0, 0]} name="Views" />
            <Bar dataKey="clicks" fill={isHighContrast ? '#ffd700' : '#82ca9d'} radius={[4, 4, 0, 0]} name="Claims" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow'}`}>
          <p className="text-sm opacity-70">Total Views</p>
          <p className={`text-2xl font-bold ${isHighContrast ? 'text-white' : 'text-blue-600'}`}>
            {totalViews.toLocaleString()}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow'}`}>
           <p className="text-sm opacity-70">Conversion Rate</p>
           <p className={`text-2xl font-bold ${isHighContrast ? 'text-yellow-400' : 'text-green-600'}`}>
             {conversionRate}%
           </p>
        </div>
        <div className={`p-4 rounded-xl ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow'}`}>
           <p className="text-sm opacity-70">Avg Pts / Ad</p>
           <p className={`text-2xl font-bold ${isHighContrast ? 'text-white' : 'text-purple-600'}`}>
             {avgPointsPerRedemption}
           </p>
        </div>
        <div className={`p-4 rounded-xl ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow'}`}>
           <p className="text-sm opacity-70">Total Distributed</p>
           <p className={`text-2xl font-bold ${isHighContrast ? 'text-yellow-400' : 'text-orange-600'}`}>
             {totalPoints.toLocaleString()}
           </p>
        </div>
      </div>
    </div>
  );
};