import React from 'react';
import {
  Bell,
  CheckCircle2,
  Printer,
  Store,
  X,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem } from '../types/printease';

interface Props {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onSelectOrder: (orderId: string) => void;
}

export const NotificationDrawer: React.FC<Props> = ({
  notifications,
  onClose,
  onMarkRead,
  onSelectOrder,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col border-l border-slate-200">
        <div className="p-4 bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] flex items-center justify-between border-b border-[#C48B28]/30">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#C48B28]" />
            <h3 className="font-extrabold text-sm tracking-tight text-[#FFF5E1]">PrintEase Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#FFF5E1]/70 hover:text-[#FFF5E1] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No new notifications.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) onMarkRead(n.id);
                  if (n.order_id) onSelectOrder(n.order_id);
                }}
                className={`py-3.5 px-2 rounded-xl transition-all cursor-pointer ${
                  n.read ? 'opacity-70 hover:bg-slate-50' : 'bg-[#C48B28]/10 hover:bg-[#C48B28]/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {n.type === 'order_ready' ? (
                      <Store className="w-4 h-4 text-emerald-600" />
                    ) : n.type === 'order_new' ? (
                      <Printer className="w-4 h-4 text-[#C48B28]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#C48B28]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                      <span>
                        {new Date(n.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {n.order_id && (
                        <span className="font-mono text-[#C48B28] font-bold">
                          #{n.order_id} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
