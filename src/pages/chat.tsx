import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/layout/sidebar";
import { Route, Switch } from "wouter";
import ActiveChat from "./active-chat";
import { useGetRecentActivity } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { MessageSquare, Activity, Users, UserPlus } from "lucide-react";
import { useState } from "react";
import AddChatDialog from "@/components/chat/add-chat-dialog";

export default function ChatLayout() {
  const { user } = useAuth();
  const [addChatOpen, setAddChatOpen] = useState(false);

  if (!user) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Switch>
          <Route path="/chat" component={EmptyChat} />
          <Route path="/chat/:roomId" component={ActiveChat} />
        </Switch>

        {/* Floating add button */}
        <motion.button
          onClick={() => setAddChatOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-20"
          style={{
            background: "hsl(220 88% 65%)",
            boxShadow: "0 8px 30px hsl(220 88% 65% / 0.45)",
          }}
        >
          <UserPlus className="w-6 h-6" style={{ color: "hsl(0 0% 2%)" }} />
        </motion.button>

        <AddChatDialog
          open={addChatOpen}
          onOpenChange={setAddChatOpen}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}

function StatCard({ value, label, icon: Icon, delay }: { value: number; label: string; icon: any; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "hsl(0 0% 7%)",
        border: "1px solid hsl(210 10% 12%)",
        boxShadow: "0 8px 24px -4px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: "hsl(220 88% 65% / 0.1)", border: "1px solid hsl(220 88% 65% / 0.2)" }}
      >
        <Icon className="w-5 h-5" style={{ color: "hsl(220 88% 65%)" }} />
      </div>
      <div>
        <motion.p className="text-3xl font-bold text-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.1 }}>
          {value}
        </motion.p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

function EmptyChat() {
  const { user } = useAuth();
  const { data: activity } = useGetRecentActivity(
    { userId: user?.id || 0 },
    { query: { enabled: !!user?.id } }
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "hsl(220 88% 65% / 0.03)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center space-y-3 mb-12 relative z-10"
      >
        <motion.div
          className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ background: "hsl(220 88% 65% / 0.1)", border: "1px solid hsl(220 88% 65% / 0.25)" }}
          animate={{ boxShadow: ["0 0 20px 4px hsl(220 88% 65% / 0.1)", "0 0 40px 10px hsl(220 88% 65% / 0.2)", "0 0 20px 4px hsl(220 88% 65% / 0.1)"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <MessageSquare className="w-9 h-9" style={{ color: "hsl(220 88% 65%)" }} />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Ciao, {user?.username}</h2>
        <p className="text-muted-foreground max-w-xs text-sm">
          Seleziona una chat oppure premi il pulsante in basso a destra per aggiungere un amico.
        </p>
      </motion.div>

      {activity && (
        <div className="grid grid-cols-3 gap-4 w-full max-w-lg relative z-10">
          <StatCard value={activity.totalRooms} label="Stanze" icon={MessageSquare} delay={0.1} />
          <StatCard value={activity.totalMessages} label="Messaggi" icon={Activity} delay={0.2} />
          <StatCard value={activity.onlineUsers} label="Online" icon={Users} delay={0.3} />
        </div>
      )}
    </div>
  );
}
