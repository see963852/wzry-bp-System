'use client';

import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { ThreatAssessment } from '@/types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export function ThreatRadar({ threat }: { threat: ThreatAssessment }) {
  const data = {
    labels: ['爆發力', '控制力', '坦度', '開團', '機動性', '後期強度'],
    datasets: [
      {
        label: '敵方威脅',
        data: [threat.burst, threat.control, threat.durability, threat.engage, threat.mobility, threat.scaling],
        backgroundColor: 'rgba(229, 62, 62, 0.18)',
        borderColor: '#e53e3e',
        pointBackgroundColor: '#f6c90e',
      },
    ],
  };

  return (
    <div className="h-[260px] rounded-md border border-white/10 bg-black/20 p-3">
      <Radar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: { display: false },
              grid: { color: 'rgba(255,255,255,0.1)' },
              angleLines: { color: 'rgba(255,255,255,0.12)' },
              pointLabels: { color: '#d4d4d8' },
            },
          },
          plugins: {
            legend: { labels: { color: '#d4d4d8' } },
          },
        }}
      />
    </div>
  );
}
