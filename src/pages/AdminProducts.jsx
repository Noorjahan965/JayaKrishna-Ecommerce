import { useState } from "react";
import { useAsync, useDocumentTitle } from "../hooks";
import { adminApi } from "../services/api";
import { EmptyState, Loading, Notice } from "../components/ui";

const parseUses = (text) =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// One spec per line: "Label: value". Returns null if a line has no label and colon.
function parseSpecs(text) {
  const out = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const i = line.indexOf(":");
    if (i < 1) return null;
    out.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
  }
  return out;
}
const specsToText = (specs) =>
  (specs || []).map(([k, v]) => `${k}: ${v}`).join("\n");

function ProductFields({ f, setF, options, showActive }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <div className="admin-field">
        <label>
          Name *
          <input
            className="admin-input wide"
            required
            minLength={2}
            value={f.name}
            onChange={set("name")}
          />
        </label>
      </div>
      <div className="grid-2">
        <div className="admin-field">
          <label>
            Brand *
            <select
              className="admin-input wide"
              required
              value={f.brand_id}
              onChange={set("brand_id")}
            >
              <option value="">Choose a brand</option>
              {options.brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="admin-field">
          <label>
            Category
            <select
              className="admin-input wide"
              value={f.category_id}
              onChange={set("category_id")}
            >
              <option value="">No category</option>
              {options.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="admin-field">
        <label>
          Tagline
          <input
            className="admin-input wide"
            value={f.tagline}
            onChange={set("tagline")}
          />
        </label>
      </div>
      <div className="admin-field">
        <label>
          Description
          <textarea
            className="admin-input wide"
            rows={3}
            value={f.description}
            onChange={set("description")}
          />
        </label>
      </div>
      <div className="admin-field">
        <label>
          Facility
          <input
            className="admin-input wide"
            value={f.facility}
            onChange={set("facility")}
          />
        </label>
      </div>
      <div className="admin-field">
        <label>
          Image path (a file in public/img, e.g. /img/kili-maida.png)
          <input
            className="admin-input wide"
            value={f.image}
            onChange={set("image")}
          />
        </label>
      </div>
      <div className="admin-field">
        <label>
          Good for (separate with commas)
          <input
            className="admin-input wide"
            value={f.usesText}
            onChange={set("usesText")}
            placeholder="Parata, Bread, Buns"
          />
        </label>
      </div>
      <div className="admin-field">
        <label>
          Nutrition / specifications (one per line, as Label: value)
          <textarea
            className="admin-input wide"
            rows={6}
            value={f.specsText}
            onChange={set("specsText")}
            placeholder={"Energy Value: 358 kcal\nProtein: 12 g"}
          />
        </label>
      </div>
      {showActive && (
        <label>
          <input
            type="checkbox"
            checked={f.is_active}
            onChange={(e) => setF({ ...f, is_active: e.target.checked })}
          />{" "}
          Show this product on the website
        </label>
      )}
    </>
  );
}

// Turns the form into the API body. Returns { body } or { error }.
function toBody(f) {
  if (!f.brand_id) return { error: "Choose a brand" };
  const specs = parseSpecs(f.specsText);
  if (specs === null)
    return { error: 'Each specification line must look like "Label: value"' };
  const body = {
    name: f.name,
    brand_id: Number(f.brand_id),
    category_id: f.category_id === "" ? null : Number(f.category_id),
    facility: f.facility,
    tagline: f.tagline,
    description: f.description,
    uses: parseUses(f.usesText),
    specs,
    is_active: f.is_active,
  };
  if (f.image) body.image = f.image;
  return { body };
}

function PackRow({ pack, onChanged }) {
  const [price, setPrice] = useState(pack.price ?? "");
  const [stock, setStock] = useState(pack.stock);
  const [active, setActive] = useState(!!pack.is_active);
  const [state, setState] = useState("");

  const save = async () => {
    const p = price === "" ? null : Number(price);
    const s = Number(stock);
    if (p !== null && (!Number.isFinite(p) || p < 0))
      return setState("Enter a valid price");
    if (!Number.isInteger(s) || s < 0)
      return setState("Stock must be a whole number");
    setState("Saving…");
    try {
      await adminApi.updatePack(pack.id, {
        price: p,
        stock: s,
        is_active: active,
      });
      setState("Saved");
    } catch (e) {
      setState(e.message);
    }
  };
  const del = async () => {
    if (!window.confirm(`Delete the ${pack.size_kg} kg pack?`)) return;
    try {
      await adminApi.deletePack(pack.id);
      onChanged();
    } catch (e) {
      setState(e.message);
    }
  };

  return (
    <tr>
      <td className="nowrap">{pack.size_kg} kg</td>
      <td className="nowrap">{pack.sku}</td>
      <td>
        <input
          className="admin-input"
          type="number"
          min="0"
          step="0.01"
          value={price}
          placeholder="Not set"
          onChange={(e) => {
            setPrice(e.target.value);
            setState("");
          }}
          aria-label={`Price for ${pack.sku}`}
        />
      </td>
      <td className="nowrap">
        <input
          className="admin-input"
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={(e) => {
            setStock(e.target.value);
            setState("");
          }}
          aria-label={`Stock for ${pack.sku}`}
        />
        {Number(stock) <= 20 && <span className="chip">low</span>}
      </td>
      <td className="nowrap">
        <label>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => {
              setActive(e.target.checked);
              setState("");
            }}
          />{" "}
          On sale
        </label>
      </td>
      <td className="actions-cell">
        <button className="btn btn-primary btn-sm" onClick={save}>
          Save
        </button>
        <button className="btn btn-outline btn-sm" onClick={del}>
          Delete
        </button>
        <div className="small muted">{state}</div>
      </td>
    </tr>
  );
}

