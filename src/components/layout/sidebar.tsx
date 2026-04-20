import { useListRooms, useGetOnlineUsers } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, User as UserIcon, MessageSquare, Check, X, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import CreateRoomDialog from "./create-room-dialog";
import { useState, useEffect, useCallback } from "react";
import { useWebsocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface PendingRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  status: string;
  createdAt: string;
  fromUser: { id: number; username: string };
}

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const { subscribe } = useWebsocket(user?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useListRooms(
    { userId: user?.id || 0 },
    { query: { enabled: !!user?.id } }
  );

  const { data: onlineUsers } = useGetOnlineUsers({
    query: { refetchInterval: 10000 }
  });

  const fetchPending = useCallback(async () => {
    if (!user?.id) return;
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    const res = await fetch(`${BASE}/api/chat-requests/pending?userId=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setPendingRequests(data);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  useEffect(() => {
    const unsub = subscribe((msg: any) => {
      if (msg.type === "chat_request") {
        setPendingRequests(prev => [...prev, msg.request]);
        toast({
          title: "Nuova richiesta di chat",
          description: `@${msg.request.fromUser?.username} vuole chattare con te`,
        });
      }
      if (msg.type === "chat_request_accepted") {
        toast({
          title: "Richiesta accettata",
          description: `@${msg.byUser?.username} ha accettato la tua richiesta`,
        });
        refetchRooms();
      }
    });
    return unsub;
  }, [subscribe, toast, refetchRooms]);

  const handleAccept = async (req: PendingRequest) => {
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    const res = await fetch(`${BASE}/api/chat-requests/${req.id}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user?.id }),
    });
    if (res.ok) {
      setPendingRequests(prev => prev.filter(r => r.id !== req.id));
      refetchRooms();
    }
  };

  const handleDecline = async (req: PendingRequest) => {
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    const res = await fetch(`${BASE}/api/chat-requests/${req.id}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user?.id }),
    });
    if (res.ok) {
      setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-72 border-r flex flex-col h-full"
      style={{ background: "hsl(0 0% 5%)", borderColor: "hsl(210 10% 10%)" }}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: "1px solid hsl(210 10% 10%)" }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Avatar className="ring-2" style={{ "--tw-ring-color": "hsl(220 88% 65% / 0.4)" } as any}>
            <AvatarFallback
              className="font-bold text-sm"
              style={{ background: "hsl(220 88% 65% / 0.15)", color: "hsl(220 88% 65%)" }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-semibold text-sm text-foreground truncate">{user.username}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <motion.span
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Online
          </span>
        </div>
      </div>

      {/* Pending requests */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
            style={{ borderBottom: "1px solid hsl(220 88% 65% / 0.2)" }}
          >
            <div className="px-3 py-2" style={{ background: "hsl(220 88% 65% / 0.06)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Bell className="w-3 h-3" style={{ color: "hsl(220 88% 65%)" }} />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(220 88% 65%)" }}>
                  Richieste ({pendingRequests.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {pendingRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(210 10% 14%)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: "hsl(220 88% 65% / 0.15)", color: "hsl(220 88% 65%)" }}
                    >
                      {req.fromUser.username[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-foreground flex-1 truncate">
                      @{req.fromUser.username}
                    </span>
                    <button
                      onClick={() => handleAccept(req)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: "hsl(142 76% 36% / 0.2)", color: "hsl(142 76% 55%)" }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDecline(req)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: "hsl(0 72% 51% / 0.15)", color: "hsl(0 72% 65%)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section label */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Conversazioni
        </span>
        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md"
            style={{ color: "hsl(220 88% 65%)" }}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Room list */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-0.5">
          {roomsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
                <Skeleton className="w-9 h-9 rounded-full" style={{ background: "hsl(210 10% 12%)" }} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-20" style={{ background: "hsl(210 10% 12%)" }} />
                  <Skeleton className="h-2.5 w-28" style={{ background: "hsl(210 10% 12%)" }} />
                </div>
              </div>
            ))
          ) : rooms?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center px-4"
            >
              <MessageSquare className="w-8 h-8 mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground mb-1">Nessuna conversazione</p>
              <p className="text-[10px] text-muted-foreground/60">
                Usa il pulsante + in basso per aggiungere un amico
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {rooms?.map((room, i) => {
                const isActive = location === `/chat/${room.id}`;
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                  >
                    <Link href={`/chat/${room.id}`}>
                      <motion.div
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors relative"
                        style={{
                          background: isActive ? "hsl(220 88% 65% / 0.1)" : "transparent",
                          border: isActive ? "1px solid hsl(220 88% 65% / 0.2)" : "1px solid transparent",
                        }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeRoom"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                            style={{ background: "hsl(220 88% 65%)" }}
                          />
                        )}
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback
                            className="text-xs font-medium"
                            style={{
                              background: room.type === "group"
                                ? "hsl(220 88% 65% / 0.12)"
                                : "hsl(260 60% 65% / 0.12)",
                              color: room.type === "group"
                                ? "hsl(220 88% 65%)"
                                : "hsl(260 60% 75%)",
                            }}
                          >
                            {room.type === "group"
                              ? <Users className="h-3.5 w-3.5" />
                              : room.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-medium text-sm text-foreground truncate">{room.name}</span>
                            {room.lastMessage && (
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-1">
                                {formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: false })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground truncate">
                              {room.lastMessage
                                ? room.lastMessage.type === "text"
                                  ? room.lastMessage.content
                                  : "Allegato"
                                : "Nessun messaggio"}
                            </span>
                            {room.unreadCount > 0 && (
                              <Badge
                                className="h-4 min-w-4 px-1 text-[10px] rounded-full ml-1"
                                style={{ background: "hsl(220 88% 65%)", color: "hsl(0 0% 2%)" }}
                              >
                                {room.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* Online users */}
      <div className="p-3" style={{ borderTop: "1px solid hsl(210 10% 10%)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Online ({onlineUsers?.length || 0})
        </p>
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {onlineUsers?.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background: "hsl(220 88% 65% / 0.08)",
                  border: "1px solid hsl(220 88% 65% / 0.2)",
                  color: "hsl(220 88% 65%)",
                }}
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-green-400"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {u.username}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} onlineUsers={onlineUsers || []} />
    </motion.div>
  );
}
