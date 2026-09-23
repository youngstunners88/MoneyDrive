import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import type { Trip } from "../backend";
import { useActor } from "../hooks/useActor";
import { useOfflineQueue } from "../hooks/useOfflineQueue";

interface AddTripDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currency: string;
}

const PLATFORMS = ["Uber", "Bolt", "inDriver", "Other"];

export default function AddTripDialog({
  open,
  onOpenChange,
  currency,
}: AddTripDialogProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState("Uber");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const { isOnline, addToQueue } = useOfflineQueue();

  const mut = useMutation({
    mutationFn: async (trip: Trip) => {
      if (!actor) throw new Error("No actor");
      await actor.addTrip(trip);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["earningsTotal"] });
      toast.success("Trip logged!");
      onOpenChange(false);
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setPlatform("Uber");
    setAmount("");
    setDuration("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!amount) {
      toast.error("Please enter an amount before saving.");
      return;
    }
    const parsedAmount = Number.parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    const trip: Trip = {
      tripId: crypto.randomUUID(),
      platform,
      amount: parsedAmount,
      durationMinutes: BigInt(Number.parseInt(duration || "0")),
      date: BigInt(Date.now()),
      notes,
    };

    if (!isOnline) {
      await addToQueue("trip", trip);
      toast.info("Saved offline — will sync when connected", {
        duration: 5000,
      });
      onOpenChange(false);
      resetForm();
      return;
    }

    mut.mutate(trip);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Log Trip</DialogTitle>
          <p className="text-xs text-muted-foreground pt-1">
            ⏱ Trip time is automatically recorded when you submit.
          </p>
          {!isOnline && (
            <p
              className="text-xs font-semibold rounded-lg px-3 py-1.5 mt-1"
              style={{
                background: "oklch(0.60 0.22 35 / 0.15)",
                color: "oklch(0.60 0.22 35)",
              }}
              data-ocid="add_trip.offline.notice"
            >
              📵 You're offline — this trip will be saved locally and synced
              when you reconnect.
            </p>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount ({currency})</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="150.00"
              className="mt-1"
              required
              data-ocid="add_trip.amount.input"
            />
          </div>
          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="25"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!amount || !platform || mut.isPending}
            data-ocid="add_trip.submit_button"
          >
            {mut.isPending
              ? "Saving..."
              : isOnline
                ? "Log Trip"
                : "Save Offline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
