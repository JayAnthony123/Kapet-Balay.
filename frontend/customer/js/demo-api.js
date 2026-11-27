const DemoApi = (() => {
  const KEYS = { users: "kb_demo_users", orders: "kb_demo_orders", session: "kb_demo_session" };

  const MENU = [
    { id: 1,  name: "Americano",         category: "Coffee",     price: 100 },
    { id: 2,  name: "Cafe Latte",        category: "Coffee",     price: 120 },
    { id: 3,  name: "Caramel Macchiato", category: "Coffee",     price: 140 },
    { id: 4,  name: "Chocolate Drink",   category: "Non-Coffee", price: 120 },
    { id: 5,  name: "Matcha Latte",      category: "Non-Coffee", price: 130 },
    { id: 6,  name: "Club Sandwich",     category: "Food",       price: 150 },
    { id: 7,  name: "French Fries",      category: "Food",       price: 85 },
    { id: 8,  name: "Cheeseburger",      category: "Food",       price: 130 },
    { id: 9,  name: "Chicken Sandwich",  category: "Food",       price: 140 },
    { id: 10, name: "Nachos",            category: "Food",       price: 110 },
    { id: 11, name: "Croissant",         category: "Pastry",     price: 75 },
    { id: 12, name: "Chocolate Muffin",  category: "Pastry",     price: 65 },
    { id: 13, name: "Cookies",           category: "Pastry",     price: 55 },
    { id: 14, name: "Cinnamon Roll",     category: "Pastry",     price: 85 },
    { id: 15, name: "Cheese Danish",     category: "Pastry",     price: 80 },
  ];

  const fail = (status, message) => Object.assign(new Error(message), { status });
  const memory = {};
  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? (memory[key] ?? fallback) : JSON.parse(raw);
    } catch { return memory[key] ?? fallback; }
  };
  const write = (key, value) => {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* keep memory copy */ }
  };

  async function hash(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 5381; // fallback when the page is not in a secure context
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return "x" + h;
  }

  function statusFor(order) {
    const age = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
    if (age < 20) return "Pending";
    if (age < 60) return "Preparing";
    if (age < 120) return "Ready";
    return "Completed";
  }

  const requireUser = () => {
    const user = read(KEYS.session, null);
    if (!user) throw fail(401, "Please log in.");
    return user;
  };

  async function authenticate(isRegister, body) {
    const username = body.username, password = body.password;
    if (isRegister) {
      if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,20}$/.test(username))
        throw fail(400, "Username must be 3-20 letters, numbers or underscore.");
      if (typeof password !== "string" || password.length < 4 || password.length > 100)
        throw fail(400, "Password must be 4-100 characters.");
    }
    const users = read(KEYS.users, {});
    const key = String(username || "").toLowerCase();

    if (isRegister) {
      if (users[key]) throw fail(409, "That username is already taken.");
      users[key] = { username, password: await hash(password) };
      write(KEYS.users, users);
    } else if (!users[key] || users[key].password !== (await hash(String(password ?? "")))) {
      throw fail(401, "Wrong username or password.");
    }
    write(KEYS.session, users[key].username);
    return { username: users[key].username };
  }

  function createOrder(user, body) {
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 30)
      throw fail(400, "Your order is empty.");

    const qtyById = new Map();
    for (const line of body.items) {
      const id = Number(line?.id), qty = Number(line?.qty);
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 20)
        throw fail(400, "Invalid item or quantity.");
      qtyById.set(id, (qtyById.get(id) || 0) + qty);
    }
    const items = [...qtyById].map(([id, qty]) => {
      const m = MENU.find((x) => x.id === id);
      if (!m || qty > 20) throw fail(400, "Some items are not available.");
      return { id, name: m.name, price: m.price, qty };
    });

    if (!["Pick up", "Reservation"].includes(body.type)) throw fail(400, "Invalid order type.");
    let reservationTime = null;
    if (body.type === "Reservation") {
      const when = new Date(body.reservationTime);
      if (isNaN(when) || when.getTime() < Date.now()) throw fail(400, "Choose a reservation time in the future.");
      reservationTime = when.toISOString();
    }

    const orders = read(KEYS.orders, []);
    const today = new Date().toDateString();
    const number = orders.filter((o) => new Date(o.createdAt).toDateString() === today).length + 1;
    const order = {
      id: (orders.reduce((max, o) => Math.max(max, o.id), 0)) + 1,
      user, number, items,
      total: items.reduce((s, i) => s + i.price * i.qty, 0),
      type: body.type, reservationTime,
      notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 120) : "",
      createdAt: new Date().toISOString(),
    };
    orders.push(order);
    write(KEYS.orders, orders);
    return { ...order, status: statusFor(order) };
  }

  /** Same shape as the real API: resolves with the data, or throws an Error with .status */
  async function request(method, path, body = {}) {
    switch (`${method} ${path}`) {
      case "GET /menu":           return MENU;
      case "POST /auth/register": return authenticate(true, body);
      case "POST /auth/login":    return authenticate(false, body);
      case "POST /auth/logout":   write(KEYS.session, null); return { ok: true };
      case "GET /auth/me":        return { username: requireUser() };
      case "GET /orders": {
        const user = requireUser();
        return read(KEYS.orders, [])
          .filter((o) => o.user.toLowerCase() === user.toLowerCase())
          .sort((a, b) => b.id - a.id)
          .map((o) => ({ ...o, status: statusFor(o) }));
      }
      case "POST /orders":        return createOrder(requireUser(), body);
      default:                    throw fail(404, "Not found.");
    }
  }

  return { request };
})();
