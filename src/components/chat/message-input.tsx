import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Loader2, Image as ImageIcon, File, X } from "lucide-react";
import { useSendMessage } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  roomId: number;
  userId: number;
  onTyping: () => void;
}

export default function MessageInput({ roomId, userId, onTyping }: Props) {
  const [content, setContent] = useState("");
  const sendMessage = useSendMessage(roomId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [pendingFile, setPendingFile] = useState<{file: File, type: 'image' | 'video' | 'file', url: string} | null>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      if (pendingFile) {
        sendMessage.mutate({
          id: roomId,
          data: {
            senderId: userId,
            content: content.trim(),
            type: pendingFile.type,
            fileUrl: response.objectPath,
            fileName: pendingFile.file.name,
            fileSize: pendingFile.file.size
          }
        }, {
          onSuccess: () => {
            setContent("");
            setPendingFile(null);
          }
        });
      }
    },
    onError: (err) => {
      console.error("Upload failed", err);
      setPendingFile(null);
    }
  });

  const handleSend = () => {
    if (!content.trim() && !pendingFile) return;

    if (pendingFile) {
      // triggers the upload, onSuccess handles sending the message
      uploadFile(pendingFile.file);
    } else {
      sendMessage.mutate({
        id: roomId,
        data: {
          senderId: userId,
          content: content.trim(),
          type: "text"
        }
      }, {
        onSuccess: () => {
          setContent("");
          // Reset textarea height
          if (textareaRef.current) {
            textareaRef.current.style.height = '56px';
          }
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const type = isImage ? 'image' : isVideo ? 'video' : 'file';

    setPendingFile({
      file,
      type,
      url: URL.createObjectURL(file)
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 bg-background border-t">
      {pendingFile && (
        <div className="mb-3 relative inline-block">
          {pendingFile.type === 'image' ? (
            <img src={pendingFile.url} alt="Preview" className="h-24 rounded-md border object-cover" />
          ) : (
            <div className="h-16 px-4 bg-muted border rounded-md flex items-center gap-2">
              <File className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium max-w-[200px] truncate">{pendingFile.file.name}</span>
            </div>
          )}
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={() => setPendingFile(null)}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
          {isUploading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
              <div className="flex flex-col items-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary mb-1" />
                <span className="text-xs font-medium">{progress}%</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-end gap-2 bg-muted/30 p-1 pl-3 rounded-2xl border focus-within:ring-1 focus-within:ring-primary/50 transition-all">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground rounded-full hover:bg-muted mb-1">
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" side="top" align="start">
            <div className="flex flex-col gap-1">
              <Button variant="ghost" className="justify-start gap-2" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-4 w-4" /> Image/Video
              </Button>
              <Button variant="ghost" className="justify-start gap-2" onClick={() => fileInputRef.current?.click()}>
                <File className="h-4 w-4" /> Document
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
        />

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            // Auto-resize
            e.target.style.height = '56px';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="min-h-[56px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent py-4 px-1"
          disabled={isUploading || sendMessage.isPending}
        />
        
        <Button 
          size="icon" 
          className="h-10 w-10 shrink-0 rounded-full mb-1 mr-1"
          disabled={(!content.trim() && !pendingFile) || isUploading || sendMessage.isPending}
          onClick={handleSend}
        >
          {sendMessage.isPending || isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
