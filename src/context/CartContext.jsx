import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const KEY = 'jfm_cart_v1';
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};

// Lines: { slug, size, qty }. In the dynamic release this syncs to GET/PUT /api/cart per signed-in user.
export function CartProvider({ children }) {
  const [lines, setLines] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable */ }
  }, [lines]);

  const add = useCallback((slug, size, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.slug === slug && l.size === size);
      if (i === -1) return [...prev, { slug, size, qty }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + qty };
      return next;
    });
  }, []);

  const setQty = useCallback((slug, size, qty) => {
    setLines((prev) =>
      prev.flatMap((l) => (l.slug === slug && l.size === size ? (qty > 0 ? [{ ...l, qty }] : []) : [l]))
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const value = useMemo(() => ({ lines, add, setQty, clear, count }), [lines, add, setQty, clear, count]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
