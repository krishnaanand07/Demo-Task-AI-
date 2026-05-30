import type { PipelineEvent } from '../types';

const PIPELINE_STAGES = [
  'Intent Extraction',
  'System Design',
  'Schema Generation',
  'Validation',
  'Repair',
  'Code Generation',
  'Complete'
];

export default function PipelineVisualizer({ events }: { events: PipelineEvent[] }) {
  const currentStageName = events.length > 0 ? events[events.length - 1].stage : null;
  const currentStatus = events.length > 0 ? events[events.length - 1].status : 'PENDING';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl h-full flex flex-col gap-6">
      <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        Execution Timeline
      </h2>
      
      <div className="flex flex-col gap-0">
        {PIPELINE_STAGES.map((stage, index) => {
          // Determine state logic
          const hasPassed = events.some(e => e.stage === stage && e.status === 'SUCCESS');
          const isCurrent = currentStageName === stage || (stage === 'Repair' && currentStageName === 'Validation' && currentStatus === 'FAILED');
          
          let statusColor = 'bg-slate-700';
          let textColor = 'text-slate-500';
          let lineClass = 'border-slate-700';
          
          if (hasPassed || (isCurrent && currentStatus === 'SUCCESS')) {
            statusColor = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
            textColor = 'text-green-400';
            lineClass = 'border-green-500/50';
          } else if (isCurrent) {
            if (currentStatus === 'RUNNING' || currentStatus === 'REPAIRING') {
              statusColor = 'bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.6)]';
              textColor = 'text-indigo-400 font-medium';
            } else if (currentStatus === 'FAILED') {
              statusColor = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
              textColor = 'text-red-400';
            }
          }

          return (
            <div key={stage} className="flex gap-4 relative group">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full mt-1.5 transition-all duration-300 ${statusColor}`} />
                {index < PIPELINE_STAGES.length - 1 && (
                  <div className={`w-0.5 h-10 border-l-2 transition-all duration-300 ${lineClass}`} />
                )}
              </div>
              <div className={`flex flex-col pb-4 transition-colors duration-300 ${textColor}`}>
                <span className="text-lg leading-tight">{stage}</span>
                {isCurrent && currentStatus === 'REPAIRING' && (
                  <span className="text-xs text-orange-400 mt-1 animate-pulse">Running Auto-Repair Loop...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
