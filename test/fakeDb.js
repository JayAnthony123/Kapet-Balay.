"use strict";
/**
 * An in-memory stand-in for MySQL, used by the tests so they need no database.
 * It understands exactly the queries the models send; any other query throws,
 * so if a model's SQL changes without updating this file, the tests fail loudly.
 */
function createFakeDb({ failOn } = {}) {
  const state = {
    customers: [], nextCustomerId: 1,
    menu: [
      { menu_id: 1, item_name: "Americano", category: "Coffee", price: 100, availability: "Available" },
      { menu_id: 2, item_name: "Cafe Latte", category: "Coffee", price: 120, availability: "Available" },
      { menu_id: 3, item_name: "Club Sandwich", category: "Food", price: 150, availability: "Available" },
      { menu_id: 4, item_name: "Seasonal Special", category: "Food", price: 999, availability: "Unavailable" },
    ],
    seq: {},
    orders: [], nextOrderId: 1,
    items: [], nextItemId: 1,
  };

  const today = () => new Date().toISOString().slice(0, 10);
  const normalize = (sql) => sql.replace(/\s+/g, " ").trim();

  function run(sql, params = []) {
    const q = normalize(sql);

    if (q === "SELECT 1") return [{ 1: 1 }];

    if (q.startsWith("SELECT customer_id, username, password_hash FROM customers WHERE username = ?")) {
      const c = state.customers.find((x) => x.username.toLowerCase() === String(params[0]).toLowerCase());
      return c ? [{ ...c }] : [];
    }
    if (q === "INSERT INTO customers (username, password_hash) VALUES (?, ?)") {
      if (state.customers.some((x) => x.username.toLowerCase() === String(params[0]).toLowerCase())) {
        throw Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY" });
      }
      const row = { customer_id: state.nextCustomerId++, username: params[0], password_hash: params[1] };
      state.customers.push(row);
      return { insertId: row.customer_id, affectedRows: 1 };
    }

    if (q === "SELECT menu_id, item_name, category, price FROM menu_items WHERE availability = 'Available' ORDER BY menu_id") {
      return state.menu.filter((m) => m.availability === "Available").map(({ availability, ...m }) => m);
    }
    if (q === "SELECT menu_id, item_name, category, price FROM menu_items WHERE availability = 'Available' AND menu_id IN (?)") {
      return state.menu
        .filter((m) => m.availability === "Available" && params[0].includes(m.menu_id))
        .map(({ availability, ...m }) => m);
    }

    if (q === "INSERT IGNORE INTO daily_order_sequences (order_day, last_number) VALUES (CURDATE(), 0)") {
      state.seq[today()] ??= 0;
      return { affectedRows: 1 };
    }
    if (q === "SELECT last_number FROM daily_order_sequences WHERE order_day = CURDATE() FOR UPDATE") {
      return [{ last_number: state.seq[today()] }];
    }
    if (q === "UPDATE daily_order_sequences SET last_number = ? WHERE order_day = CURDATE()") {
      state.seq[today()] = params[0];
      return { affectedRows: 1 };
    }

    if (q.startsWith("INSERT INTO orders (customer_id, daily_order_number, total_amount, status, order_type, reservation_time, notes)")) {
      const [customer_id, daily_order_number, total_amount, order_type, reservation_time, notes] = params;
      const row = {
        order_id: state.nextOrderId++, customer_id, daily_order_number, total_amount,
        status: "Pending", order_type, reservation_time, notes, order_date: new Date(),
      };
      state.orders.push(row);
      return { insertId: row.order_id, affectedRows: 1 };
    }
    if (q === "INSERT INTO order_items (order_id, menu_id, quantity, price, subtotal) VALUES ?") {
      if (failOn === "order_items") throw new Error("simulated failure");
      for (const [order_id, menu_id, quantity, price, subtotal] of params[0]) {
        state.items.push({ order_item_id: state.nextItemId++, order_id, menu_id, quantity, price, subtotal });
      }
      return { affectedRows: params[0].length };
    }

    if (q.startsWith("SELECT order_id, daily_order_number, total_amount, status, order_type, reservation_time, notes, order_date FROM orders WHERE customer_id = ?")) {
      return state.orders.filter((o) => o.customer_id === params[0]).sort((a, b) => b.order_id - a.order_id).map((o) => ({ ...o }));
    }
    if (q.startsWith("SELECT oi.order_id, oi.menu_id, mi.item_name, oi.quantity, oi.price FROM order_items oi JOIN menu_items mi")) {
      return state.items
        .filter((i) => params[0].includes(i.order_id))
        .map((i) => ({
          order_id: i.order_id, menu_id: i.menu_id,
          item_name: state.menu.find((m) => m.menu_id === i.menu_id).item_name,
          quantity: i.quantity, price: i.price,
        }));
    }

    throw new Error(`FakeDb: unhandled SQL -> ${q}`);
  }

  // mysql2 answers [rows, fields]
  let snapshot = null;
  const pool = {
    query: async (sql, params) => [run(sql, params)],
    getConnection: async () => ({
      query: async (sql, params) => [run(sql, params)],
      beginTransaction: async () => { snapshot = structuredClone(state); },
      commit: async () => { snapshot = null; },
      rollback: async () => { if (snapshot) Object.assign(state, snapshot); snapshot = null; },
      release() {},
    }),
  };

  return { pool, state };
}

module.exports = { createFakeDb };
