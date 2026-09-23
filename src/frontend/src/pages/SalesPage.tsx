import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Camera,
  ChevronDown,
  ChevronUp,
  Droplets,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product, Sale, UserProfile } from "../backend";
import { useActor } from "../hooks/useActor";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useOfflineQueue } from "../hooks/useOfflineQueue";

// Extended actor type to include newly-added backend methods
interface ActorWithDeleteOps {
  deleteProduct(productId: string): Promise<void>;
  deleteSale(saleId: string): Promise<void>;
}

interface SalesPageProps {
  profile: UserProfile | null | undefined;
  tier: number;
}

/** Default in-car products — shown as a guide/starter template */
const DEFAULT_PRODUCTS = [
  {
    id: "default-wifi",
    name: "In-Car WiFi",
    price: "R5",
    desc: "Get Rain or a similar unlimited data plan (~R250/month). Charge passengers R5 per trip — cover your plan cost in 50 trips and earn passive income on every ride after that. Put a QR code on your dashboard so passengers connect instantly.",
    icon: <Wifi className="w-4 h-4" />,
    category: "essential",
  },
  {
    id: "default-water",
    name: "Premium Water",
    price: "R15",
    desc: "You offer hydration — passengers pay a premium for comfort. Stock up in bulk and turn R3 cost into R15 revenue per bottle. Five-star service creates five-star reviews.",
    icon: <Droplets className="w-4 h-4" />,
    category: "essential",
  },
  {
    id: "default-candy",
    name: "Mints & Candy",
    price: "R2 – R5",
    desc: "You keep the good vibe going. Small treats earn 5-star reviews and repeat rides. Stock cheap, price at R2–R5 each — and turn a R100 bag into R400+ revenue.",
    icon: <Sparkles className="w-4 h-4" />,
    category: "essential",
  },
  {
    id: "default-perfume",
    name: "Freshness Shot",
    price: "R10",
    desc: "You keep your car smelling premium. A quick spritz of your signature scent makes every ride memorable — and passengers pay R10 for that experience. Buy a R150 bottle, earn it back in 15 trips.",
    icon: <Star className="w-4 h-4" />,
    category: "essential",
  },
  {
    id: "default-wetwipes",
    name: "Wet Wipes",
    price: "R5",
    desc: "Refreshing wet wipes for your journey. A small touch that passengers love — stock up cheap and offer freshness on demand. Keeps your rating high and passengers comfortable.",
    icon: <span className="text-sm">🧻</span>,
    category: "essential",
  },
  {
    id: "default-powerbank",
    name: "PowerBank Charging",
    price: "R5 – R10",
    desc: "Charge your phone on the go. Passengers with dead batteries are your most grateful customers — one charge can earn you R5–R10 and a 5-star review. Invest in one powerbank, earn it back in days.",
    icon: <span className="text-sm">🔋</span>,
    category: "essential",
  },
  {
    id: "default-firstaid",
    name: "First Aid",
    price: "R15",
    desc: "Basic first aid supplies on hand for emergencies. A small kit shows passengers you're a professional who cares — and can command a premium service fee when needed.",
    icon: <span className="text-sm">🩹</span>,
    category: "essential",
  },
  {
    id: "default-towel",
    name: "Towel",
    price: "R10",
    desc: "Clean towel for freshening up. Airport runs, gym trips, beach transfers — a fresh towel is worth R10 to any passenger who needs it. Simple add-on, zero effort.",
    icon: <span className="text-sm">🏖️</span>,
    category: "essential",
  },
  {
    id: "default-dashcam",
    name: "Dashcam Live Show",
    price: "Custom / Contact Driver",
    desc: "You are the content. Go live on Facebook, Instagram, TikTok, YouTube, or X.com directly from your dashboard. Build an audience, grow a brand, and unlock sponsorship and ad revenue on top of your ride earnings.",
    icon: <Camera className="w-4 h-4" />,
    category: "premium",
  },
  {
    id: "default-analytics",
    name: "Car Advertising Analytics",
    price: "R10 – R50,000/month",
    desc: "Nduna tracks your car's daily exposure over time and builds your advertising business case. You can show major corporations exactly how many eyes see your vehicle every day — and close R10–R50k/month sponsorship deals.",
    icon: <Package className="w-4 h-4" />,
    category: "premium",
  },
];

