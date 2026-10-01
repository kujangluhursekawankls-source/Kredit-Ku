import React, { useState } from 'react';
import { AuditLogItem } from '../types';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import {
  ShieldAlert,
  Search,
  Clock,
  User,
  Activity,
  FileText,
  Lock
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogItem[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const { currentTenantId } = useAuthAndTenant();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    if (action.includes('CREATED') || action.includes('REGISTERED')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (action.includes('VOID') || action.includes('DELETED')) {
      return 'bg-red-50 text-red-800 border-red-200';
    }
    if (action.includes('UPDATED') || action.includes('SETTINGS')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-blue-50 text-blue-800 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-700" />
            <h2 className="text-xl font-bold text-slate-900">Audit Log & Jejak Aktivitas</h2>
          </div>
          <p className="text-xs text-slate-500">
            Log operasional append-only yang merekam setiap pencatatan kredit, penerimaan cicilan, dan pembatalan transaksi secara mutlak untuk tenant: <strong className="font-mono text-slate-700">{currentTenantId}</strong>.
          </p>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari aktivitas, nama..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Logs Table / Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Aktivitas Tercatat</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Setiap aksi penting (tambah nasabah, penerbitan kredit, pelunasan, void) akan terekam otomatis di sini.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Oleh: <strong>{log.userName}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-900 font-medium">{log.description}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID Entitas: {log.entityId} • Tenant: {log.tenantId}
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="flex items-center sm:justify-end gap-1 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
