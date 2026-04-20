import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAddRoomMember, User, useGetOnlineUsers } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  roomId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMembers: User[];
}

export default function AddMemberDialog({ roomId, open, onOpenChange, currentMembers }: Props) {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const { data: onlineUsers } = useGetOnlineUsers({ query: { enabled: open } });
  const addMember = useAddRoomMember(roomId);

  const availableUsers = onlineUsers?.filter(u => !currentMembers.some(cm => cm.id === u.id)) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;

    // Add members one by one (since API only supports one at a time based on schema usually, let's assume body is { userId })
    Promise.all(selectedUserIds.map(userId => 
      addMember.mutateAsync({ data: { userId } })
    )).then(() => {
      onOpenChange(false);
      setSelectedUserIds([]);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-2">
                {availableUsers.map((u) => (
                  <div key={u.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`add-user-${u.id}`} 
                      checked={selectedUserIds.includes(u.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUserIds(prev => [...prev, u.id]);
                        } else {
                          setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                        }
                      }}
                    />
                    <label htmlFor={`add-user-${u.id}`} className="text-sm font-medium leading-none cursor-pointer">
                      {u.username}
                    </label>
                  </div>
                ))}
                {availableUsers.length === 0 && (
                  <div className="text-sm text-muted-foreground p-2 text-center">
                    No available users to add
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedUserIds.length === 0 || addMember.isPending}>
              {addMember.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
