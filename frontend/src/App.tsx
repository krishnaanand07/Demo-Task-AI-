import { useState, useRef, useEffect } from 'react';
import PipelineVisualizer from './components/PipelineVisualizer';
import LogPanel from './components/LogPanel';
import type { PipelineEvent } from './types';

export default function App() {
  const [prompt, setPrompt] = useState('Build a CRM with an analytics dashboard');
  const [isCompiling, setIsCompiling] = useState(false);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [outPath, setOutPath] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startCompilation = () => {
    if (!prompt.trim()) return;
    
    // Reset state
    setEvents([]);

    setOutPath(null);
    setIsCompiling(true);
    
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const url = `${apiBase}/api/compile?prompt=${encodeURIComponent(prompt)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PROGRESS') {
          setEvents(prev => [...prev, data.event]);
        } else if (data.type === 'DONE') {
          setIsCompiling(false);
          eventSource.close();
        } else if (data.type === 'ERROR') {
          setEvents(prev => [...prev, { stage: 'System', status: 'FAILED', log: data.message }]);
          setIsCompiling(false);
          eventSource.close();
        }
      } catch (e) {
        console.error('Failed to parse SSE message', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      setIsCompiling(false);
      eventSource.close();
    };
  };

  useEffect(() => {
    // Check if the last event contains the final generated data
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.stage === 'Complete' && lastEvent.status === 'SUCCESS' && lastEvent.data) {

      setOutPath(lastEvent.data.generatedAppPath);
    }
  }, [events]);

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI App Compiler Dashboard</h1>
        <p className="text-slate-400">Deterministic multi-stage compilation pipeline powered by NVIDIA NIM.</p>
      </header>

      <section className="flex gap-4">
        <input 
          type="text" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt like 'Build a CRM'"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
          disabled={isCompiling}
        />
        <button 
          onClick={startCompilation}
          disabled={isCompiling || !prompt}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-lg shadow-lg shadow-indigo-900/50 transition-all"
        >
          {isCompiling ? 'Compiling...' : 'Compile App'}
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PipelineVisualizer events={events} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-8">
          <LogPanel events={events} />
          
          {outPath && (
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-xl flex flex-col gap-4 animate-fade-in">
              <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Compilation Successful!
              </h2>
              <div className="bg-slate-900 p-4 rounded border border-slate-700 font-mono text-sm text-slate-300">
                <p>Generated Application Path:</p>
                <p className="text-indigo-300 break-all">{outPath}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
