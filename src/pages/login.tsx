import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MessageSquare, ArrowLeft, Lock, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const USERS: Record<string, string> = {
  Aly: "Aly1412008@",
  Mini: "Mini@201",
};

export default function Login() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const createUser = useCreateUser();

  const handleSelectUser = (username: string) => {
    setSelectedUser(username);
    setPassword("");
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPassword("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (password !== USERS[selectedUser]) {
      toast({
        title: "Accesso Negato",
        description: "La password inserita non è corretta.",
        variant: "destructive",
      });
      setPassword("");
      return;
    }

    createUser.mutate(
      { data: { username: selectedUser } },
      {
        onSuccess: (user) => {
          login(user);
          setLocation("/chat");
        },
        onError: () => {
          toast({
            title: "Errore",
            description: "Accesso fallito. Riprova.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full"
          style={{ background: "hsl(220 88% 65% / 0.12)" }}
          animate={{
            x: [0, 80, 40, -30, 0],
            y: [0, 60, -40, 80, 0],
            scale: [1, 1.35, 0.9, 1.2, 1],
            opacity: [0.5, 0.9, 0.6, 0.85, 0.5],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[440px] h-[440px] rounded-full"
          style={{ background: "hsl(220 88% 65% / 0.10)" }}
          animate={{
            x: [0, -70, -30, 50, 0],
            y: [0, -50, 60, -40, 0],
            scale: [1.2, 0.85, 1.3, 0.95, 1.2],
            opacity: [0.4, 0.8, 0.5, 0.75, 0.4],
          }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full"
          style={{ background: "hsl(220 88% 65% / 0.06)" }}
          animate={{
            x: [0, 50, -50, 30, 0],
            y: [0, -60, 40, -30, 0],
            scale: [1, 1.15, 0.88, 1.1, 1],
            opacity: [0.3, 0.6, 0.35, 0.55, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <motion.div
            className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center glow-blue"
            style={{ background: "hsl(220 88% 65% / 0.12)", border: "1px solid hsl(220 88% 65% / 0.3)" }}
            whileHover={{ scale: 1.05 }}
            animate={{ boxShadow: ["0 0 20px 4px hsl(220 88% 65% / 0.15)", "0 0 30px 8px hsl(220 88% 65% / 0.25)", "0 0 20px 4px hsl(220 88% 65% / 0.15)"] }}
            transition={{ boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
          >
            <MessageSquare className="w-8 h-8" style={{ color: "hsl(220 88% 65%)" }} />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Benvenuto</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedUser ? `Inserisci la password per ${selectedUser}` : "Seleziona il tuo profilo"}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="rounded-2xl border bg-card p-6"
          style={{ borderColor: "hsl(210 10% 14%)", boxShadow: "0 24px 64px -12px rgba(0,0,0,0.8)" }}
        >
          <AnimatePresence mode="wait">
            {!selectedUser ? (
              <motion.div
                key="userlist"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-3"
              >
                {Object.keys(USERS).map((username, i) => (
                  <motion.button
                    key={username}
                    onClick={() => handleSelectUser(username)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    whileHover={{ scale: 1.02, borderColor: "hsl(220 88% 65% / 0.6)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-16 rounded-xl border-2 bg-muted/30 flex items-center gap-4 px-5 text-left cursor-pointer transition-colors"
                    style={{ borderColor: "hsl(210 10% 14%)" }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "hsl(220 88% 65% / 0.12)", border: "1px solid hsl(220 88% 65% / 0.3)" }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <span className="font-bold text-lg" style={{ color: "hsl(220 88% 65%)" }}>
                        {username[0].toUpperCase()}
                      </span>
                    </motion.div>
                    <div className="flex flex-col flex-1">
                      <span className="text-lg font-semibold text-foreground">{username}</span>
                      <span className="text-xs text-muted-foreground">@{username}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground flex-shrink-0" />
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.form
                key="passwordform"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Selected user badge */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "hsl(220 88% 65% / 0.08)", border: "1px solid hsl(220 88% 65% / 0.2)" }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(220 88% 65% / 0.15)" }}
                  >
                    <span className="font-bold" style={{ color: "hsl(220 88% 65%)" }}>
                      {selectedUser[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground">{selectedUser}</span>
                </motion.div>

                {/* Password field */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="flex items-center gap-1.5 text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" /> Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={createUser.isPending}
                    className="h-12 text-base bg-muted/30 border-border focus:border-primary focus:ring-primary/30 transition-all"
                    autoFocus
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-2"
                >
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold transition-all"
                      style={{ background: "hsl(220 88% 65%)", color: "hsl(0 0% 2%)" }}
                      disabled={createUser.isPending || !password}
                    >
                      {createUser.isPending ? "Accesso in corso..." : "Accedi"}
                    </Button>
                  </motion.div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={handleBack}
                    disabled={createUser.isPending}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cambia profilo
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
