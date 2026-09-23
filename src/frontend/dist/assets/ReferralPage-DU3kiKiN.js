import { c as createLucideIcon, ab as React__default, u as useActor, m as useQuery, n as useQueryClient, o as useMutation, r as reactExports, ac as formatCurrency, j as jsxRuntimeExports, v as Card, E as CardContent, ad as Wallet, a1 as Sparkles, x as CardHeader, y as CardTitle, q as Skeleton, N as Check, K as Copy, B as Button, ae as Users, i as Badge, I as Input, U as ArrowRight, p as ue } from "./index-C-RLbQrs.js";
import { S as Share2 } from "./share-2-D9nDc0cb.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { x: "3", y: "8", width: "18", height: "4", rx: "1", key: "bkv52" }],
  ["path", { d: "M12 8v13", key: "1c76mn" }],
  ["path", { d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7", key: "6wjy6b" }],
  [
    "path",
    {
      d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",
      key: "1ihvrl"
    }
  ]
];
const Gift = createLucideIcon("gift", __iconNode);
var DefaultContext = {
  color: void 0,
  size: void 0,
  className: void 0,
  style: void 0,
  attr: void 0
};
var IconContext = React__default.createContext && /* @__PURE__ */ React__default.createContext(DefaultContext);
var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /* @__PURE__ */ React__default.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return (props) => /* @__PURE__ */ React__default.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = (conf) => {
    var {
      attr,
      size,
      title
    } = props, svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /* @__PURE__ */ React__default.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /* @__PURE__ */ React__default.createElement("title", null, title), props.children);
  };
  return IconContext !== void 0 ? /* @__PURE__ */ React__default.createElement(IconContext.Consumer, null, (conf) => elem(conf)) : elem(DefaultContext);
}
function SiWhatsapp(props) {
  return GenIcon({ "attr": { "role": "img", "viewBox": "0 0 24 24" }, "child": [{ "tag": "path", "attr": { "d": "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" }, "child": [] }] })(props);
}
function useMyReferralCode() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myReferralCode"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const raw = await actor.getMyReferralCode();
      return {
        code: raw.code,
        ownerId: raw.ownerId,
        ownerName: raw.ownerName,
        createdAt: Number(raw.createdAt) / 1e6,
        timesUsed: Number(raw.timesUsed),
        totalEarned: Number(raw.totalEarned)
      };
    },
    enabled: !!actor && !isFetching
  });
}
function useReferralStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["referralStats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const raw = await actor.getReferralStats();
      return {
        timesUsed: Number(raw.timesUsed),
        totalEarned: Number(raw.totalEarned),
        pendingBonus: Number(raw.pendingBonus)
      };
    },
    enabled: !!actor && !isFetching
  });
}
function useReferralConfig() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["referralConfig"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const raw = await actor.getReferralConfig();
      return {
        enabled: raw.enabled,
        bonusPerReferral: Number(raw.bonusPerReferral),
        bonusSource: raw.bonusSource,
        minTripsToQualify: Number(raw.minTripsToQualify)
      };
    },
    enabled: !!actor && !isFetching
  });
}
function useApplyReferralCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.applyReferralCode(code);
      if (result && "err" in result) throw new Error(String(result.err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralStats"] });
      queryClient.invalidateQueries({ queryKey: ["myReferralCode"] });
    }
  });
}
function useMyReferralCredit() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myReferralCredit"],
    queryFn: async () => {
      if (!actor) return 0;
      const raw = await actor.getMyReferralCredit();
      return typeof raw === "number" ? raw : Number(raw);
    },
    enabled: !!actor && !isFetching
  });
}
function captureRefParam() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    localStorage.setItem("moneydrive_referral_code", ref.toUpperCase());
  }
}
function StatTile({
  label,
  value,
  highlight = false
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `rounded-xl p-3 text-center ${highlight ? "bg-primary/10 border border-primary/30" : "bg-muted/40 border border-border/40"}`,
      "data-ocid": `referral.stat.${label.toLowerCase().replace(/\s+/g, "_")}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            className: `font-display font-bold text-lg leading-tight ${highlight ? "text-primary" : "text-foreground"}`,
            children: value
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: label })
      ]
    }
  );
}
function ReferralPage() {
  var _a;
  const { data: referralCode, isLoading: codeLoading } = useMyReferralCode();
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const { data: config } = useReferralConfig();
  const { data: creditBalance = 0, isLoading: creditLoading } = useMyReferralCredit();
  const applyMut = useApplyReferralCode();
  const [applyInput, setApplyInput] = reactExports.useState("");
  const [copied, setCopied] = reactExports.useState(false);
  const [linkCopied, setLinkCopied] = reactExports.useState(false);
  const appUrl = "https://moneydriver-2oj.caffeine.xyz";
  const code = (referralCode == null ? void 0 : referralCode.code) ?? "";
  const bonusAmount = config && config.bonusPerReferral > 0 ? config.bonusPerReferral : 50;
  const bonusText = formatCurrency(bonusAmount, "ZAR");
  const refLink = code ? `${appUrl}?ref=${code}` : appUrl;
  const shareText = `Join me on MoneyDrive — SA's driver income platform. Use my code ${code} to sign up: ${refLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  reactExports.useEffect(() => {
    captureRefParam();
  }, []);
  reactExports.useEffect(() => {
    const stored = localStorage.getItem("moneydrive_referral_code");
    if (stored && !applyInput) {
      setApplyInput(stored);
    }
  }, [applyInput]);
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      ue.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      ue.error("Could not copy — try manually");
    }
  };
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setLinkCopied(true);
      ue.success("Referral link copied!");
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      ue.error("Could not copy — try manually");
    }
  };
  const handleShareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join MoneyDrive",
        text: shareText,
        url: refLink
      });
    } else {
      await handleCopyLink();
    }
  };
  const handleApply = () => {
    if (!applyInput.trim()) return;
    applyMut.mutate(applyInput.trim().toUpperCase(), {
      onSuccess: () => {
        ue.success("Referral code applied!");
        localStorage.removeItem("moneydrive_referral_code");
        setApplyInput("");
      },
      onError: (err) => ue.error(err.message || "Invalid code")
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto px-4 py-6 space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "rounded-2xl p-6 text-center relative overflow-hidden",
        style: {
          background: "linear-gradient(135deg, oklch(0.17 0.035 230), oklch(0.22 0.045 240))"
        },
        "data-ocid": "referral.hero.card",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "absolute top-0 left-0 right-0 h-1 pointer-events-none",
              style: {
                background: "linear-gradient(90deg, oklch(0.76 0.12 75), oklch(0.55 0.18 145), oklch(0.76 0.12 75))",
                opacity: 0.6
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "w-7 h-7 text-gold" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-extrabold text-white mb-2", children: "Earn R50 Per Referral" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/80 text-sm max-w-xs mx-auto", children: [
            "Share MoneyDrive with fellow drivers. When they sign up and pay, you earn ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gold font-bold", children: bonusText }),
            " — automatically applied to your next subscription."
          ] })
        ]
      }
    ),
    !creditLoading && creditBalance > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Card,
      {
        className: "border-success/30 bg-success/5 shadow-card",
        "data-ocid": "referral.credit_balance.card",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "w-5 h-5 text-success" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-wide font-semibold", children: "Your Referral Credit" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-black text-2xl text-success leading-tight", children: formatCurrency(creditBalance, "ZAR") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "This will be automatically applied to your next payment" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-5 h-5 text-success/60 shrink-0" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-card", "data-ocid": "referral.code.card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "w-4 h-4 text-primary" }),
        "Your Referral Code"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        codeLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 w-full rounded-xl" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-xl p-4 text-center border-2",
            style: {
              borderColor: "oklch(0.76 0.12 75 / 0.5)",
              background: "oklch(0.76 0.12 75 / 0.08)"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-widest mb-1", children: "Your code" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  className: "font-mono font-black text-3xl text-foreground tracking-widest",
                  "data-ocid": "referral.code.display",
                  children: code || "—"
                }
              )
            ]
          }
        ),
        code && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-mono text-muted-foreground truncate flex-1 min-w-0", children: refLink }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleCopyLink,
              className: "shrink-0 text-muted-foreground hover:text-foreground transition-colors",
              "data-ocid": "referral.copy_link.button",
              title: "Copy referral link",
              children: linkCopied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-success" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: handleCopyCode,
              disabled: !code,
              className: "gap-1.5 flex-col h-auto py-2.5 text-xs",
              "data-ocid": "referral.copy_code.button",
              children: [
                copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-success" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" }),
                copied ? "Copied!" : "Copy Code"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: code ? whatsappUrl : "#",
              target: "_blank",
              rel: "noopener noreferrer",
              className: `inline-flex flex-col items-center justify-center gap-1 rounded-md border px-3 py-2.5 text-xs font-medium transition-colors ${code ? "bg-[#25D366] hover:bg-[#20bd5a] text-white border-transparent" : "border-border text-muted-foreground cursor-not-allowed opacity-50"}`,
              "data-ocid": "referral.whatsapp_share.button",
              onClick: (e) => !code && e.preventDefault(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SiWhatsapp, { className: "w-4 h-4" }),
                "WhatsApp"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: handleShareLink,
              disabled: !code,
              className: "gap-1.5 flex-col h-auto py-2.5 text-xs",
              "data-ocid": "referral.share_link.button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "w-4 h-4" }),
                "Share"
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-card", "data-ocid": "referral.stats.card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4 text-primary" }),
        "Your Stats"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: statsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 rounded-xl" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatTile,
          {
            label: "Drivers Referred",
            value: String((stats == null ? void 0 : stats.timesUsed) ?? 0)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatTile,
          {
            label: "Total Earned",
            value: formatCurrency((stats == null ? void 0 : stats.totalEarned) ?? 0, "ZAR"),
            highlight: ((stats == null ? void 0 : stats.totalEarned) ?? 0) > 0
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatTile,
          {
            label: "Pending",
            value: formatCurrency((stats == null ? void 0 : stats.pendingBonus) ?? 0, "ZAR")
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-card", "data-ocid": "referral.how_it_works.card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-base", children: "How It Works" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        [
          {
            step: "1",
            title: "Share your unique link or code",
            desc: "Send your referral link or code to any driver friend via WhatsApp, SMS, or in person."
          },
          {
            step: "2",
            title: "They sign up and pay",
            desc: `When they register and make their first subscription payment, you earn ${bonusText} instantly.`
          },
          {
            step: "3",
            title: "Your R50 is applied automatically",
            desc: "Your credit is stored in your account and deducted from your next subscription renewal — no action needed from you."
          }
        ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-primary", children: item.step }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground leading-snug", children: item.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5 leading-relaxed", children: item.desc })
          ] })
        ] }, item.step)),
        config && config.minTripsToQualify > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 pt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
          "Referred driver needs ",
          config.minTripsToQualify,
          "+ trips to qualify"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-card", "data-ocid": "referral.apply.card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-sm", children: "Have a Referral Code?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "If you signed up without a code, you can still apply one here." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: "e.g. MD-JOHN4821",
              value: applyInput,
              onChange: (e) => setApplyInput(e.target.value.toUpperCase()),
              className: "font-mono",
              "data-ocid": "referral.apply_code.input"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handleApply,
              disabled: !applyInput.trim() || applyMut.isPending,
              className: "shrink-0 gap-1.5",
              "data-ocid": "referral.apply_code.submit_button",
              children: applyMut.isPending ? "Applying..." : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                "Apply",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-3.5 h-3.5" })
              ] })
            }
          )
        ] }),
        applyMut.isSuccess && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            className: "text-xs text-success mt-2 flex items-center gap-1",
            "data-ocid": "referral.apply_code.success_state",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-3 h-3" }),
              " Code applied! Your friend will earn their bonus when you activate."
            ]
          }
        ),
        applyMut.isError && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            className: "text-xs text-destructive mt-2",
            "data-ocid": "referral.apply_code.error_state",
            children: ((_a = applyMut.error) == null ? void 0 : _a.message) || "Invalid code. Check and try again."
          }
        )
      ] })
    ] })
  ] });
}
export {
  ReferralPage as default
};
