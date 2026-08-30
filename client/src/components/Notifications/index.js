import { useState, useEffect } from 'react';
import { Bell, Check, X, AlertCircle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';

export default function NotificationsDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (socket) {
      socket.on(`notification:${user.id}`, (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
      });
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#131B29] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-slate-100">Notifications</h2>
            <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-medium">
              {notifications.filter((n) => !n.isRead).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id || n.id}
                className={`p-3 rounded-lg border text-sm transition ${
                  n.isRead
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                    : 'bg-indigo-950/30 border-indigo-500/30 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {n.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  {n.type === 'escalation' && <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                  {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  {(!n.type || n.type === 'info') && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 text-xs">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 break-words">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(n.createdAt || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
