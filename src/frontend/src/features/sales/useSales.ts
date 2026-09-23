import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Product, Sale } from "../../backend";
import { useActor } from "../../shared/hooks/useActor";

interface ActorWithSalesOps {
  deleteProduct(productId: string): Promise<void>;
  deleteSale(saleId: string): Promise<void>;
}

function validatePositiveNumber(
  value: unknown,
  fieldName: string,
  max: number,
): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > max) {
    throw new Error(
      `Invalid ${fieldName}: must be a positive number not exceeding ${max}`,
    );
  }
  return num;
}

export function useSales() {
  const { actor } = useActor();
  const extActor = actor as (typeof actor & ActorWithSalesOps) | null;
  const qc = useQueryClient();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor,
  });

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => actor!.getSales(),
    enabled: !!actor,
  });

  const { data: lowStock } = useQuery({
    queryKey: ["lowStock"],
    queryFn: () => actor!.getLowStockProducts(),
    enabled: !!actor,
  });

  const saveProductMut = useMutation({
    mutationFn: (p: Product) => {
      validatePositiveNumber(p.sellingPrice, "sellingPrice", 10000);
      return actor!.addOrUpdateProduct(p);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["lowStock"] });
      toast.success("Product saved");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save product"),
  });

  const deleteProductMut = useMutation({
    mutationFn: (productId: string) => extActor!.deleteProduct(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["lowStock"] });
      toast.success("Product deleted");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const logSaleMut = useMutation({
    mutationFn: (s: Sale) => {
      validatePositiveNumber(s.totalAmount, "totalAmount", 100000);
      validatePositiveNumber(s.quantity, "quantity", 10000);
      if (!Number.isInteger(Number(s.quantity))) {
        throw new Error("Invalid quantity: must be a whole number");
      }
      return actor!.addSale(s);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["lowStock"] });
      toast.success("Sale logged");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to log sale"),
  });

  const deleteSaleMut = useMutation({
    mutationFn: (saleId: string) => extActor!.deleteSale(saleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Sale removed");
    },
    onError: () => toast.error("Failed to remove sale"),
  });

  return {
    products: products ?? [],
    productsLoading,
    sales: sales ?? [],
    salesLoading,
    lowStock: lowStock ?? [],
    saveProduct: saveProductMut.mutate,
    isSavingProduct: saveProductMut.isPending,
    deleteProduct: deleteProductMut.mutate,
    isDeletingProduct: deleteProductMut.isPending,
    logSale: logSaleMut.mutate,
    isLoggingSale: logSaleMut.isPending,
    deleteSale: deleteSaleMut.mutate,
    isDeletingSale: deleteSaleMut.isPending,
  };
}
