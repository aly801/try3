import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, AtSign } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: number;
}

export default function AddChatDialog({ open, onOpenChange, currentUserId }: Props) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/chat-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: currentUserId, toUsername: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Errore", description: data.error || "Richiesta fallita", variant: "destructive" });
      } else {
        toast({ title: "Richiesta inviata", description: `Richiesta di chat inviata a @${data.toUser?.username}` });
        setUsername("");
        onOpenChange(false);
      }
    } catch {
      toast({ title: "Errore di rete", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm border"
        style={{ background: "hsl(0 0% 7%)", borderColor: "hsl(210 10% 14%)" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="w-5 h-5" style={{ color: "hsl(220 88% 65%)" }} />
            Nuova chat
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-4 mt-1">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Nome utente</Label>
            <div className="relative">
              <AtSign
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "hsl(220 88% 65%)" }}
              />
              <Input
                placeholder="Aly oppure Mini"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
                className="pl-9 bg-muted/30 border-border"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Inserisci il nome utente (con o senza @)
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Annulla
            </Button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                disabled={loading || !username.trim()}
                style={{ background: "hsl(220 88% 65%)", color: "hsl(0 0% 2%)" }}
              >
                {loading ? "Invio..." : "Invia richiesta"}
              </Button>
            </motion.div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
