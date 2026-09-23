import { c as createLucideIcon, u as useActor, n as useQueryClient, r as reactExports, m as useQuery, o as useMutation, j as jsxRuntimeExports, L as LoaderCircle, B as Button, aG as Plus, ah as Select, ai as SelectTrigger, aj as SelectValue, ak as SelectContent, al as SelectItem, F as Label, I as Input, p as ue, v as Card, E as CardContent, x as CardHeader, aH as Car, T as Trash2, D as ChevronUp, s as ChevronDown, i as Badge, au as Dialog, av as DialogContent, aw as DialogHeader, ax as DialogTitle, ay as DialogFooter, aI as TrendingUp, aJ as TrendingDown, af as TriangleAlert } from "./index-C-RLbQrs.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-DUCUk98S.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2", key: "wrbu53" }],
  ["path", { d: "M15 18H9", key: "1lyqi6" }],
  [
    "path",
    {
      d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
      key: "lysw3i"
    }
  ],
  ["circle", { cx: "17", cy: "18", r: "2", key: "332jqn" }],
  ["circle", { cx: "7", cy: "18", r: "2", key: "19iecd" }]
];
const Truck = createLucideIcon("truck", __iconNode);
const PLATFORMS = ["Uber", "Bolt", "InDrive", "Other"];
const EXPENSE_CATEGORIES = [
  "Vehicle Maintenance",
  "Car Wash",
  "Fuel",
  "Tyre Repair",
  "Licence Disc",
  "Insurance",
  "Other"
];
const PERIODS = [
  "All Time",
  "This Week",
  "This Month",
  "This Year",
  "Custom"
];
function fmt(amount) {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(ns) {
  return new Date(Number(ns / BigInt(1e6))).toLocaleDateString("en-ZA");
}
function today() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
function getPeriodRange(period, customFrom, customTo) {
  const now = /* @__PURE__ */ new Date();
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
    return { from: new Date(customFrom), to: /* @__PURE__ */ new Date(`${customTo}T23:59:59`) };
  }
  return null;
}
function inRange(dateNs, range) {
  if (!range) return true;
  const d = new Date(Number(dateNs / BigInt(1e6)));
  return d >= range.from && d <= range.to;
}
function EmptyFleet({ onAdd }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col items-center justify-center min-h-[60vh] px-6",
      "data-ocid": "fleet.empty_state",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "w-10 h-10 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-bold text-foreground mb-2 text-center", children: "Register Your First Vehicle" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm text-center max-w-xs mb-8 leading-relaxed", children: "Track income and expenses per vehicle across your fleet. Get a clear picture of what each car earns." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: onAdd,
            className: "bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl",
            "data-ocid": "fleet.add_vehicle_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
              "Add Vehicle"
            ]
          }
        )
      ]
    }
  );
}
function AddVehicleModal({
  open,
  onClose,
  onSubmit,
  loading
}) {
  const [plate, setPlate] = reactExports.useState("");
  const [make, setMake] = reactExports.useState("");
  const [model, setModel] = reactExports.useState("");
  const [year, setYear] = reactExports.useState("");
  const [color, setColor] = reactExports.useState("");
  const [notes, setNotes] = reactExports.useState("");
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
      ue.error("Plate number, make, and model are required.");
      return;
    }
    onSubmit({
      plateNumber: plate.trim().toUpperCase(),
      make: make.trim(),
      model: model.trim(),
      year,
      color,
      notes
    });
    reset();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Dialog,
    {
      open,
      onOpenChange: (v) => {
        if (!v) {
          reset();
          onClose();
        }
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        DialogContent,
        {
          className: "bg-card border-border rounded-2xl max-w-md",
          "data-ocid": "fleet.add_vehicle_dialog",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "font-display text-lg font-bold text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "w-5 h-5 text-primary" }),
              " Register Vehicle"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Plate Number *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: plate,
                    onChange: (e) => setPlate(e.target.value),
                    placeholder: "e.g. CA 123-456",
                    className: "bg-muted border-border",
                    "data-ocid": "fleet.plate_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Make *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: make,
                      onChange: (e) => setMake(e.target.value),
                      placeholder: "Toyota",
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.make_input"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Model *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: model,
                      onChange: (e) => setModel(e.target.value),
                      placeholder: "Corolla",
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.model_input"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Year" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      value: year,
                      onChange: (e) => setYear(e.target.value),
                      placeholder: "2020",
                      min: 1990,
                      max: 2030,
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.year_input"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Color" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: color,
                      onChange: (e) => setColor(e.target.value),
                      placeholder: "White",
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.color_input"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Notes" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: notes,
                    onChange: (e) => setNotes(e.target.value),
                    placeholder: "Optional notes…",
                    className: "bg-muted border-border",
                    "data-ocid": "fleet.notes_input"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 mt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  onClick: () => {
                    reset();
                    onClose();
                  },
                  "data-ocid": "fleet.add_vehicle_cancel_button",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  onClick: handleSubmit,
                  disabled: loading,
                  className: "bg-primary text-primary-foreground",
                  "data-ocid": "fleet.add_vehicle_submit_button",
                  children: [
                    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin mr-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                    "Register"
                  ]
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  label,
  loading
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Dialog,
    {
      open,
      onOpenChange: (v) => {
        if (!v) onClose();
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        DialogContent,
        {
          className: "bg-card border-border rounded-2xl max-w-sm",
          "data-ocid": "fleet.delete_dialog",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "font-display text-lg font-bold text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-5 h-5 text-destructive" }),
              " Delete",
              " ",
              label
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm leading-relaxed", children: "Deleting this vehicle will also remove all its expense and income records. This action cannot be undone." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 mt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  onClick: onClose,
                  "data-ocid": "fleet.delete_cancel_button",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "destructive",
                  onClick: onConfirm,
                  disabled: loading,
                  "data-ocid": "fleet.delete_confirm_button",
                  children: [
                    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin mr-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                    "Delete"
                  ]
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function AddIncomeModal({
  open,
  onClose,
  onSubmit,
  loading,
  vehicles,
  preselectedVehicleId
}) {
  const [vehicleId, setVehicleId] = reactExports.useState(preselectedVehicleId ?? "");
  const [platform, setPlatform] = reactExports.useState("Uber");
  const [amount, setAmount] = reactExports.useState("");
  const [date, setDate] = reactExports.useState(today());
  const [notes, setNotes] = reactExports.useState("");
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
      ue.error("Select a vehicle.");
      return;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      ue.error("Amount must be greater than zero.");
      return;
    }
    onSubmit({ vehicleId, platform, amount: amt, date, notes });
    reset();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Dialog,
    {
      open,
      onOpenChange: (v) => {
        if (!v) {
          reset();
          onClose();
        }
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        DialogContent,
        {
          className: "bg-card border-border rounded-2xl max-w-md",
          "data-ocid": "fleet.add_income_dialog",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "font-display text-lg font-bold text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-5 h-5 text-emerald-400" }),
              " Add Income"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Vehicle *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: vehicleId, onValueChange: setVehicleId, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.income_vehicle_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select vehicle" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: vehicles.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: v.vehicleId, children: [
                    v.plateNumber,
                    " — ",
                    v.make,
                    " ",
                    v.model
                  ] }, v.vehicleId)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Platform *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: platform, onValueChange: setPlatform, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.income_platform_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PLATFORMS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p, children: p }, p)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Amount (R) *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      value: amount,
                      onChange: (e) => setAmount(e.target.value),
                      placeholder: "0.00",
                      min: 0.01,
                      step: 0.01,
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.income_amount_input"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Date *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "date",
                      value: date,
                      onChange: (e) => setDate(e.target.value),
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.income_date_input"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Notes" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: notes,
                    onChange: (e) => setNotes(e.target.value),
                    placeholder: "Optional…",
                    className: "bg-muted border-border",
                    "data-ocid": "fleet.income_notes_input"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 mt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  onClick: () => {
                    reset();
                    onClose();
                  },
                  "data-ocid": "fleet.income_cancel_button",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  onClick: handleSubmit,
                  disabled: loading,
                  className: "bg-emerald-600 hover:bg-emerald-500 text-white",
                  "data-ocid": "fleet.income_submit_button",
                  children: [
                    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin mr-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                    "Add Income"
                  ]
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function AddExpenseModal({
  open,
  onClose,
  onSubmit,
  loading,
  vehicles,
  preselectedVehicleId
}) {
  const [vehicleId, setVehicleId] = reactExports.useState(preselectedVehicleId ?? "");
  const [category, setCategory] = reactExports.useState("Fuel");
  const [amount, setAmount] = reactExports.useState("");
  const [date, setDate] = reactExports.useState(today());
  const [notes, setNotes] = reactExports.useState("");
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
      ue.error("Select a vehicle.");
      return;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      ue.error("Amount must be greater than zero.");
      return;
    }
    onSubmit({ vehicleId, category, amount: amt, date, notes });
    reset();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Dialog,
    {
      open,
      onOpenChange: (v) => {
        if (!v) {
          reset();
          onClose();
        }
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        DialogContent,
        {
          className: "bg-card border-border rounded-2xl max-w-md",
          "data-ocid": "fleet.add_expense_dialog",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "font-display text-lg font-bold text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "w-5 h-5 text-red-400" }),
              " Add Expense"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Vehicle *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: vehicleId, onValueChange: setVehicleId, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.expense_vehicle_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select vehicle" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: vehicles.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: v.vehicleId, children: [
                    v.plateNumber,
                    " — ",
                    v.make,
                    " ",
                    v.model
                  ] }, v.vehicleId)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Category *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: category, onValueChange: setCategory, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.expense_category_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: EXPENSE_CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, c)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Amount (R) *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      value: amount,
                      onChange: (e) => setAmount(e.target.value),
                      placeholder: "0.00",
                      min: 0.01,
                      step: 0.01,
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.expense_amount_input"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Date *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "date",
                      value: date,
                      onChange: (e) => setDate(e.target.value),
                      className: "bg-muted border-border",
                      "data-ocid": "fleet.expense_date_input"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "Notes" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: notes,
                    onChange: (e) => setNotes(e.target.value),
                    placeholder: "Optional…",
                    className: "bg-muted border-border",
                    "data-ocid": "fleet.expense_notes_input"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 mt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  onClick: () => {
                    reset();
                    onClose();
                  },
                  "data-ocid": "fleet.expense_cancel_button",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  onClick: handleSubmit,
                  disabled: loading,
                  className: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                  "data-ocid": "fleet.expense_submit_button",
                  children: [
                    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin mr-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                    "Add Expense"
                  ]
                }
              )
            ] })
          ]
        }
      )
    }
  );
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
  index
}) {
  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const yearVal = vehicle.year.length > 0 ? Number(vehicle.year[0]) : null;
  const colorVal = vehicle.color.length > 0 ? vehicle.color[0] : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: "bg-card border-border rounded-2xl overflow-hidden",
      "data-ocid": `fleet.vehicle_card.${index}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3 pt-4 px-5 border-b border-border/50 flex flex-row items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "w-5 h-5 text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-base font-bold text-foreground truncate", children: vehicle.plateNumber }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate", children: `${vehicle.make} ${vehicle.model}${yearVal ? ` · ${yearVal}` : ""}${colorVal ? ` · ${colorVal}` : ""}` })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                className: "text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0",
                onClick: () => onDeleteVehicle(vehicle),
                "data-ocid": `fleet.delete_vehicle_button.${index}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                className: "text-muted-foreground h-8 w-8 p-0",
                onClick: onToggleExpand,
                "data-ocid": `fleet.expand_vehicle_button.${index}`,
                children: expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "px-5 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wide mb-1", children: "Income" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-emerald-400 text-sm", children: fmt(totalIncome) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wide mb-1", children: "Expenses" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-red-400 text-sm", children: fmt(totalExpenses) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wide mb-1", children: "Net" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  className: `font-display font-bold text-sm ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`,
                  children: fmt(netProfit)
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-3 justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Badge,
                {
                  variant: "outline",
                  className: "text-[10px] border-border text-muted-foreground",
                  children: [
                    income.length,
                    " trips"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Badge,
                {
                  variant: "outline",
                  className: "text-[10px] border-border text-muted-foreground",
                  children: [
                    expenses.length,
                    " expenses"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                className: "text-xs text-primary h-7 px-3",
                onClick: onToggleExpand,
                children: expanded ? "Hide Details" : "View Details"
              }
            )
          ] })
        ] }),
        expanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border/50 px-5 pb-5 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "income", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "bg-muted/60 mb-4 w-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TabsTrigger,
              {
                value: "income",
                className: "flex-1 text-xs",
                "data-ocid": `fleet.income_tab.${index}`,
                children: [
                  "Income (",
                  income.length,
                  ")"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TabsTrigger,
              {
                value: "expenses",
                className: "flex-1 text-xs",
                "data-ocid": `fleet.expenses_tab.${index}`,
                children: [
                  "Expenses (",
                  expenses.length,
                  ")"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "income", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "sm",
                onClick: () => onAddIncome(vehicle.vehicleId),
                className: "bg-emerald-700 hover:bg-emerald-600 text-white text-xs h-8",
                "data-ocid": `fleet.add_income_open_button.${index}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                  " Add Income"
                ]
              }
            ) }),
            income.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                className: "text-muted-foreground text-xs text-center py-4",
                "data-ocid": `fleet.income_empty_state.${index}`,
                children: "No income recorded yet."
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: income.map((entry, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2 gap-2",
                "data-ocid": `fleet.income_item.${i + 1}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground truncate", children: entry.platform }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                      fmtDate(entry.date),
                      entry.notes ? ` · ${entry.notes}` : ""
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-400 text-xs font-bold", children: fmt(entry.amount) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        className: "h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10",
                        onClick: () => onDeleteIncome(entry.incomeId),
                        "data-ocid": `fleet.delete_income_button.${i + 1}`,
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                      }
                    )
                  ] })
                ]
              },
              entry.incomeId
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "expenses", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "sm",
                onClick: () => onAddExpense(vehicle.vehicleId),
                className: "bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-8",
                "data-ocid": `fleet.add_expense_open_button.${index}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3 mr-1" }),
                  " Add Expense"
                ]
              }
            ) }),
            expenses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                className: "text-muted-foreground text-xs text-center py-4",
                "data-ocid": `fleet.expenses_empty_state.${index}`,
                children: "No expenses recorded yet."
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: expenses.map((entry, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2 gap-2",
                "data-ocid": `fleet.expense_item.${i + 1}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground truncate", children: entry.category }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                      fmtDate(entry.date),
                      entry.notes ? ` · ${entry.notes}` : ""
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-400 text-xs font-bold", children: fmt(entry.amount) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        className: "h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10",
                        onClick: () => onDeleteExpense(entry.expenseId),
                        "data-ocid": `fleet.delete_expense_button.${i + 1}`,
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
                      }
                    )
                  ] })
                ]
              },
              entry.expenseId
            )) })
          ] })
        ] }) })
      ]
    }
  );
}
function FleetOverviewCard({
  summaries,
  vehicleCount
}) {
  const totalIncome = summaries.reduce((s, v) => s + v.totalIncome, 0);
  const totalExpenses = summaries.reduce((s, v) => s + v.totalExpenses, 0);
  const netProfit = totalIncome - totalExpenses;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: "bg-card border-border rounded-2xl overflow-hidden",
      "data-ocid": "fleet.overview_card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 border-b border-border/50 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-base font-bold text-foreground", children: "Fleet Overview" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              vehicleCount,
              " vehicle",
              vehicleCount !== 1 ? "s" : "",
              " registered"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "w-5 h-5 text-primary" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-emerald-500/10 rounded-xl p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-emerald-400/80 uppercase tracking-wide mb-1", children: "Total Income" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-emerald-400 text-sm leading-tight", children: fmt(totalIncome) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-red-500/10 rounded-xl p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-red-400/80 uppercase tracking-wide mb-1", children: "Total Expenses" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-red-400 text-sm leading-tight", children: fmt(totalExpenses) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `rounded-xl p-3 ${netProfit >= 0 ? "bg-primary/10" : "bg-red-500/10"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    className: `text-[10px] uppercase tracking-wide mb-1 ${netProfit >= 0 ? "text-primary/80" : "text-red-400/80"}`,
                    children: "Net Profit"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    className: `font-display font-bold text-sm leading-tight ${netProfit >= 0 ? "text-primary" : "text-red-400"}`,
                    children: fmt(netProfit)
                  }
                )
              ]
            }
          )
        ] }) })
      ]
    }
  );
}
function FleetDashboardPage(_props) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [addVehicleOpen, setAddVehicleOpen] = reactExports.useState(false);
  const [addIncomeOpen, setAddIncomeOpen] = reactExports.useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = reactExports.useState(false);
  const [deleteVehicleTarget, setDeleteVehicleTarget] = reactExports.useState(null);
  const [incomeVehicleId, setIncomeVehicleId] = reactExports.useState("");
  const [expenseVehicleId, setExpenseVehicleId] = reactExports.useState("");
  const [expandedVehicle, setExpandedVehicle] = reactExports.useState(null);
  const [selectedVehicle, setSelectedVehicle] = reactExports.useState("all");
  const [period, setPeriod] = reactExports.useState("All Time");
  const [customFrom, setCustomFrom] = reactExports.useState("");
  const [customTo, setCustomTo] = reactExports.useState("");
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["fleetVehicles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFleetVehicles();
    },
    enabled: !!actor
  });
  const { data: allIncome = [] } = useQuery({
    queryKey: ["fleetIncome"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFleetIncome([]);
    },
    enabled: !!actor
  });
  const { data: allExpenses = [] } = useQuery({
    queryKey: ["fleetExpenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFleetExpenses([]);
    },
    enabled: !!actor
  });
  const addVehicleMut = useMutation({
    mutationFn: async (d) => {
      if (!actor) throw new Error("No actor");
      const yearOpt = d.year ? [BigInt(d.year)] : [];
      const colorOpt = d.color ? [d.color] : [];
      const notesOpt = d.notes ? [d.notes] : [];
      return actor.addFleetVehicle(
        d.plateNumber,
        d.make,
        d.model,
        yearOpt,
        colorOpt,
        notesOpt
      );
    },
    onSuccess: () => {
      ue.success("Vehicle registered!");
      queryClient.invalidateQueries({ queryKey: ["fleetVehicles"] });
      setAddVehicleOpen(false);
    },
    onError: () => ue.error("Failed to register vehicle.")
  });
  const deleteVehicleMut = useMutation({
    mutationFn: async (vehicleId) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteFleetVehicle(vehicleId);
    },
    onSuccess: () => {
      ue.success("Vehicle deleted.");
      queryClient.invalidateQueries({ queryKey: ["fleetVehicles"] });
      queryClient.invalidateQueries({ queryKey: ["fleetIncome"] });
      queryClient.invalidateQueries({ queryKey: ["fleetExpenses"] });
      setDeleteVehicleTarget(null);
    },
    onError: () => ue.error("Failed to delete vehicle.")
  });
  const addIncomeMut = useMutation({
    mutationFn: async (d) => {
      if (!actor) throw new Error("No actor");
      const dateNs = BigInt(new Date(d.date).getTime()) * BigInt(1e6);
      return actor.addFleetIncome(d.vehicleId, d.platform, d.amount, dateNs, d.notes);
    },
    onSuccess: () => {
      ue.success("Income added!");
      queryClient.invalidateQueries({ queryKey: ["fleetIncome"] });
      setAddIncomeOpen(false);
    },
    onError: () => ue.error("Failed to add income.")
  });
  const deleteIncomeMut = useMutation({
    mutationFn: async (incomeId) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteFleetIncome(incomeId);
    },
    onSuccess: () => {
      ue.success("Income entry removed.");
      queryClient.invalidateQueries({ queryKey: ["fleetIncome"] });
    },
    onError: () => ue.error("Failed to delete entry.")
  });
  const addExpenseMut = useMutation({
    mutationFn: async (d) => {
      if (!actor) throw new Error("No actor");
      const dateNs = BigInt(new Date(d.date).getTime()) * BigInt(1e6);
      return actor.addFleetExpense(d.vehicleId, d.category, d.amount, dateNs, d.notes);
    },
    onSuccess: () => {
      ue.success("Expense added!");
      queryClient.invalidateQueries({ queryKey: ["fleetExpenses"] });
      setAddExpenseOpen(false);
    },
    onError: () => ue.error("Failed to add expense.")
  });
  const deleteExpenseMut = useMutation({
    mutationFn: async (expenseId) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteFleetExpense(expenseId);
    },
    onSuccess: () => {
      ue.success("Expense entry removed.");
      queryClient.invalidateQueries({ queryKey: ["fleetExpenses"] });
    },
    onError: () => ue.error("Failed to delete entry.")
  });
  const dateRange = getPeriodRange(period, customFrom, customTo);
  const filteredVehicles = selectedVehicle === "all" ? vehicles : vehicles.filter((v) => v.vehicleId === selectedVehicle);
  const incomeForVehicle = (vehicleId) => allIncome.filter(
    (e) => e.vehicleId === vehicleId && inRange(e.date, dateRange)
  );
  const expensesForVehicle = (vehicleId) => allExpenses.filter(
    (e) => e.vehicleId === vehicleId && inRange(e.date, dateRange)
  );
  const summaries = vehicles.map((v) => {
    const inc = incomeForVehicle(v.vehicleId);
    const exp = expensesForVehicle(v.vehicleId);
    return {
      vehicleId: v.vehicleId,
      plateNumber: v.plateNumber,
      make: v.make,
      model: v.model,
      totalIncome: inc.reduce((s, e) => s + e.amount, 0),
      totalExpenses: exp.reduce((s, e) => s + e.amount, 0),
      netProfit: inc.reduce((s, e) => s + e.amount, 0) - exp.reduce((s, e) => s + e.amount, 0),
      tripCount: BigInt(inc.length),
      expenseCount: BigInt(exp.length)
    };
  });
  const openAddIncome = (vehicleId) => {
    setIncomeVehicleId(vehicleId);
    setAddIncomeOpen(true);
  };
  const openAddExpense = (vehicleId) => {
    setExpenseVehicleId(vehicleId);
    setAddExpenseOpen(true);
  };
  if (vehiclesLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", "data-ocid": "fleet.page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border-b border-border px-4 py-5 flex items-center justify-between sticky top-0 z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-xl font-bold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "w-5 h-5 text-primary" }),
          " Fleet Dashboard"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-0.5", children: "Track all your vehicles in one place" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => setAddVehicleOpen(true),
          size: "sm",
          className: "bg-primary text-primary-foreground font-semibold rounded-xl h-9 px-4",
          "data-ocid": "fleet.header_add_vehicle_button",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1.5" }),
            " Add Vehicle"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-5 space-y-5 max-w-2xl mx-auto", children: [
      vehicles.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyFleet, { onAdd: () => setAddVehicleOpen(true) }),
      vehicles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FleetOverviewCard,
          {
            summaries,
            vehicleCount: vehicles.length
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "overflow-x-auto -mx-4 px-4",
            "data-ocid": "fleet.filters_bar",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 min-w-max pb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: selectedVehicle,
                  onValueChange: setSelectedVehicle,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        className: "bg-card border-border h-8 text-xs rounded-lg min-w-[140px]",
                        "data-ocid": "fleet.vehicle_filter_select",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "All Vehicles" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Vehicles" }),
                      vehicles.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: v.vehicleId, children: v.plateNumber }, v.vehicleId))
                    ] })
                  ]
                }
              ),
              PERIODS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setPeriod(p),
                  className: `px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${period === p ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"}`,
                  "data-ocid": `fleet.period_filter.${p.toLowerCase().replace(/\s+/g, "_")}`,
                  children: p
                },
                p
              ))
            ] })
          }
        ),
        period === "Custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "From" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "date",
                value: customFrom,
                onChange: (e) => setCustomFrom(e.target.value),
                className: "bg-card border-border h-8 text-xs",
                "data-ocid": "fleet.custom_from_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs mb-1 block", children: "To" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "date",
                value: customTo,
                onChange: (e) => setCustomTo(e.target.value),
                className: "bg-card border-border h-8 text-xs",
                "data-ocid": "fleet.custom_to_input"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: filteredVehicles.map((vehicle, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          VehicleCard,
          {
            vehicle,
            income: incomeForVehicle(vehicle.vehicleId),
            expenses: expensesForVehicle(vehicle.vehicleId),
            expanded: expandedVehicle === vehicle.vehicleId,
            onToggleExpand: () => setExpandedVehicle(
              expandedVehicle === vehicle.vehicleId ? null : vehicle.vehicleId
            ),
            onAddIncome: openAddIncome,
            onAddExpense: openAddExpense,
            onDeleteIncome: (id) => deleteIncomeMut.mutate(id),
            onDeleteExpense: (id) => deleteExpenseMut.mutate(id),
            onDeleteVehicle: setDeleteVehicleTarget,
            index: i + 1
          },
          vehicle.vehicleId
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddVehicleModal,
      {
        open: addVehicleOpen,
        onClose: () => setAddVehicleOpen(false),
        onSubmit: (d) => addVehicleMut.mutate(d),
        loading: addVehicleMut.isPending
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddIncomeModal,
      {
        open: addIncomeOpen,
        onClose: () => setAddIncomeOpen(false),
        onSubmit: (d) => addIncomeMut.mutate(d),
        loading: addIncomeMut.isPending,
        vehicles,
        preselectedVehicleId: incomeVehicleId
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddExpenseModal,
      {
        open: addExpenseOpen,
        onClose: () => setAddExpenseOpen(false),
        onSubmit: (d) => addExpenseMut.mutate(d),
        loading: addExpenseMut.isPending,
        vehicles,
        preselectedVehicleId: expenseVehicleId
      }
    ),
    deleteVehicleTarget && /* @__PURE__ */ jsxRuntimeExports.jsx(
      DeleteConfirmDialog,
      {
        open: !!deleteVehicleTarget,
        onClose: () => setDeleteVehicleTarget(null),
        onConfirm: () => deleteVehicleMut.mutate(deleteVehicleTarget.vehicleId),
        label: `${deleteVehicleTarget.plateNumber}`,
        loading: deleteVehicleMut.isPending
      }
    )
  ] });
}
export {
  FleetDashboardPage as default
};
