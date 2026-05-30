import { useEffect, useRef } from 'react';
import type { PipelineEvent } from '../types';

export default function LogPanel({ events }: { events: PipelineEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="bg-[#0c0f1a] border border-slate-700 rounded-xl p-4 shadow-2xl h-96 flex flex-col font-mono text-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <span className="text-slate-500 text-xs uppercase tracking-wider ml-2">Compiler Execution Logs</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-1.5"
      >
        {events.length === 0 ? (
          <div className="text-slate-600 italic mt-2">Awaiting compilation start...</div>
        ) : (
          events.map((event, i) => {
            let logColor = 'text-slate-300';
            if (event.status === 'FAILED') logColor = 'text-red-400';
            if (event.status === 'SUCCESS') logColor = 'text-green-400';
            if (event.status === 'REPAIRING') logColor = 'text-yellow-400';
            
            return (
              <div key={i} className="flex gap-3 animate-fade-in">
                <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                <div className="flex flex-col">
                  <span className={logColor}>{event.log}</span>
                  {event.data && (
                    <pre className="mt-1 text-xs text-slate-500 bg-slate-900/50 p-2 rounded overflow-x-auto max-w-2xl border border-slate-800">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