export default function SalesPage({ profile }: SalesPageProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [addProductOpen, setAddProductOpen] = useState(false);

  // Infer driver's primary platform from most recent trips
  const { data: trips } = useQuery({
    queryKey: ["trips"],
    queryFn: () => actor!.getTrips(),
    enabled: !!actor,
  });

  const primaryPlatform = (() => {
    if (!trips || trips.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const t of trips) {
      counts[t.platform] = (counts[t.platform] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })();
  const isBoltDriver = primaryPlatform?.toLowerCase() === "bolt";
  const [editProduct, setEditProduct] = useState<Product | undefined>(
    undefined,
  );
  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [showDefaultProducts, setShowDefaultProducts] = useState(true);
  const currency = profile?.currencyCode ?? "ZAR";

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

  const deleteProductMut = useMutation({
    mutationFn: (productId: string) =>
      (actor as unknown as ActorWithDeleteOps).deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["lowStock"] });
      setProductToDelete(null);
      toast.success("Product deleted");
    },
    onError: () => {
      setProductToDelete(null);
      toast.error("Failed to delete product");
    },
  });

  const deleteSaleMut = useMutation({
    mutationFn: (saleId: string) =>
      (actor as unknown as ActorWithDeleteOps).deleteSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setSaleToDelete(null);
      toast.success("Sale removed");
    },
    onError: () => {
      setSaleToDelete(null);
      toast.error("Failed to remove sale");
    },
  });

  const addDefaultProduct = async (item: (typeof DEFAULT_PRODUCTS)[0]) => {
    if (!actor) return;
    try {
      // Parse a sensible price — use the lower bound for ranges
      const priceStr = item.price.replace(/[^0-9.]/g, "");
      const price = Number.parseFloat(priceStr) || 10;
      await actor.addOrUpdateProduct({
        productId: `default-${item.id}-${Date.now()}`,
        name: item.name,
        sellingPrice: price,
        currentStock: BigInt(50),
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["lowStock"] });
      toast.success(`"${item.name}" added to your menu`);
    } catch {
      toast.error("Failed to add product");
    }
  };

  const totalRevenue = (sales ?? []).reduce(
    (s, sale) => s + sale.totalAmount,
    0,
  );
  const totalUnits = (sales ?? []).reduce(
    (s, sale) => s + Number(sale.quantity),
    0,
  );
  const sortedSales = [...(sales ?? [])].sort(
    (a, b) => Number(b.date) - Number(a.date),
  );

  const existingNames = new Set(
    (products ?? []).map((p) => p.name.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">In-Car Sales</h1>
          <p className="text-muted-foreground text-sm">
            Track products sold to passengers
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditProduct(undefined);
              setAddProductOpen(true);
            }}
            className="gap-2"
            data-ocid="sales.add_product.button"
          >
            <Package className="w-4 h-4" /> Product
          </Button>
          <Button
            onClick={() => setAddSaleOpen(true)}
            className="gap-2"
            data-ocid="sales.add_sale.button"
          >
            <Plus className="w-4 h-4" /> Log Sale
          </Button>
        </div>
      </div>

      {isBoltDriver && (
        <div
          className="rounded-xl border border-amber-400/50 bg-amber-50 p-3 mb-4 flex items-start gap-3"
          data-ocid="sales.bolt_restriction.notice"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong>Bolt drivers:</strong> In-car sales are only permitted after
            trips have ended, not during an active trip. Selling during a trip
            may violate Bolt's policies.
          </p>
        </div>
      )}

      {lowStock && lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">
            Low stock:{" "}
            {lowStock
              .map((p) => `${p.name} (${p.currentStock} left)`)
              .join(", ")}
          </p>
        </div>
      )}

      {!isOnline && (
        <div
          className="rounded-xl border border-primary/40 bg-primary/10 p-3 mb-4 flex items-center gap-2"
          data-ocid="sales.offline.notice"
        >
          <WifiOff className="w-4 h-4 shrink-0 text-primary" />
          <p className="text-sm font-semibold text-primary">
            You're offline — orders will be saved locally until you reconnect.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">
              Total Revenue
            </p>
            <p className="text-2xl font-display font-bold mt-1">
              {currency} {totalRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">
              Units Sold
            </p>
            <p className="text-2xl font-display font-bold mt-1">{totalUnits}</p>
          </CardContent>
        </Card>
      </div>

      {/* DEFAULT PRODUCTS SECTION */}
      <Card className="shadow-card mb-6">
        <CardHeader className="pb-2">
          <button
            type="button"
            onClick={() => setShowDefaultProducts((v) => !v)}
            className="flex items-center justify-between w-full text-left"
            data-ocid="sales.default_products.toggle"
          >
            <CardTitle className="font-display text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              In-Car Product Ideas
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                10 products
              </Badge>
            </CardTitle>
            {showDefaultProducts ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <p className="text-xs text-muted-foreground mt-0.5">
            Proven in-car products that help drivers earn more. Tap "Add to
            Menu" to include any on your passenger QR menu.
          </p>
        </CardHeader>

        {showDefaultProducts && (
          <CardContent>
            <div className="space-y-3">
              {DEFAULT_PRODUCTS.map((item) => {
                const alreadyAdded = existingNames.has(item.name.toLowerCase());
                const isPremium = item.category === "premium";
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 flex items-start gap-3 ${
                      isPremium
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-card"
                    }`}
                    data-ocid={`sales.default_product.${item.id}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isPremium
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">
                          {item.name}
                        </p>
                        {isPremium && (
                          <Badge className="bg-primary/15 text-primary border-primary/25 text-[9px] px-1.5 py-0 font-bold">
                            PREMIUM
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-bold text-primary mt-0.5">
                        {item.price}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {alreadyAdded ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] whitespace-nowrap"
                        >
                          ✓ On Menu
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2 whitespace-nowrap"
                          onClick={() => addDefaultProduct(item)}
                          data-ocid={`sales.default_product.add_button.${item.id}`}
                        >
                          + Add to Menu
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* INVENTORY + SALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> My Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (products ?? []).length === 0 ? (
              <div
                className="text-center py-6"
                data-ocid="sales.products.empty_state"
              >
                <p className="text-muted-foreground text-sm">
                  No products yet. Use "Add to Menu" above to get started
                  quickly.
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setEditProduct(undefined);
                    setAddProductOpen(true);
                  }}
                >
                  Add Custom Product
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(products ?? []).map((p, idx) => (
                  <div
                    key={p.productId}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    data-ocid={`sales.products.item.${idx + 1}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {currency} {p.sellingPrice.toFixed(2)}/unit
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={
                          Number(p.currentStock) < 5
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }
                      >
                        {Number(p.currentStock)} left
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setEditProduct(p);
                          setAddProductOpen(true);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-primary transition-colors text-xs"
                        aria-label="Edit product"
                        data-ocid={`sales.products.edit_button.${idx + 1}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductToDelete(p)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete product"
                        data-ocid={`sales.products.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" /> Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : sortedSales.length === 0 ? (
              <div
                className="text-center py-6"
                data-ocid="sales.sales.empty_state"
              >
                <p className="text-muted-foreground text-sm">No sales yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedSales.map((s, idx) => (
                  <div
                    key={s.saleId}
                    className="flex items-center justify-between py-2.5"
                    data-ocid={`sales.sales.item.${idx + 1}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{s.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        x{Number(s.quantity)} •{" "}
                        {new Date(Number(s.date)).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {currency} {s.totalAmount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSaleToDelete(s)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete sale"
                        data-ocid={`sales.sales.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddProductDialog
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        currency={currency}
        editProduct={editProduct}
      />
      <AddSaleDialog
        open={addSaleOpen}
        onOpenChange={setAddSaleOpen}
        products={products ?? []}
        currency={currency}
      />

      {/* SA notices */}
      <div className="mt-4 rounded-xl bg-muted/40 border border-border p-3 text-center">
        <p className="text-[11px] text-muted-foreground">
          <strong>FAIS:</strong> Not financial advice. <strong>POPIA:</strong>{" "}
          Your data is protected under POPIA.
        </p>
      </div>

      {/* Delete product confirmation */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null);
        }}
      >
        <AlertDialogContent data-ocid="sales.delete_product.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{productToDelete?.name}" will be permanently removed from your
              inventory. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="sales.delete_product.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                productToDelete &&
                deleteProductMut.mutate(productToDelete.productId)
              }
              data-ocid="sales.delete_product.confirm_button"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete sale confirmation */}
      <AlertDialog
        open={!!saleToDelete}
        onOpenChange={(open) => {
          if (!open) setSaleToDelete(null);
        }}
      >
        <AlertDialogContent data-ocid="sales.delete_sale.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This sale record will be permanently removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="sales.delete_sale.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                saleToDelete && deleteSaleMut.mutate(saleToDelete.saleId)
              }
              data-ocid="sales.delete_sale.confirm_button"
            >
              Remove Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddProductDialog({
  open,
  onOpenChange,
  currency,
  editProduct,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currency: string;
  editProduct?: Product;
}) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState(editProduct?.name ?? "");
  const [price, setPrice] = useState(
    editProduct ? String(editProduct.sellingPrice) : "",
  );
  const [stock, setStock] = useState(
    editProduct ? String(Number(editProduct.currentStock)) : "",
  );
  const [priceError, setPriceError] = useState("");
  const [stockError, setStockError] = useState("");

  const isEdit = !!editProduct;

  const mut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addOrUpdateProduct({
        productId: editProduct ? editProduct.productId : crypto.randomUUID(),
        name,
        sellingPrice: Number.parseFloat(price),
        currentStock: BigInt(Number.parseInt(stock)),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["lowStock"] });
      toast.success(isEdit ? "Product updated" : "Product added");
      onOpenChange(false);
      setName("");
      setPrice("");
      setStock("");
      setPriceError("");
      setStockError("");
    },
    onError: () => toast.error("Failed to save product"),
  });

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(editProduct?.name ?? "");
      setPrice(editProduct ? String(editProduct.sellingPrice) : "");
      setStock(editProduct ? String(Number(editProduct.currentStock)) : "");
      setPriceError("");
      setStockError("");
    }
    onOpenChange(v);
  };

  const handleSubmit = () => {
    let valid = true;
    const priceNum = Number.parseFloat(price);
    const stockNum = Number.parseInt(stock);

    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setPriceError("Price must be greater than 0");
      valid = false;
    } else {
      setPriceError("");
    }

    if (!stock || Number.isNaN(stockNum) || stockNum < 1) {
      setStockError("Stock must be at least 1");
      valid = false;
    } else {
      setStockError("");
    }

    if (!valid) return;
    mut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Product Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Water bottle"
              className="mt-1"
              data-ocid="sales.product_form.name.input"
            />
          </div>
          <div>
            <Label>Selling Price ({currency})</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (priceError) setPriceError("");
              }}
              placeholder="15.00"
              className={`mt-1 ${priceError ? "border-destructive" : ""}`}
              data-ocid="sales.product_form.price.input"
            />
            {priceError && (
              <p
                className="text-xs text-destructive mt-1"
                data-ocid="sales.product_form.price.field_error"
              >
                {priceError}
              </p>
            )}
          </div>
          <div>
            <Label>Stock Quantity</Label>
            <Input
              type="number"
              min="1"
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
                if (stockError) setStockError("");
              }}
              placeholder="20"
              className={`mt-1 ${stockError ? "border-destructive" : ""}`}
              data-ocid="sales.product_form.stock.input"
            />
            {stockError && (
              <p
                className="text-xs text-destructive mt-1"
                data-ocid="sales.product_form.stock.field_error"
              >
                {stockError}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!name || mut.isPending}
            data-ocid="sales.product_form.submit_button"
          >
            {mut.isPending
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSaleDialog({
  open,
  onOpenChange,
  products,
  currency,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: Product[];
  currency: string;
}) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");

  const selectedProduct = products.find((p) => p.productId === productId);
  const maxStock = Number(selectedProduct?.currentStock ?? 999);
  const total = selectedProduct
    ? selectedProduct.sellingPrice * Number.parseInt(qty || "1")
    : 0;

  // Offline queue — processor replays saved sales when back online
  const { isOnline, addToQueue } = useOfflineQueue(async (item) => {
    if (item.type !== "sale") return;
    const d = item.data as {
      sale: {
        saleId: string;
        productName: string;
        quantity: number;
        totalAmount: number;
        date: number;
      };
      product: Product;
      newStock: number;
    };
    if (!actor) return;
    await actor.addSale({
      ...d.sale,
      quantity: BigInt(d.sale.quantity),
      date: BigInt(d.sale.date),
    });
    await actor.addOrUpdateProduct({
      ...d.product,
      currentStock: BigInt(Math.max(0, d.newStock)),
    });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["lowStock"] });
  });

  const mut = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Missing data");
      const qtyNum = Number.parseInt(qty);
      if (qtyNum > maxStock) {
        throw new Error(
          `Only ${maxStock} unit${maxStock !== 1 ? "s" : ""} in stock`,
        );
      }
      const newStock = Math.max(
        0,
        Number(selectedProduct.currentStock) - qtyNum,
      );
      const salePayload = {
        saleId: crypto.randomUUID(),
        productName: selectedProduct.name,
        quantity: qtyNum,
        totalAmount: total,
        date: Date.now(),
      };

      if (!isOnline) {
        // Save to IndexedDB for later sync
        await addToQueue("sale", {
          sale: salePayload,
          product: selectedProduct,
          newStock,
        });
        toast.success("Sale saved offline — will sync when connected");
        return;
      }

      if (!actor) throw new Error("Not connected");
      await actor.addSale({
        ...salePayload,
        quantity: BigInt(qtyNum),
        date: BigInt(salePayload.date),
      });
      // Decrement stock
      await actor.addOrUpdateProduct({
        ...selectedProduct,
        currentStock: BigInt(newStock),
      });
    },
    onSuccess: () => {
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ["sales"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["lowStock"] });
        toast.success("Sale logged");
      }
      onOpenChange(false);
      setProductId("");
      setQty("1");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to log sale"),
  });

  const handleSubmit = () => {
    const qtyNum = Number.parseInt(qty);
    if (qtyNum > maxStock) {
      toast.error(`Only ${maxStock} unit${maxStock !== 1 ? "s" : ""} in stock`);
      return;
    }
    mut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Log Sale</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger
                className="mt-1"
                data-ocid="sales.sale_form.product.select"
              >
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((p) => Number(p.currentStock) > 0)
                  .map((p) => (
                    <SelectItem key={p.productId} value={p.productId}>
                      {p.name} ({currency} {p.sellingPrice.toFixed(2)}) —{" "}
                      {Number(p.currentStock)} left
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              max={maxStock}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="mt-1"
              data-ocid="sales.sale_form.quantity.input"
            />
            {selectedProduct && (
              <p className="text-xs text-muted-foreground mt-1">
                {maxStock} in stock
              </p>
            )}
          </div>
          {selectedProduct && (
            <p className="text-sm font-semibold">
              Total: {currency} {total.toFixed(2)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!productId || mut.isPending}
            data-ocid="sales.sale_form.submit_button"
          >
            {mut.isPending ? "Saving..." : "Log Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
