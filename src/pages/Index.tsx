import { useState, useEffect, useCallback } from "react";

// ─── Component Categories & Parts ─────────────────────────────────────────────
const CATEGORIES: Record<string, string[]> = {
  Resistors: ["100R", "220R", "470R", "560R", "820R", "1K", "1.2K", "1K5", "1K8", "2K", "2.2K", "2.7K", "3.3K", "3K9", "4K7", "5K1", "5K6", "6.8K", "10K", "12K", "15K", "20K", "22K", "27K", "33K", "39K", "47K", "68K", "100K", "130K", "150K", "180K", "220K", "330K", "392K", "422K", "470K", "1M", "2M", "2.2M", "10M"],
  "Film Box Capacitors": ["1nF", "2.2nF", "2.7nF", "3.3nF", "3.9nF", "4.7nF", "5.6nF", "8.2nF", "10nF", "18nF", "22nF", "27nF", "47nF", "56nF", "68nF", "82nF", "100nF", "120nF", "150nF", "220nF", "390nF", "470nF", "1000nF"],
  "Ceramic Capacitors": ["15p", "47p", "100p", "120p", "220p", "250p", "390p (MLCC)", "470p", "680p", "820p (MLCC)", "220nF"],
  "Electrolytic Capacitors": ["1uF", "2.2uF", "4.7uF", "10uF", "22uF", "47uF", "100uF", "220uF"],
  Transistors: ["J201", "2N2222A", "2N3906", "2N5088", "2N5457 - JFET", "2N7000", "BC548B"],
  ICs: ["JRC4558D", "JRC4580D", "LM833N", "OPA2134", "RC4558P", "TC1044SCPA", "TL072CP", "V3102D", "V3207D"],
  Diodes: ["BA282", "BAT41", "1N34A", "1N914", "1N4001", "1N4148", "1N4742A", "1N5239B", "1N5817"],
  Potentiometers: ["A10K Pot", "A100K Pot", "A250K Pot", "A250K Dual Pot", "A500K Pot", "A1M Pot", "B1K Pot", "B10K Pot", "B25K Pot", "B50K Pot", "B100K Pot", "B100K Dual Pot", "B500K Pot", "C1K Pot", "C10K Pot", "C25K Pot", "C50K Pot", "W20K Pot", "50k Trim Pot", "100k Trim Pot"],
  Switches: ["DPDT", "3PDT latching footswitch", "SPDT Toggle Switch ON/ON"],
  Hardware: ["DC Jack", "Input Jack", "Black MXR knob", "Blue MXR knob", "Clear MXR knob", "Cream MXR knob", "Green MXR knob", "Grey MXR knob", "Light Blue MXR knob", "Orange MXR knob", "Purple MXR knob", "Red MXR knob", "White MXR knob", "Yellow MXR knob"],
};

type ComponentItem = { name: string; category: string };

const ALL_COMPONENTS: ComponentItem[] = Object.entries(CATEGORIES).flatMap(
  ([category, parts]) => parts.map((name) => ({ name, category }))
);

function buildDefaultInventory(): Record<string, number> {
  const inv: Record<string, number> = {};
  ALL_COMPONENTS.forEach((c) => (inv[c.name] = 0));
  return inv;
}

type Template = { name: string; components: Record<string, number> };
type PageName =
  | "home"
  | "viewInventory"
  | "updateInventory"
  | "manualUpload"
  | "placeOrder"
  | "uploadTemplate"
  | "shoppingList";

const PAGE_TITLES: Record<PageName, string> = {
  home: "Guitar Pedal Inventory System",
  viewInventory: "View Inventory",
  updateInventory: "Update Inventory",
  manualUpload: "Manual Upload",
  placeOrder: "Place Order",
  uploadTemplate: "Upload Template",
  shoppingList: "Shopping List",
};

// ─── Storage helpers ──────────────────────────────────────────────────────────
const storage = (window as any).storage;

async function loadStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    const result = await storage?.get?.(key);
    if (result?.value) return JSON.parse(result.value);
    if (result && typeof result === "string") return JSON.parse(result);
  } catch {}
  return fallback;
}

async function saveStorage(key: string, value: any) {
  try {
    await storage?.set?.(key, JSON.stringify(value));
  } catch {}
}