function ProductEditor({ product, options, onChanged }) {
  const [f, setF] = useState({
    name: product.name,
    brand_id: product.brand_id ?? "",
    category_id: product.category_id ?? "",
    facility: product.facility || "",
    tagline: product.tagline || "",
    description: product.description || "",
    image: product.image || "",
    usesText: (product.uses || []).join(", "),
    specsText: specsToText(product.specs),
    is_active: !!product.is_active,
  });
  const [state, setState] = useState("");
  const [newSize, setNewSize] = useState("");
  const [packMsg, setPackMsg] = useState(null);

  const save = async () => {
    const r = toBody(f);
    if (r.error) return setState(r.error);
    setState("Saving…");
    try {
      await adminApi.saveProduct(product.id, r.body);
      setState("Saved");
    } catch (e) {
      setState(e.message);
    }
  };
  const addPack = async () => {
    const size = Number(newSize);
    if (!Number.isInteger(size) || size < 1)
      return setPackMsg("Enter the pack size in whole kg");
    setPackMsg(null);
    try {
      await adminApi.addPack(product.id, { size_kg: size });
      setNewSize("");
      onChanged();
    } catch (e) {
      setPackMsg(e.message);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3>
        {product.name}{" "}
        {!product.is_active && <span className="chip">hidden</span>}
      </h3>
      <p className="small muted">
        Web address: /shop/{product.slug} (cannot be changed)
      </p>
      <ProductFields
        f={f}
        setF={(v) => {
          setF(v);
          setState("");
        }}
        options={options}
        showActive
      />
      <p>
        <button className="btn btn-primary" onClick={save}>
          Save product
        </button>{" "}
        <span className="small muted">{state}</span>
      </p>

      <h4>Packs, prices and stock</h4>
      <div className="table-wrap">
        <table className="spec-table">
          <thead>
            <tr>
              <th>Pack</th>
              <th>SKU</th>
              <th>Price (₹)</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {product.packs.map((k) => (
              <PackRow key={k.id} pack={k} onChanged={onChanged} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-bar" style={{ marginTop: 12 }}>
        <input
          className="admin-input"
          type="number"
          min="1"
          placeholder="New size (kg)"
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
          aria-label="New pack size in kg"
        />
        <button className="btn btn-outline btn-sm" onClick={addPack}>
          + Add pack size
        </button>
        {packMsg && <span className="small muted">{packMsg}</span>}
      </div>
      <p className="small muted">
        A pack with no price cannot be ordered online.
      </p>
    </div>
  );
}

function NewProduct({ options, onCreated, onCancel }) {
  const [f, setF] = useState({
    name: "",
    brand_id: "",
    category_id: "",
    facility: "",
    tagline: "",
    description: "",
    image: "",
    usesText: "",
    specsText: "",
    is_active: true,
  });
  const [sizes, setSizes] = useState("1, 5, 10, 25, 50");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const r = toBody(f);
    if (r.error) return setErr(r.error);
    const list = [
      ...new Set(
        sizes
          .split(",")
          .map((s) => Number(s.trim()))
          .filter(Boolean),
      ),
    ];
    if (!list.length || list.some((n) => !Number.isInteger(n) || n < 1))
      return setErr("Enter pack sizes in whole kg, separated by commas");
    setBusy(true);
    setErr(null);
    try {
      await adminApi.createProduct({
        ...r.body,
        packs: list.map((size_kg) => ({ size_kg, stock: 0 })),
      });
      onCreated();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ marginBottom: 24 }}>
      <h3>Add new product</h3>
      <p className="small muted">
        The web address is made from the name and cannot be changed later.
      </p>
      <ProductFields f={f} setF={setF} options={options} showActive={false} />
      <div className="admin-field">
        <label>
          Pack sizes in kg (separate with commas)
          <input
            className="admin-input wide"
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
          />
        </label>
      </div>
      <p className="small muted">
        Set prices and stock for each pack after creating the product.
      </p>
      {err && <Notice kind="error">{err}</Notice>}
      <p>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Creating…" : "Create product"}
        </button>{" "}
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </p>
    </form>
  );
}

export function AdminProducts() {
  useDocumentTitle("Products & Stock");
  const [tick, setTick] = useState(0);
  const [adding, setAdding] = useState(false);
  const { data: options } = useAsync(adminApi.catalogOptions);
  const { data, error } = useAsync(adminApi.catalogProducts, [tick]);
  const reload = () => setTick((t) => t + 1);

  if (error) return <Notice kind="error">{error.message}</Notice>;
  if (!data || !options) return <Loading />;

  return (
    <>
      <h2>Products &amp; Stock</h2>
      <p>
        <button
          className="btn btn-accent btn-sm"
          onClick={() => setAdding(true)}
        >
          + Add product
        </button>
      </p>
      {adding && (
        <NewProduct
          options={options}
          onCreated={() => {
            setAdding(false);
            reload();
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {data.length === 0 ? (
        <EmptyState title="No products yet">
          Use the button above to add one.
        </EmptyState>
      ) : (
        data.map((p) => (
          <ProductEditor
            key={p.id}
            product={p}
            options={options}
            onChanged={reload}
          />
        ))
      )}
    </>
  );
}
