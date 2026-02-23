import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface EditCompetitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitor: any;
}

export function EditCompetitorModal({ open, onOpenChange, competitor }: EditCompetitorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [inventoryUrl, setInventoryUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [usePlaywright, setUsePlaywright] = useState(false);

  // Populate form when competitor changes
  useEffect(() => {
    if (competitor) {
      setName(competitor.name || "");
      setInventoryUrl(competitor.inventoryUrl || "");
      setWebsiteUrl(competitor.websiteUrl || "");
      setUsePlaywright(competitor.usePlaywright || false);
    }
  }, [competitor]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateCompetitor(competitor.id, { name, inventoryUrl, websiteUrl, usePlaywright }),
    onSuccess: () => {
      toast({ title: "Competitor Updated", description: `${name} has been updated.` });
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !inventoryUrl.trim()) return;
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Competitor</DialogTitle>
          <DialogDescription>Update competitor details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dealer Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ABC Motors"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventoryUrl">Inventory URL</Label>
            <Input
              id="inventoryUrl"
              value={inventoryUrl}
              onChange={(e) => setInventoryUrl(e.target.value)}
              placeholder="https://dealer.com/used-cars"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://dealer.com"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="playwright" className="text-base">Use Playwright</Label>
              <p className="text-sm text-muted-foreground">
                Enable headless browser scraping for JS-rendered sites
              </p>
            </div>
            <Switch
              id="playwright"
              checked={usePlaywright}
              onCheckedChange={setUsePlaywright}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !name.trim() || !inventoryUrl.trim()}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
