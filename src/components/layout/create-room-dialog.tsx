import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateRoom, User } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onlineUsers: User[];
}

export default function CreateRoomDialog({ open, onOpenChange, onlineUsers }: Props) {
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const { user } = useAuth();
  const createRoom = useCreateRoom();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    createRoom.mutate(
      {
        data: {
          name: name.trim(),
          type: selectedUsers.length > 0 ? "group" : "direct",
          memberIds: [user.id, ...selectedUsers]
        }
      },
      {
        onSuccess: (room) => {
          onOpenChange(false);
          setName("");
          setSelectedUsers([]);
          setLocation(`/chat/${room.id}`);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Project Team" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              autoFocus 
            />
          </div>
          <div className="space-y-2">
            <Label>Select Members</Label>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-2">
                {onlineUsers.filter(u => u.id !== user?.id).map((u) => (
                  <div key={u.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`user-${u.id}`} 
                      checked={selectedUsers.includes(u.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(prev => [...prev, u.id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== u.id));
                        }
                      }}
                    />
                    <label htmlFor={`user-${u.id}`} className="text-sm font-medium leading-none cursor-pointer">
                      {u.username}
                    </label>
                  </div>
                ))}
                {onlineUsers.filter(u => u.id !== user?.id).length === 0 && (
                  <div className="text-sm text-muted-foreground p-2 text-center">
                    No other users online
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || createRoom.isPending}>
              {createRoom.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