// ─── Reusable UI pieces ───────────────────────────────────────────────────────
function PageHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      {onBack && (
        <button
          onClick={onBack}
          className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          ← Back
        </button>
      )}
      <h1 className="text-2xl font-bold font-mono text-primary">{title}</h1>
    </div>
  );
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="animate-fade-in mt-4 rounded-lg bg-success/20 border border-success/40 px-4 py-3 text-success font-medium">
      ✓ {message}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const Index = () => {
  const [inventory, setInventory] = useState<Record<string, number>>(buildDefaultInventory);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentPage, setCurrentPage] = useState<PageName>("home");
  const [loaded, setLoaded] = useState(false);

  // Hydrate from storage
  useEffect(() => {
    (async () => {
      const inv = await loadStorage("pedal-inventory", buildDefaultInventory());
      const tmpl = await loadStorage<Template[]>("pedal-templates", []);
      setInventory(inv);
      setTemplates(tmpl);
      setLoaded(true);
    })();
  }, []);

  // Persist
  useEffect(() => {
    if (!loaded) return;
    saveStorage("pedal-inventory", inventory);
  }, [inventory, loaded]);

  useEffect(() => {
    if (!loaded) return;
    saveStorage("pedal-templates", templates);
  }, [templates, loaded]);

  const nav = useCallback((p: PageName) => setCurrentPage(p), []);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground font-mono animate-pulse">Loading inventory…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {currentPage === "home" && <HomePage nav={nav} />}
        {currentPage === "viewInventory" && <ViewInventoryPage inventory={inventory} nav={nav} />}
        {currentPage === "updateInventory" && <UpdateInventoryPage nav={nav} />}
        {currentPage === "manualUpload" && (
          <ManualUploadPage inventory={inventory} setInventory={setInventory} nav={nav} />
        )}
        {currentPage === "placeOrder" && (
          <PlaceOrderPage inventory={inventory} setInventory={setInventory} templates={templates} nav={nav} />
        )}
        {currentPage === "uploadTemplate" && (
          <UploadTemplatePage templates={templates} setTemplates={setTemplates} nav={nav} />
        )}
        {currentPage === "shoppingList" && <ShoppingListPage inventory={inventory} nav={nav} />}
      </div>
    </div>
  );
};

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ nav }: { nav: (p: PageName) => void }) {
  const buttons: { label: string; icon: string; target: PageName }[] = [
    { label: "View Inventory", icon: "📋", target: "viewInventory" },
    { label: "Update Inventory", icon: "🔧", target: "updateInventory" },
    { label: "Upload Template", icon: "📄", target: "uploadTemplate" },
    { label: "Shopping List", icon: "🛒", target: "shoppingList" },
  ];

  return (
    <div className="flex flex-col items-center pt-12">
      <div className="mb-2 text-5xl">🎸</div>
      <h1 className="mb-2 text-3xl font-bold font-mono text-primary">
        Guitar Pedal Inventory
      </h1>
      <p className="mb-10 text-muted-foreground">
        Manage your components, templates & orders
      </p>
      <div className="grid w-full max-w-lg grid-cols-2 gap-4">
        {buttons.map((b) => (
          <button
            key={b.target}
            onClick={() => nav(b.target)}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="text-3xl">{b.icon}</span>
            <span className="font-semibold font-mono text-sm">{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── View Inventory ───────────────────────────────────────────────────────────
function ViewInventoryPage({
  inventory,
  nav,
}: {
  inventory: Record<string, number>;
  nav: (p: PageName) => void;
}) {
  return (
    <div className="animate-fade-in">
      <PageHeader title={PAGE_TITLES.viewInventory} onBack={() => nav("home")} />
      <div className="space-y-6">
        {Object.entries(CATEGORIES).map(([category, parts]) => (
          <div key={category}>
            <h2 className="mb-2 text-lg font-bold font-mono text-primary">{category}</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-4 py-3 text-left font-mono font-semibold text-secondary-foreground">Component</th>
                    <th className="px-4 py-3 text-right font-mono font-semibold text-secondary-foreground">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((name, i) => {
                    const qty = inventory[name] ?? 0;
                    const isLow = qty <= 0;
                    return (
                      <tr
                        key={name}
                        className={
                          isLow
                            ? "bg-out-of-stock text-destructive-foreground"
                            : i % 2 === 0
                            ? "bg-card"
                            : "bg-table-stripe"
                        }
                      >
                        <td className="px-4 py-2 font-mono">{name}</td>
                        <td className={`px-4 py-2 text-right font-mono font-bold ${isLow ? "text-destructive" : "text-primary"}`}>
                          {qty}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Update Inventory ─────────────────────────────────────────────────────────
function UpdateInventoryPage({ nav }: { nav: (p: PageName) => void }) {
  return (
    <div className="animate-fade-in">
      <PageHeader title={PAGE_TITLES.updateInventory} onBack={() => nav("home")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: "Manual Upload", icon: "✏️", target: "manualUpload" as PageName },
          { label: "Place Order", icon: "📦", target: "placeOrder" as PageName },
        ].map((b) => (
          <button
            key={b.target}
            onClick={() => nav(b.target)}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="text-2xl">{b.icon}</span>
            <span className="font-semibold font-mono">{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Manual Upload ────────────────────────────────────────────────────────────
function ManualUploadPage({
  inventory,
  setInventory,
  nav,
}: {
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  nav: (p: PageName) => void;
}) {
  const [values, setValues] = useState<Record<string, number>>({ ...inventory });
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    setInventory({ ...values });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title={PAGE_TITLES.manualUpload} onBack={() => nav("updateInventory")} />
      <div className="space-y-6">
        {Object.entries(CATEGORIES).map(([category, parts]) => (
          <div key={category}>
            <h2 className="mb-2 text-lg font-bold font-mono text-primary">{category}</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-4 py-3 text-left font-mono font-semibold text-secondary-foreground">Component</th>
                    <th className="px-4 py-3 text-right font-mono font-semibold text-secondary-foreground">Current</th>
                    <th className="px-4 py-3 text-right font-mono font-semibold text-secondary-foreground">New Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((name, i) => (
                    <tr key={name} className={i % 2 === 0 ? "bg-card" : "bg-table-stripe"}>
                      <td className="px-4 py-2 font-mono">{name}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">{inventory[name]}</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={values[name] ?? 0}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [name]: Math.max(0, parseInt(e.target.value) || 0) }))
                          }
                          className="w-20 rounded-md border border-input bg-background px-2 py-1 text-right font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="mt-4 rounded-lg bg-success px-6 py-3 font-semibold text-success-foreground transition-colors hover:bg-success/80"
      >
        Submit
      </button>
      {success && <SuccessMessage message="Inventory updated successfully!" />}
    </div>
  );
}

// ─── Place Order ──────────────────────────────────────────────────────────────
function PlaceOrderPage({
  inventory,
  setInventory,
  templates,
  nav,
}: {
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  templates: Template[];
  nav: (p: PageName) => void;
}) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [success, setSuccess] = useState("");

  const toggleExpand = (idx: number) =>
    setExpanded((e) => ({ ...e, [idx]: !e[idx] }));

  const handleSubmit = () => {
    const newInv = { ...inventory };
    const added: string[] = [];

    templates.forEach((t, idx) => {
      const qty = quantities[idx] || 0;
      if (qty > 0) {
        Object.entries(t.components).forEach(([comp, amount]) => {
          newInv[comp] = (newInv[comp] || 0) + amount * qty;
        });
        added.push(`${qty}x ${t.name}`);
      }
    });

    if (added.length === 0) {
      setSuccess("No orders placed — set a quantity first.");
      setTimeout(() => setSuccess(""), 3000);
      return;
    }

    setInventory(newInv);
    setSuccess(`Order placed: ${added.join(", ")}`);
    setQuantities({});
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title={PAGE_TITLES.placeOrder} onBack={() => nav("updateInventory")} />
      {templates.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground font-mono">No pedal templates found. Upload a template first.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {templates.map((t, idx) => {
              const isOpen = expanded[idx] ?? false;
              const usedComponents = Object.entries(t.components).filter(([, qty]) => qty > 0);
              return (
                <div key={idx} className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="flex items-center gap-2 text-left font-mono font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      <span className="text-xs text-muted-foreground transition-transform inline-block" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                      {t.name}
                      <span className="text-xs font-normal text-muted-foreground">({usedComponents.length} parts)</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">Qty:</label>
                      <input
                        type="number"
                        min={0}
                        value={quantities[idx] || 0}
                        onChange={(e) =>
                          setQuantities((q) => ({ ...q, [idx]: Math.max(0, parseInt(e.target.value) || 0) }))
                        }
                        className="w-20 rounded-md border border-input bg-background px-2 py-1 text-right font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary">
                            <th className="px-4 py-2 text-left font-mono font-semibold text-secondary-foreground">Component</th>
                            <th className="px-4 py-2 text-right font-mono font-semibold text-secondary-foreground">Qty Needed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usedComponents.map(([comp, qty], i) => (
                            <tr key={comp} className={i % 2 === 0 ? "bg-card" : "bg-table-stripe"}>
                              <td className="px-4 py-1.5 font-mono">{comp}</td>
                              <td className="px-4 py-1.5 text-right font-mono font-bold text-primary">{qty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 rounded-lg bg-success px-6 py-3 font-semibold text-success-foreground transition-colors hover:bg-success/80"
          >
            Submit Order
          </button>
        </>
      )}
      {success && <SuccessMessage message={success} />}
    </div>
  );
}

// ─── Upload Template ──────────────────────────────────────────────────────────
function UploadTemplatePage({
  templates,
  setTemplates,
  nav,
}: {
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  nav: (p: PageName) => void;
}) {
  const [name, setName] = useState("");
  const [components, setComponents] = useState<Record<string, number>>(() =>
    Object.fromEntries(ALL_COMPONENTS.map((c) => [c.name, 0]))
  );
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Please enter a pedal name.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const tmpl: Template = { name: name.trim(), components: { ...components } };
    setTemplates((t) => [...t, tmpl]);
    setName("");
    setComponents(Object.fromEntries(ALL_COMPONENTS.map((c) => [c.name, 0])));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title={PAGE_TITLES.uploadTemplate} onBack={() => nav("home")} />
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-muted-foreground">Pedal Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tube Screamer Clone"
          className="w-full rounded-lg border border-input bg-background px-4 py-2 font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left font-mono font-semibold text-secondary-foreground">Component</th>
              <th className="px-4 py-3 text-left font-mono font-semibold text-secondary-foreground">Category</th>
              <th className="px-4 py-3 text-right font-mono font-semibold text-secondary-foreground">Qty Needed</th>
            </tr>
          </thead>
          <tbody>
            {ALL_COMPONENTS.map((c, i) => (
              <tr key={c.name} className={i % 2 === 0 ? "bg-card" : "bg-table-stripe"}>
                <td className="px-4 py-2 font-mono">{c.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.category}</td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    value={components[c.name]}
                    onChange={(e) =>
                      setComponents((v) => ({ ...v, [c.name]: Math.max(0, parseInt(e.target.value) || 0) }))
                    }
                    className="w-20 rounded-md border border-input bg-background px-2 py-1 text-right font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleSubmit}
        className="mt-4 rounded-lg bg-success px-6 py-3 font-semibold text-success-foreground transition-colors hover:bg-success/80"
      >
        Save Template
      </button>
      {error && (
        <div className="animate-fade-in mt-4 rounded-lg bg-destructive/20 border border-destructive/40 px-4 py-3 text-destructive font-medium">
          {error}
        </div>
      )}
      {success && <SuccessMessage message={`Template "${templates[templates.length - 1]?.name}" saved!`} />}
    </div>
  );
}

// ─── Shopping List ────────────────────────────────────────────────────────────
function ShoppingListPage({
  inventory,
  nav,
}: {
  inventory: Record<string, number>;
  nav: (p: PageName) => void;
}) {
  const needed = ALL_COMPONENTS.filter((c) => (inventory[c.name] ?? 0) <= 0);

  return (
    <div className="animate-fade-in">
      <PageHeader title={PAGE_TITLES.shoppingList} onBack={() => nav("home")} />
      {needed.length === 0 ? (
        <div className="rounded-lg border border-success/30 bg-success/10 p-8 text-center">
          <p className="text-lg font-semibold text-success font-mono">✓ All components are in stock!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-left font-mono font-semibold text-secondary-foreground">Component</th>
                <th className="px-4 py-3 text-left font-mono font-semibold text-secondary-foreground">Category</th>
                <th className="px-4 py-3 text-right font-mono font-semibold text-secondary-foreground">Qty</th>
              </tr>
            </thead>
            <tbody>
              {needed.map((c, i) => (
                <tr key={c.name} className={i % 2 === 0 ? "bg-out-of-stock" : "bg-out-of-stock/70"}>
                  <td className="px-4 py-2 font-mono">⚠️ {c.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.category}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-destructive">
                    {inventory[c.name] ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Index;
