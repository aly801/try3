import { useParams } from "wouter";
import { useGetRoom, useListMessages, useListRoomMembers, useSendMessage, Message, useGetUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useWebsocket } from "@/hooks/use-websocket";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import MessageInput from "@/components/chat/message-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, Phone, Info, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddMemberDialog from "@/components/chat/add-member-dialog";
import VideoCall from "@/components/chat/video-call";

export default function ActiveChat() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = parseInt(roomId || "0", 10);
  const { user } = useAuth();

  const { data: currentUserProfile } = useGetUser(user?.id || 0, { query: { enabled: !!user?.id } });
  const { data: room, isLoading: roomLoading } = useGetRoom(id, { query: { enabled: !!id } });
  const { data: initialMessages, isLoading: msgsLoading } = useListMessages(id, undefined, { query: { enabled: !!id } });
  const { data: members, refetch: refetchMembers } = useListRoomMembers(id, { query: { enabled: !!id } });

  const [messages, setMessages] = useState<Message[]>([]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isConnected, subscribe, typingUsers, sendTyping } = useWebsocket(user?.id);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    const unsubscribe = subscribe((msg) => {
      if (msg.type === "message" && msg.message.roomId === id) {
        setMessages((prev) => [...prev, msg.message]);
      } else if (msg.type === "join" && msg.roomId === id) {
        refetchMembers();
      }
    });
    return unsubscribe;
  }, [subscribe, id, refetchMembers]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  if (roomLoading || msgsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          className="w-8 h-8 rounded-full border-2"
          style={{ borderColor: "hsl(220 88% 65% / 0.3)", borderTopColor: "hsl(220 88% 65%)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!room) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Stanza non trovata</div>;
  }

  const roomTypingUsers = typingUsers[id] || [];
  const typingUsernames = members
    ?.filter(m => roomTypingUsers.includes(m.id) && m.id !== user?.id)
    .map(m => m.username)
    .join(", ");

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex-1 flex flex-col h-full relative"
    >
      {/* Header */}
      <div
        className="h-14 px-5 flex items-center justify-between shrink-0 backdrop-blur-md"
        style={{
          background: "hsl(0 0% 5% / 0.85)",
          borderBottom: "1px solid hsl(210 10% 10%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(220 88% 65% / 0.1)", border: "1px solid hsl(220 88% 65% / 0.25)" }}
          >
            <span className="text-xs font-bold" style={{ color: "hsl(220 88% 65%)" }}>
              {room.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-sm text-foreground">{room.name}</h2>
            <p className="text-[10px] text-muted-foreground">
              {room.type === "group" ? `${members?.length || 0} membri` : "Messaggio diretto"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {room.type === "group" && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                onClick={() => setAddMemberOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
              <Phone className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
              onClick={() => setVideoCallOpen(true)}
            >
              <Video className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
              <Info className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" viewportRef={scrollRef}>
        <div className="flex flex-col space-y-2 pb-2">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === user?.id;
              const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex gap-2 max-w-[78%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}
                >
                  {!isMe && (
                    <div className="w-7 shrink-0 mt-auto mb-1">
                      {showAvatar && (
                        <Avatar className="w-7 h-7">
                          <AvatarFallback
                            className="text-[10px] font-semibold"
                            style={{ background: "hsl(220 88% 65% / 0.12)", color: "hsl(220 88% 65%)" }}
                          >
                            {msg.sender.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {showAvatar && !isMe && (
                      <span className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.sender.username}</span>
                    )}

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="rounded-2xl px-3.5 py-2.5"
                      style={
                        isMe
                          ? {
                              background: "hsl(220 88% 65%)",
                              color: "hsl(0 0% 3%)",
                              borderBottomRightRadius: "4px",
                            }
                          : {
                              background: "hsl(0 0% 10%)",
                              color: "hsl(210 15% 92%)",
                              border: "1px solid hsl(210 10% 14%)",
                              borderBottomLeftRadius: "4px",
                            }
                      }
                    >
                      {msg.type === "text" && (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</p>
                      )}
                      {msg.type === "image" && msg.fileUrl && (
                        <img
                          src={`/api/storage${msg.fileUrl}`}
                          alt={msg.fileName || "Image"}
                          className="max-w-full rounded-xl max-h-56 object-cover"
                        />
                      )}
                      {msg.type === "video" && msg.fileUrl && (
                        <video src={`/api/storage${msg.fileUrl}`} controls className="max-w-full rounded-xl max-h-56" />
                      )}
                      {msg.type === "file" && msg.fileUrl && (
                        <a
                          href={`/api/storage${msg.fileUrl}`}
                          download
                          className="flex items-center gap-2 p-2.5 rounded-xl transition-colors"
                          style={{ background: "rgba(0,0,0,0.15)" }}
                        >
                          <div className="p-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium">{msg.fileName}</p>
                            {msg.fileSize && <p className="text-[10px] opacity-70">{(msg.fileSize / 1024).toFixed(1)} KB</p>}
                          </div>
                        </a>
                      )}
                    </motion.div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 mx-1">
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {typingUsernames && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex gap-2 self-start max-w-[78%] items-end"
              >
                <div className="w-7 shrink-0" />
                <div>
                  <div
                    className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                    style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(210 10% 14%)" }}
                  >
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "hsl(220 88% 65%)" }}
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 ml-1 block">{typingUsernames} sta scrivendo...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input */}
      <MessageInput roomId={id} onTyping={() => sendTyping(id)} userId={user?.id || 0} />

      <AddMemberDialog roomId={id} open={addMemberOpen} onOpenChange={setAddMemberOpen} currentMembers={members || []} />
      <VideoCall roomId={id} userId={user?.id || 0} open={videoCallOpen} onOpenChange={setVideoCallOpen} />
    </motion.div>
  );
}
