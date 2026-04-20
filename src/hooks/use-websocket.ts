import { useState, useEffect, useCallback, useRef } from "react";
import { Message } from "@workspace/api-client-react";

type WsMessage =
  | { type: "message"; message: Message }
  | { type: "typing"; roomId: number; userId: number }
  | { type: "join"; roomId: number; userId: number }
  | { type: "signal"; roomId: number; userId: number; signal: any }
  | { type: "chat_request"; request: any }
  | { type: "chat_request_accepted"; room: any; byUser: any };

export function useWebsocket(userId?: number) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, number[]>>({});
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const messageCallbacks = useRef<((msg: WsMessage) => void)[]>([]);

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: "join", userId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsMessage;

          if (data.type === "typing") {
            setTypingUsers(prev => {
              const roomTyping = prev[data.roomId] || [];
              if (!roomTyping.includes(data.userId)) {
                return { ...prev, [data.roomId]: [...roomTyping, data.userId] };
              }
              return prev;
            });

            const key = `${data.roomId}-${data.userId}`;
            if (typingTimeoutsRef.current[key]) {
              clearTimeout(typingTimeoutsRef.current[key]);
            }
            typingTimeoutsRef.current[key] = setTimeout(() => {
              setTypingUsers(prev => ({
                ...prev,
                [data.roomId]: (prev[data.roomId] || []).filter(id => id !== data.userId)
              }));
            }, 3000);
          }

          messageCallbacks.current.forEach(cb => cb(data));
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };

      setSocket(ws);
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [userId]);

  const sendTyping = useCallback((roomId: number) => {
    if (socket?.readyState === WebSocket.OPEN && userId) {
      socket.send(JSON.stringify({ type: "typing", roomId, userId }));
    }
  }, [socket, userId]);

  const sendSignal = useCallback((roomId: number, signal: any) => {
    if (socket?.readyState === WebSocket.OPEN && userId) {
      socket.send(JSON.stringify({ type: "signal", roomId, userId, signal }));
    }
  }, [socket, userId]);

  const subscribe = useCallback((cb: (msg: WsMessage) => void) => {
    messageCallbacks.current.push(cb);
    return () => {
      messageCallbacks.current = messageCallbacks.current.filter(c => c !== cb);
    };
  }, []);

  return {
    isConnected,
    typingUsers,
    sendTyping,
    sendSignal,
    subscribe,
  };
}
