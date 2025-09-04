
import React from 'react';
import type { TimelineEvent } from '../types';

interface TimelineDisplayProps {
  events: TimelineEvent[];
  isLoading: boolean;
}

const TimelineSkeleton: React.FC = () => (
  <div className="w-full overflow-x-auto animate-pulse">
    <div className="relative" style={{ height: '240px', minWidth: '800px' }}>
      {/* Axis */}
      <div className="absolute top-1/2 left-4 right-4 h-1.5 -translate-y-1/2 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
      {/* Nodes */}
      <div className="absolute inset-0 flex justify-between items-center px-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex-1 flex justify-center items-center">
            <div className="relative">
              <div className="h-4 w-4 rounded-full bg-slate-400 dark:bg-slate-600 z-10 ring-4 ring-white dark:ring-slate-800"></div>
              <div className={`absolute left-1/2 -translate-x-1/2 ${index % 2 !== 0 ? 'bottom-full mb-3' : 'top-full mt-3'} w-32`}>
                <div className="h-20 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);


const TimelineNode: React.FC<{ item: TimelineEvent; index: number }> = ({ item, index }) => {
    const isAbove = index % 2 !== 0;
    return (
        <div className="flex-1 flex justify-center items-center">
            <div className="relative">
                {/* The dot on the axis */}
                <div className="h-4 w-4 rounded-full bg-blue-500 z-10 ring-4 ring-white dark:ring-slate-800"></div>

                {/* Vertical Connector Line */}
                <div className={`absolute left-1/2 -translate-x-1/2 w-0.5 bg-slate-300 dark:bg-slate-600 ${isAbove ? 'bottom-full h-3' : 'top-full h-3'}`}></div>

                {/* The card container */}
                <div className={`absolute left-1/2 -translate-x-1/2 w-48 text-center ${isAbove ? 'bottom-full mb-3' : 'top-full mt-3'}`}>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700">
                        <p className="font-bold text-sm text-blue-600 dark:text-blue-400">{item.time}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{item.event}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TimelineDisplay: React.FC<TimelineDisplayProps> = ({ events, isLoading }) => {
  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (events.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
        Nenhum evento cronológico claro foi extraído da HDA.
      </div>
    );
  }
  
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#14b8a6'];
  const gradientStops = [];

  if (events.length > 1) {
    const segmentWidth = 100 / (events.length - 1);
    for (let i = 0; i < events.length - 1; i++) {
        const color = colors[i % colors.length];
        gradientStops.push(`${color} ${i * segmentWidth}%`);
        gradientStops.push(`${color} ${(i + 1) * segmentWidth}%`);
    }
  } else {
     gradientStops.push(`${colors[0]} 0%`, `${colors[0]} 100%`);
  }
  
  const gradientStyle = { background: `linear-gradient(to right, ${gradientStops.join(', ')})` };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="relative" style={{ height: '240px', minWidth: `${events.length * 200}px` }}>
        {/* The horizontal axis line with gradient */}
        <div className="absolute top-1/2 left-4 right-4 h-1.5 -translate-y-1/2" style={gradientStyle}></div>
        
        {/* Container for the nodes, using flexbox for distribution */}
        <div className="absolute inset-0 flex justify-between items-center px-2">
            {events.map((item, index) => (
                <TimelineNode key={index} item={item} index={index} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineDisplay;
