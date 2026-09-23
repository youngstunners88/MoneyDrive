import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ExpenseEntry } from "../../backend";
import { useActor } from "../../shared/hooks/useActor";

// SECURITY FIX MEDIUM-001: validate numeric and string fields before sending to backend
function validatePositiveNumber(
  value: unknown,
  fieldName: string,
  max: number,
): number {
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num) || num <= 0 || num > max) {
    throw new Error(
      `Invalid ${fieldName}: must be a positive number not exceeding ${max}`,
    );
  }
  return num;
}

function validateNotes(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Invalid notes: must be a non-empty string");
  }
  if (value.length > 200) {
    throw new Error("Invalid notes: must not exceed 200 characters");
  }
  return value.trim();
}

export function useExpenses() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => actor!.getExpenses(),
    enabled: !!actor,
  });

  const addMut = useMutation({
    mutationFn: (ex: ExpenseEntry) => {
      // Validate fields before calling backend
      const amount = validatePositiveNumber(ex.amount, "amount", 100000);
      const notes = validateNotes(ex.notes);
      return actor!.addExpense({ ...ex, amount, notes });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => actor!.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense removed");
    },
    onError: () => toast.error("Failed to remove expense"),
  });

  return {
    expenses: expenses ?? [],
    addExpense: addMut.mutate,
    isAdding: addMut.isPending,
    deleteExpense: deleteMut.mutate,
    isDeleting: deleteMut.isPending,
  };
}
