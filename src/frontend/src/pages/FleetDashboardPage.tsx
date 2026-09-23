/**
 * FleetDashboardPage.tsx — Multi-vehicle fleet owner tracking.
 * Tier 2+ feature. Track income and expenses per vehicle across your fleet.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useActor } from "../hooks/useActor";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FleetVehicle {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  year: [] | [bigint];
  color: [] | [string];
  dateAdded: bigint;
  notes: [] | [string];
}

interface FleetExpenseEntry {
  expenseId: string;
  vehicleId: string;
  category: string;
  amount: number;
  date: bigint;
  notes: string;
}

interface FleetIncomeEntry {
  incomeId: string;
  vehicleId: string;
  platform: string;
  amount: number;
  date: bigint;
  notes: string;
}

interface FleetVehicleSummary {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  tripCount: bigint;
  expenseCount: bigint;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  profile?: UserProfile | null;
  tier?: number;
  isAdmin?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = ["Uber", "Bolt", "InDrive", "Other"];
const EXPENSE_CATEGORIES = [
  "Vehicle Maintenance",
  "Car Wash",
  "Fuel",
  "Tyre Repair",
  "Licence Disc",
  "Insurance",
  "Other",
];
const PERIODS = [
  "All Time",
  "This Week",
  "This Month",
  "This Year",
  "Custom",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(ns: bigint): string {
  return new Date(Number(ns / BigInt(1_000_000))).toLocaleDateString("en-ZA");
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function getPeriodRange(
  period: string,
  customFrom: string,
  customTo: string,
): { from: Date; to: Date } | null {
  const now = new Date();
  if (period === "This Week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { from: start, to: now };
  }
  if (period === "This Month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  if (period === "This Year") {
    return { from: new Date(now.getFullYear(), 0, 1), to: now };
  }
  if (period === "Custom" && customFrom && customTo) {
    return { from: new Date(customFrom), to: new Date(`${customTo}T23:59:59`) };
  }
  return null;
}

function inRange(
  dateNs: bigint,
  range: { from: Date; to: Date } | null,
): boolean {
  if (!range) return true;
  const d = new Date(Number(dateNs / BigInt(1_000_000)));
  return d >= range.from && d <= range.to;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyFleet({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6"
      data-ocid="fleet.empty_state"
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Truck className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2 text-center">
        Register Your First Vehicle
      </h2>
      <p className="text-muted-foreground text-sm text-center max-w-xs mb-8 leading-relaxed">
        Track income and expenses per vehicle across your fleet. Get a clear
        picture of what each car earns.
      </p>
      <Button
        onClick={onAdd}
        className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl"
        data-ocid="fleet.add_vehicle_button"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Vehicle
      </Button>
    </div>
  );
}

// ─── Add Vehicle Modal ────────────────────────────────────────────────────────

interface AddVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    plateNumber: string;
    make: string;
    model: string;
    year: string;
    color: string;
    notes: string;
  }) => void;
  loading: boolean;
}

function AddVehicleModal({
  open,
  onClose,
  onSubmit,
  loading,
}: AddVehicleModalProps) {
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setPlate("");
    setMake("");
    setModel("");
    setYear("");
    setColor("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!plate.trim() || !make.trim() || !model.trim()) {
      toast.error("Plate number, make, and model are required.");
      return;
    }
    onSubmit({
      plateNumber: plate.trim().toUpperCase(),
      make: make.trim(),
      model: model.trim(),
      year,
      color,
      notes,
    });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent
        className="bg-card border-border rounded-2xl max-w-md"
        data-ocid="fleet.add_vehicle_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" /> Register Vehicle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Plate Number *
            </Label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="e.g. CA 123-456"
              className="bg-muted border-border"
              data-ocid="fleet.plate_input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">
                Make *
              </Label>
              <Input
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Toyota"
                className="bg-muted border-border"
                data-ocid="fleet.make_input"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">
                Model *
              </Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Corolla"
                className="bg-muted border-border"
                data-ocid="fleet.model_input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">
                Year
              </Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2020"
                min={1990}
                max={2030}
                className="bg-muted border-border"
                data-ocid="fleet.year_input"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">
                Color
              </Label>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="White"
                className="bg-muted border-border"
                data-ocid="fleet.color_input"
              />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Notes
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
              className="bg-muted border-border"
              data-ocid="fleet.notes_input"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
            data-ocid="fleet.add_vehicle_cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary text-primary-foreground"
            data-ocid="fleet.add_vehicle_submit_button"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  label,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label: string;
  loading: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="bg-card border-border rounded-2xl max-w-sm"
        data-ocid="fleet.delete_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" /> Delete{" "}
            {label}
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Deleting this vehicle will also remove all its expense and income
          records. This action cannot be undone.
        </p>
        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="fleet.delete_cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            data-ocid="fleet.delete_confirm_button"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Income Modal ─────────────────────────────────────────────────────────

interface AddIncomeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    vehicleId: string;
    platform: string;
    amount: number;
    date: string;
    notes: string;
  }) => void;
  loading: boolean;
  vehicles: FleetVehicle[];
  preselectedVehicleId?: string;
}

function AddIncomeModal({
  open,
  onClose,
  onSubmit,
  loading,
  vehicles,
  preselectedVehicleId,
}: AddIncomeModalProps) {
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId ?? "");
  const [platform, setPlatform] = useState("Uber");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");

  const reset = () => {
    setVehicleId(preselectedVehicleId ?? "");
    setPlatform("Uber");
    setAmount("");
    setDate(today());
    setNotes("");
  };

  const handleSubmit = () => {
    const amt = Number.parseFloat(amount);
    if (!vehicleId) {
      toast.error("Select a vehicle.");
      return;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }
    onSubmit({ vehicleId, platform, amount: amt, date, notes });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent
        className="bg-card border-border rounded-2xl max-w-md"
        data-ocid="fleet.add_income_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Add Income
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Vehicle *
            </Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger
                className="bg-muted border-border"
                data-ocid="fleet.income_vehicle_select"
              >
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.vehicleId} value={v.vehicleId}>
                    {v.plateNumber} — {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Platform *
            </Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger
                className="bg-muted border-border"
                data-ocid="fleet.income_platform_select"
              >
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">
                Amount (R) *
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={0.01}
                step={0.01}
                className="bg-muted border-border"
                data-ocid="fleet.income_amount_input"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">
                Date *
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-muted border-border"
                data-ocid="fleet.income_date_input"
              />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Notes
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional…"
              className="bg-muted border-border"
              data-ocid="fleet.income_notes_input"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
            data-ocid="fleet.income_cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
            data-ocid="fleet.income_submit_button"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Income
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    vehicleId: string;
    category: string;
    amount: number;
    date: string;
    notes: string;
  }) => void;
  loading: boolean;
  vehicles: FleetVehicle[];
  preselectedVehicleId?: string;
}

function AddExpenseModal({
  open,
  onClose,
  onSubmit,
  loading,
  vehicles,
  preselectedVehicleId,
}: AddExpenseModalProps) {
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId ?? "");
  const [category, setCategory] = useState("Fuel");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");

  const reset = () => {
    setVehicleId(preselectedVehicleId ?? "");
    setCategory("Fuel");
    setAmount("");
    setDate(today());
    setNotes("");
  };

  const handleSubmit = () => {
    const amt = Number.parseFloat(amount);
    if (!vehicleId) {
      toast.error("Select a vehicle.");
      return;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }
    onSubmit({ vehicleId, category, amount: amt, date, notes });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent
        className="bg-card border-border rounded-2xl max-w-md"
        data-ocid="fleet.add_expense_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" /> Add Expense
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Vehicle *
            </Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger
                className="bg-muted border-border"
                data-ocid="fleet.expense_vehicle_select"
              >
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.vehicleId} value={v.vehicleId}>
                    {v.plateNumber} — {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Category *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                className="bg-muted border-border"
                data-ocid="fleet.expense_category_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">
                Amount (R) *
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={0.01}
                step={0.01}
                className="bg-muted border-border"
                data-ocid="fleet.expense_amount_input"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">
                Date *
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-muted border-border"
                data-ocid="fleet.expense_date_input"
              />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Notes
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional…"
              className="bg-muted border-border"
              data-ocid="fleet.expense_notes_input"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
            data-ocid="fleet.expense_cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            data-ocid="fleet.expense_submit_button"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Vehicle Detail Card ──────────────────────────────────────────────────────

interface VehicleDetailProps {
  vehicle: FleetVehicle;
  income: FleetIncomeEntry[];
  expenses: FleetExpenseEntry[];
  expanded: boolean;
  onToggleExpand: () => void;
  onAddIncome: (vehicleId: string) => void;
  onAddExpense: (vehicleId: string) => void;
  onDeleteIncome: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteVehicle: (vehicle: FleetVehicle) => void;
  index: number;
}

function VehicleCard({
  vehicle,
  income,
  expenses,
  expanded,
  onToggleExpand,
  onAddIncome,
  onAddExpense,
  onDeleteIncome,
  onDeleteExpense,
  onDeleteVehicle,
  index,
}: VehicleDetailProps) {
  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const yearVal = vehicle.year.length > 0 ? Number(vehicle.year[0]) : null;
  const colorVal = vehicle.color.length > 0 ? vehicle.color[0] : null;

  return (
    <Card
      className="bg-card border-border rounded-2xl overflow-hidden"
      data-ocid={`fleet.vehicle_card.${index}`}
    >
      {/* Vehicle Header */}
      <CardHeader className="pb-3 pt-4 px-5 border-b border-border/50 flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-foreground truncate">
              {vehicle.plateNumber}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {`${vehicle.make} ${vehicle.model}${yearVal ? ` · ${yearVal}` : ""}${colorVal ? ` · ${colorVal}` : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
            onClick={() => onDeleteVehicle(vehicle)}
            data-ocid={`fleet.delete_vehicle_button.${index}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 w-8 p-0"
            onClick={onToggleExpand}
            data-ocid={`fleet.expand_vehicle_button.${index}`}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Summary Row */}
      <CardContent className="px-5 py-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Income
            </p>
            <p className="font-display font-bold text-emerald-400 text-sm">
              {fmt(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Expenses
            </p>
            <p className="font-display font-bold text-red-400 text-sm">
              {fmt(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Net
            </p>
            <p
              className={`font-display font-bold text-sm ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {fmt(netProfit)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 justify-between">
          <div className="flex gap-1">
            <Badge
              variant="outline"
              className="text-[10px] border-border text-muted-foreground"
            >
              {income.length} trips
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] border-border text-muted-foreground"
            >
              {expenses.length} expenses
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary h-7 px-3"
            onClick={onToggleExpand}
          >
            {expanded ? "Hide Details" : "View Details"}
          </Button>
        </div>
      </CardContent>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-border/50 px-5 pb-5 pt-4">
          <Tabs defaultValue="income">
            <TabsList className="bg-muted/60 mb-4 w-full">
              <TabsTrigger
                value="income"
                className="flex-1 text-xs"
                data-ocid={`fleet.income_tab.${index}`}
              >
                Income ({income.length})
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="flex-1 text-xs"
                data-ocid={`fleet.expenses_tab.${index}`}
              >
                Expenses ({expenses.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="income">
              <div className="flex justify-end mb-3">
                <Button
                  size="sm"
                  onClick={() => onAddIncome(vehicle.vehicleId)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs h-8"
                  data-ocid={`fleet.add_income_open_button.${index}`}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Income
                </Button>
              </div>
              {income.length === 0 ? (
                <p
                  className="text-muted-foreground text-xs text-center py-4"
                  data-ocid={`fleet.income_empty_state.${index}`}
                >
                  No income recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {income.map((entry, i) => (
                    <div
                      key={entry.incomeId}
                      className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2 gap-2"
                      data-ocid={`fleet.income_item.${i + 1}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {entry.platform}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {fmtDate(entry.date)}
                          {entry.notes ? ` · ${entry.notes}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-emerald-400 text-xs font-bold">
                          {fmt(entry.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteIncome(entry.incomeId)}
                          data-ocid={`fleet.delete_income_button.${i + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expenses">
              <div className="flex justify-end mb-3">
                <Button
                  size="sm"
                  onClick={() => onAddExpense(vehicle.vehicleId)}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-8"
                  data-ocid={`fleet.add_expense_open_button.${index}`}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Expense
                </Button>
              </div>
              {expenses.length === 0 ? (
                <p
                  className="text-muted-foreground text-xs text-center py-4"
                  data-ocid={`fleet.expenses_empty_state.${index}`}
                >
                  No expenses recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {expenses.map((entry, i) => (
                    <div
                      key={entry.expenseId}
                      className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2 gap-2"
                      data-ocid={`fleet.expense_item.${i + 1}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {entry.category}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {fmtDate(entry.date)}
                          {entry.notes ? ` · ${entry.notes}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-red-400 text-xs font-bold">
                          {fmt(entry.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteExpense(entry.expenseId)}
                          data-ocid={`fleet.delete_expense_button.${i + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Card>
  );
}

// ─── Combined Overview Card ───────────────────────────────────────────────────

function FleetOverviewCard({
  summaries,
  vehicleCount,
}: { summaries: FleetVehicleSummary[]; vehicleCount: number }) {
  const totalIncome = summaries.reduce((s, v) => s + v.totalIncome, 0);
  const totalExpenses = summaries.reduce((s, v) => s + v.totalExpenses, 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <Card
      className="bg-card border-border rounded-2xl overflow-hidden"
      data-ocid="fleet.overview_card"
    >
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <div>
          <p className="font-display text-base font-bold text-foreground">
            Fleet Overview
          </p>
          <p className="text-xs text-muted-foreground">
            {vehicleCount} vehicle{vehicleCount !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Truck className="w-5 h-5 text-primary" />
        </div>
      </div>
      <CardContent className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-emerald-500/10 rounded-xl p-3">
            <p className="text-[10px] text-emerald-400/80 uppercase tracking-wide mb-1">
              Total Income
            </p>
            <p className="font-display font-bold text-emerald-400 text-sm leading-tight">
              {fmt(totalIncome)}
            </p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3">
            <p className="text-[10px] text-red-400/80 uppercase tracking-wide mb-1">
              Total Expenses
            </p>
            <p className="font-display font-bold text-red-400 text-sm leading-tight">
              {fmt(totalExpenses)}
            </p>
          </div>
          <div
            className={`rounded-xl p-3 ${netProfit >= 0 ? "bg-primary/10" : "bg-red-500/10"}`}
          >
            <p
              className={`text-[10px] uppercase tracking-wide mb-1 ${netProfit >= 0 ? "text-primary/80" : "text-red-400/80"}`}
            >
              Net Profit
            </p>
            <p
              className={`font-display font-bold text-sm leading-tight ${netProfit >= 0 ? "text-primary" : "text-red-400"}`}
            >
              {fmt(netProfit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FleetDashboardPage(_props: Props) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  // UI state
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addIncomeOpen, setAddIncomeOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [deleteVehicleTarget, setDeleteVehicleTarget] =
    useState<FleetVehicle | null>(null);
  const [incomeVehicleId, setIncomeVehicleId] = useState("");
  const [expenseVehicleId, setExpenseVehicleId] = useState("");
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [period, setPeriod] = useState<string>("All Time");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<
    FleetVehicle[]
  >({
    queryKey: ["fleetVehicles"],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as { getFleetVehicles: () => Promise<FleetVehicle[]> }
      ).getFleetVehicles();
    },
    enabled: !!actor,
  });

  const { data: allIncome = [] } = useQuery<FleetIncomeEntry[]>({
    queryKey: ["fleetIncome"],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getFleetIncome: (v: []) => Promise<FleetIncomeEntry[]>;
        }
      ).getFleetIncome([]);
    },
    enabled: !!actor,
  });

  const { data: allExpenses = [] } = useQuery<FleetExpenseEntry[]>({
    queryKey: ["fleetExpenses"],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getFleetExpenses: (v: []) => Promise<FleetExpenseEntry[]>;
        }
      ).getFleetExpenses([]);
    },
    enabled: !!actor,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const addVehicleMut = useMutation({
    mutationFn: async (d: {
      plateNumber: string;
      make: string;
      model: string;
      year: string;
      color: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const yearOpt: [] | [bigint] = d.year ? [BigInt(d.year)] : [];
      const colorOpt: [] | [string] = d.color ? [d.color] : [];
      const notesOpt: [] | [string] = d.notes ? [d.notes] : [];
      return (
        actor as unknown as {
          addFleetVehicle: (
            p: string,
            m: string,
            mo: string,
            y: [] | [bigint],
            c: [] | [string],
            n: [] | [string],
          ) => Promise<FleetVehicle>;
        }
      ).addFleetVehicle(
        d.plateNumber,
        d.make,
        d.model,
        yearOpt,
        colorOpt,
        notesOpt,
      );
    },
    onSuccess: () => {
      toast.success("Vehicle registered!");
      queryClient.invalidateQueries({ queryKey: ["fleetVehicles"] });
      setAddVehicleOpen(false);
    },
    onError: () => toast.error("Failed to register vehicle."),
  });

  const deleteVehicleMut = useMutation({
    mutationFn: async (vehicleId: string) => {
      if (!actor) throw new Error("No actor");
      return (
        actor as unknown as {
          deleteFleetVehicle: (id: string) => Promise<void>;
        }
      ).deleteFleetVehicle(vehicleId);
    },
    onSuccess: () => {
      toast.success("Vehicle deleted.");
      queryClient.invalidateQueries({ queryKey: ["fleetVehicles"] });
      queryClient.invalidateQueries({ queryKey: ["fleetIncome"] });
      queryClient.invalidateQueries({ queryKey: ["fleetExpenses"] });
      setDeleteVehicleTarget(null);
    },
    onError: () => toast.error("Failed to delete vehicle."),
  });

  const addIncomeMut = useMutation({
    mutationFn: async (d: {
      vehicleId: string;
      platform: string;
      amount: number;
      date: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const dateNs = BigInt(new Date(d.date).getTime()) * BigInt(1_000_000);
      return (
        actor as unknown as {
          addFleetIncome: (
            vId: string,
            p: string,
            a: number,
            d: bigint,
            n: string,
          ) => Promise<FleetIncomeEntry>;
        }
      ).addFleetIncome(d.vehicleId, d.platform, d.amount, dateNs, d.notes);
    },
    onSuccess: () => {
      toast.success("Income added!");
      queryClient.invalidateQueries({ queryKey: ["fleetIncome"] });
      setAddIncomeOpen(false);
    },
    onError: () => toast.error("Failed to add income."),
  });

  const deleteIncomeMut = useMutation({
    mutationFn: async (incomeId: string) => {
      if (!actor) throw new Error("No actor");
      return (
        actor as unknown as { deleteFleetIncome: (id: string) => Promise<void> }
      ).deleteFleetIncome(incomeId);
    },
    onSuccess: () => {
      toast.success("Income entry removed.");
      queryClient.invalidateQueries({ queryKey: ["fleetIncome"] });
    },
    onError: () => toast.error("Failed to delete entry."),
  });

  const addExpenseMut = useMutation({
    mutationFn: async (d: {
      vehicleId: string;
      category: string;
      amount: number;
      date: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const dateNs = BigInt(new Date(d.date).getTime()) * BigInt(1_000_000);
      return (
        actor as unknown as {
          addFleetExpense: (
            vId: string,
            c: string,
            a: number,
            d: bigint,
            n: string,
          ) => Promise<FleetExpenseEntry>;
        }
      ).addFleetExpense(d.vehicleId, d.category, d.amount, dateNs, d.notes);
    },
    onSuccess: () => {
      toast.success("Expense added!");
      queryClient.invalidateQueries({ queryKey: ["fleetExpenses"] });
      setAddExpenseOpen(false);
    },
    onError: () => toast.error("Failed to add expense."),
  });

  const deleteExpenseMut = useMutation({
    mutationFn: async (expenseId: string) => {
      if (!actor) throw new Error("No actor");
      return (
        actor as unknown as {
          deleteFleetExpense: (id: string) => Promise<void>;
        }
      ).deleteFleetExpense(expenseId);
    },
    onSuccess: () => {
      toast.success("Expense entry removed.");
      queryClient.invalidateQueries({ queryKey: ["fleetExpenses"] });
    },
    onError: () => toast.error("Failed to delete entry."),
  });

  // ── Filtering ─────────────────────────────────────────────────────────────────

  const dateRange = getPeriodRange(period, customFrom, customTo);

  const filteredVehicles =
    selectedVehicle === "all"
      ? vehicles
      : vehicles.filter((v) => v.vehicleId === selectedVehicle);

  const incomeForVehicle = (vehicleId: string) =>
    allIncome.filter(
      (e) => e.vehicleId === vehicleId && inRange(e.date, dateRange),
    );

  const expensesForVehicle = (vehicleId: string) =>
    allExpenses.filter(
      (e) => e.vehicleId === vehicleId && inRange(e.date, dateRange),
    );

  const summaries: FleetVehicleSummary[] = vehicles.map((v) => {
    const inc = incomeForVehicle(v.vehicleId);
    const exp = expensesForVehicle(v.vehicleId);
    return {
      vehicleId: v.vehicleId,
      plateNumber: v.plateNumber,
      make: v.make,
      model: v.model,
      totalIncome: inc.reduce((s, e) => s + e.amount, 0),
      totalExpenses: exp.reduce((s, e) => s + e.amount, 0),
      netProfit:
        inc.reduce((s, e) => s + e.amount, 0) -
        exp.reduce((s, e) => s + e.amount, 0),
      tripCount: BigInt(inc.length),
      expenseCount: BigInt(exp.length),
    };
  });

  const openAddIncome = (vehicleId: string) => {
    setIncomeVehicleId(vehicleId);
    setAddIncomeOpen(true);
  };
  const openAddExpense = (vehicleId: string) => {
    setExpenseVehicleId(vehicleId);
    setAddExpenseOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-ocid="fleet.page">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-4 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Fleet Dashboard
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Track all your vehicles in one place
          </p>
        </div>
        <Button
          onClick={() => setAddVehicleOpen(true)}
          size="sm"
          className="bg-primary text-primary-foreground font-semibold rounded-xl h-9 px-4"
          data-ocid="fleet.header_add_vehicle_button"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Vehicle
        </Button>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
        {/* Empty State */}
        {vehicles.length === 0 && (
          <EmptyFleet onAdd={() => setAddVehicleOpen(true)} />
        )}

        {vehicles.length > 0 && (
          <>
            {/* Fleet Overview */}
            <FleetOverviewCard
              summaries={summaries}
              vehicleCount={vehicles.length}
            />

            {/* Filter Bar */}
            <div
              className="overflow-x-auto -mx-4 px-4"
              data-ocid="fleet.filters_bar"
            >
              <div className="flex gap-2 min-w-max pb-1">
                {/* Vehicle Filter */}
                <Select
                  value={selectedVehicle}
                  onValueChange={setSelectedVehicle}
                >
                  <SelectTrigger
                    className="bg-card border-border h-8 text-xs rounded-lg min-w-[140px]"
                    data-ocid="fleet.vehicle_filter_select"
                  >
                    <SelectValue placeholder="All Vehicles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.vehicleId} value={v.vehicleId}>
                        {v.plateNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Period Filter */}
                {PERIODS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      period === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground border border-border hover:text-foreground"
                    }`}
                    data-ocid={`fleet.period_filter.${p.toLowerCase().replace(/\s+/g, "_")}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            {period === "Custom" && (
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <Label className="text-muted-foreground text-xs mb-1 block">
                    From
                  </Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="bg-card border-border h-8 text-xs"
                    data-ocid="fleet.custom_from_input"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-muted-foreground text-xs mb-1 block">
                    To
                  </Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="bg-card border-border h-8 text-xs"
                    data-ocid="fleet.custom_to_input"
                  />
                </div>
              </div>
            )}

            {/* Vehicle Cards */}
            <div className="space-y-4">
              {filteredVehicles.map((vehicle, i) => (
                <VehicleCard
                  key={vehicle.vehicleId}
                  vehicle={vehicle}
                  income={incomeForVehicle(vehicle.vehicleId)}
                  expenses={expensesForVehicle(vehicle.vehicleId)}
                  expanded={expandedVehicle === vehicle.vehicleId}
                  onToggleExpand={() =>
                    setExpandedVehicle(
                      expandedVehicle === vehicle.vehicleId
                        ? null
                        : vehicle.vehicleId,
                    )
                  }
                  onAddIncome={openAddIncome}
                  onAddExpense={openAddExpense}
                  onDeleteIncome={(id) => deleteIncomeMut.mutate(id)}
                  onDeleteExpense={(id) => deleteExpenseMut.mutate(id)}
                  onDeleteVehicle={setDeleteVehicleTarget}
                  index={i + 1}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddVehicleModal
        open={addVehicleOpen}
        onClose={() => setAddVehicleOpen(false)}
        onSubmit={(d) => addVehicleMut.mutate(d)}
        loading={addVehicleMut.isPending}
      />

      <AddIncomeModal
        open={addIncomeOpen}
        onClose={() => setAddIncomeOpen(false)}
        onSubmit={(d) => addIncomeMut.mutate(d)}
        loading={addIncomeMut.isPending}
        vehicles={vehicles}
        preselectedVehicleId={incomeVehicleId}
      />

      <AddExpenseModal
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSubmit={(d) => addExpenseMut.mutate(d)}
        loading={addExpenseMut.isPending}
        vehicles={vehicles}
        preselectedVehicleId={expenseVehicleId}
      />

      {deleteVehicleTarget && (
        <DeleteConfirmDialog
          open={!!deleteVehicleTarget}
          onClose={() => setDeleteVehicleTarget(null)}
          onConfirm={() =>
            deleteVehicleMut.mutate(deleteVehicleTarget.vehicleId)
          }
          label={`${deleteVehicleTarget.plateNumber}`}
          loading={deleteVehicleMut.isPending}
        />
      )}
    </div>
  );
}
