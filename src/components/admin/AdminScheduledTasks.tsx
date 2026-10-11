import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
} from '../ui/Icons';

export interface ScheduledTaskItem {
  task_key: string;
  name: string;
  schedule_cron: string;
  description: string;
  last_run_at?: string;
  next_run_at?: string;
  last_status: 'success' | 'failed' | 'running' | 'pending';
  last_duration_ms: number;
  last_error?: string;
  is_enabled: number;
  updated_at: string;
}

export const AdminScheduledTasks: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringKey, setTriggeringKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = localStorage.getItem('token') || '';

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tasks/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTrigger = async (taskKey: string) => {
    try {
      setTriggeringKey(taskKey);
      setFeedback(null);
      const res = await fetch(`/api/admin/tasks/trigger/${taskKey}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: `${data.message} (${data.durationMs}ms)`,
        });
        fetchTasks();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Gagal menjalankan tugas' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Koneksi server gagal' });
    } finally {
      setTriggeringKey(null);
    }
  };

  const handleToggle = async (taskKey: string, currentEnabled: number) => {
    try {
      const nextState = currentEnabled === 1 ? false : true;
      const res = await fetch(`/api/admin/tasks/toggle/${taskKey}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEnabled: nextState }),
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏰</span>
            <h1 className="text-2xl font-black uppercase tracking-tight">Scheduled Tasks Monitor</h1>
            <span className="px-2 py-0.5 bg-jebew-yellow text-black border-2 border-black text-[10px] font-black uppercase rounded shadow-brutal-xs">
              Cron Jobs Otomatis
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-600 mt-1">
            Pantau seluruh rutinitas otomatis background: reset kuota spin harian (00:00 WIB), auto backup database, audit rekonsiliasi, dan alert stok menipis.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          disabled={loading}
          className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Status
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 border-3 border-black font-black text-xs flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const isTriggering = triggeringKey === task.task_key;
          const isSuccess = task.last_status === 'success';

          return (
            <div
              key={task.task_key}
              className={`p-5 border-3 border-black shadow-[4px_4px_0_0_#000] space-y-3 ${
                task.is_enabled ? 'bg-white' : 'bg-neutral-100 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                        isSuccess ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'
                      }`}
                    >
                      {task.last_status}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-neutral-100 px-1.5 py-0.5 border border-neutral-300 rounded">
                      {task.schedule_cron}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-black">{task.name}</h3>
                  <p className="text-xs font-medium text-neutral-600 leading-snug">{task.description}</p>
                </div>

                {/* Enable Switch */}
                <button
                  onClick={() => handleToggle(task.task_key, task.is_enabled)}
                  className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black rounded cursor-pointer ${
                    task.is_enabled ? 'bg-green-400 text-black' : 'bg-neutral-300 text-neutral-700'
                  }`}
                >
                  {task.is_enabled ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              {/* Execution Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200 text-[11px] font-medium text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    Terakhir: {task.last_run_at ? new Date(task.last_run_at).toLocaleTimeString('id-ID') : '-'}
                  </span>
                </div>
                <div className="text-right font-mono">
                  Durasi: <span className="font-bold text-black">{task.last_duration_ms}ms</span>
                </div>
              </div>

              {task.last_error && (
                <div className="p-2 bg-red-50 border border-red-300 rounded text-[11px] font-mono text-red-800">
                  Error: {task.last_error}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleTrigger(task.task_key)}
                  disabled={isTriggering || !task.is_enabled}
                  className="w-full py-2 bg-jebew-yellow hover:bg-yellow-400 text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
                  {isTriggering ? 'Mengeksekusi Job...' : 'Jalankan Sekarang'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
