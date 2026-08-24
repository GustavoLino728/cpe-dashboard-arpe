import { useState, useEffect, useCallback, useRef } from "react";
import {
  ApiNotification,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api";

export function useNotifications(pollIntervalMs = 60000) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [notificationsData, countData] = await Promise.all([
        fetchNotifications(false),
        fetchUnreadCount(),
      ]);
      const sortedNotifs = [...notificationsData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(sortedNotifs);
      setUnreadCount(countData.count);
    } catch (err) {
      console.error("[useNotifications] Erro ao carregar notificações:", err);
      setError("Erro ao carregar notificações");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // Atualização otimista
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error(`[useNotifications] Erro ao marcar notificação ${id} como lida:`, err);
      loadNotifications(true);
    }
  }, [loadNotifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, is_read: true }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error("[useNotifications] Erro ao marcar todas as notificações como lidas:", err);
      loadNotifications(true);
    }
  }, [loadNotifications]);

  useEffect(() => {
    loadNotifications();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    pollTimerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadNotifications(true);
      }
    }, pollIntervalMs);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [loadNotifications, pollIntervalMs]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: () => loadNotifications(true),
    markAsRead,
    markAllAsRead,
  };
}
