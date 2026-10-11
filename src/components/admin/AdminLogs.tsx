import React, { useState, useEffect } from 'react';
import { ActivityLogItem } from '../../types';
import { apiGetLogs } from '../../services/api';
import {
  ActivityIcon,
  RefreshCwIcon,
  SearchIcon,
  ClockIcon,
} from '../ui/Icons';

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiGetLogs({
        limit,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
      });
      setLogs(res.logs || []);
    } catch (err: any) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, limit]);

  const filteredLogs = logs.filter(
    (l) =>
      l.admin_username.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase())
  );

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800 border-green-400';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800 border-red-400';
    if (action.includes('PRICE')) return 'bg-yellow-100 text-yellow-800 border-yellow-400';
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800 border-blue-400';
    return 'bg-neutral-100 text-neutral-800 border-neutral-400';
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border-2 border-black shadow-[4px_4px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-6 h-6 text-brand-red" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Audit Activity Logs
            </h1>
          </div>
          <p className="text-sm text-neutral-600 font-medium mt-1">
            Rekam jejak setiap perubahan harga, konten, menu, dan riwayat login administrator
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-black uppercase text-xs transition-transform active:scale-95"
        >
          <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-neutral-100 p-4 border-2 border-black">
        <div className="relative flex-1 w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Cari admin, entitas, atau kata kunci log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border-2 border-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-white border-2 border-black text-xs font-bold focus:outline-none"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="LOGIN">LOGIN</option>
            <option value="UPDATE_PRICE">UPDATE_PRICE</option>
            <option value="CREATE_MENU">CREATE_MENU</option>
            <option value="UPDATE_MENU">UPDATE_MENU</option>
            <option value="DELETE_MENU">DELETE_MENU</option>
            <option value="UPDATE_BOTTLE">UPDATE_BOTTLE</option>
            <option value="UPDATE_PROMOTION">UPDATE_PROMOTION</option>
            <option value="UPDATE_HOMEPAGE">UPDATE_HOMEPAGE</option>
            <option value="UPDATE_CONTACT">UPDATE_CONTACT</option>
            <option value="UPLOAD_MEDIA">UPLOAD_MEDIA</option>
          </select>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-2 bg-white border-2 border-black text-xs font-bold focus:outline-none"
          >
            <option value={25}>25 Log</option>
            <option value={50}>50 Log</option>
            <option value={100}>100 Log</option>
            <option value={200}>200 Log</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-brand-red mb-2" />
          <p className="font-bold text-neutral-600">Memuat audit log...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-black">
          <ActivityIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="font-black text-lg uppercase text-neutral-800">Tidak Ada Log Aktivitas</h3>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1">
            Belum ada aktivitas yang tercatat untuk filter pencarian ini.
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_0_#000] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-black text-xs font-black uppercase text-neutral-700 tracking-wider">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Entitas</th>
                  <th className="py-3 px-4">Detail Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-neutral-200 text-xs font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                        {log.admin_username}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 font-black uppercase text-[10px] border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-neutral-700">
                      {log.entity}
                      {log.entity_id && (
                        <span className="text-neutral-400 font-normal ml-1">
                          #{log.entity_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-700 max-w-md break-words">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
