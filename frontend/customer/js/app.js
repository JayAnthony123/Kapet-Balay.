(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const peso = (n) => "₱" + Number(n).toFixed(2);
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const API_URL = "/api";
  const STATUSES = ["Pending", "Preparing", "Ready", "Completed"];
  const MESSAGES = {
    Pending: "We got your order.",
    Preparing: "Your order is being prepared.",
    Ready: "Your order is ready! Please pick it up at the counter.",
    Completed: "Completed. Thank you for ordering!",
  };

  let demo = false; // true when there is no backend server
  let MENU = [];
  let user = null;
  let authMode = "login";
  let orderType = "Pick up";
  let category = "All";
  let currentView = "auth";
  const cart = new Map();
  
  async function realRequest(method, path, body) {
    const res = await fetch(API_URL + path, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined,
    });
    let payload = null;
    try { payload = await res.json(); } catch { /* not JSON */ }
    if (!res.ok || !payload || payload.success === false) {
      throw Object.assign(new Error(payload?.message || "Request failed."), { status: res.status });
    }
    return payload.data;
  }

  const api = (path, { method = "GET", body } = {}) =>
    demo ? DemoApi.request(method, path, body) : realRequest(method, path, body);

  async function serverIsAvailable() {
    if (location.protocol === "file:") return false; // double-clicked: there can't be a server
    try {
      const res = await fetch(API_URL + "/menu", { headers: { Accept: "application/json" } });
      const payload = await res.json();
      return typeof payload?.success === "boolean";
    } catch {
      return false;
    }
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function showView(name) {
    currentView = name;
    document.body.classList.toggle("is-auth", name === "auth");
    ["auth", "menu", "orders"].forEach(v => ($(`#${v}View`).hidden = v !== name));
    $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === name));
    if (name === "orders") renderOrders();
  }

  function enterApp(name) {
    user = name;
    $("#userName").textContent = name;
    $("#orderingAs").textContent = name;
    $("#userBox").hidden = false;
    $("#tabs").hidden = false;
    showView("menu");
    renderMenu();
    renderCart();
  }

  function leaveApp() {
    user = null;
    cart.clear();
    $("#userBox").hidden = true;
    $("#tabs").hidden = true;
    showView("auth");
  }

  /* ---------- auth ---------- */
  $$("[data-mode]").forEach(btn => btn.addEventListener("click", () => {
    authMode = btn.dataset.mode;
    $$("[data-mode]").forEach(b => b.classList.toggle("active", b === btn));
    const reg = authMode === "register";
    $("#authTitle").textContent = reg ? "Create your account" : "Login to your account";
    $("#authSub").textContent = reg ? "Sign up to start ordering" : "Enter your credentials to continue";
    $("#authSubmit").textContent = reg ? "Create account" : "Login";
    $("#heroTitle").textContent = reg ? "Join us!" : "Welcome back!";
    $("#heroSub").textContent = reg
      ? "Create an account to order ahead and skip the line."
      : "Order your favorite coffee and track it in real time.";
    $("#password").autocomplete = reg ? "new-password" : "current-password";
    $("#authError").textContent = "";
  }));

  $("#togglePw").addEventListener("click", () => {
    const pw = $("#password");
    const show = pw.type === "password";
    pw.type = show ? "text" : "password";
    $("#togglePw").textContent = show ? "Hide" : "Show";
  });

  $("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#authSubmit");
    btn.disabled = true;
    try {
      const data = await api(authMode === "register" ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: { username: $("#username").value.trim(), password: $("#password").value },
      });
      $("#authForm").reset();
      $("#authError").textContent = "";
      enterApp(data.username);
      toast(`Welcome, ${data.username}!`);
    } catch (err) {
      $("#authError").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  $("#logoutBtn").addEventListener("click", async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch { /* ignore */ }
    leaveApp();
  });

  $$(".tab").forEach(t => t.addEventListener("click", () => showView(t.dataset.view)));

  /* ---------- menu ---------- */
  function renderChips() {
    const cats = ["All", ...new Set(MENU.map(m => m.category))];
    $("#chips").innerHTML = cats
      .map(c => `<button class="chip ${c === category ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`)
      .join("");
  }

  function renderMenu() {
    renderChips();
    const q = $("#search").value.trim().toLowerCase();
    const items = MENU.filter(m =>
      (category === "All" || m.category === category) && m.name.toLowerCase().includes(q));
    $("#menuGrid").innerHTML = items.length
      ? items.map(m => `
        <div class="item">
          <span class="cat">${esc(m.category)}</span>
          <span class="name">${esc(m.name)}</span>
          <span class="price">${peso(m.price)}</span>
          <button data-add="${m.id}">+ Add to order</button>
        </div>`).join("")
      : `<p class="empty">No items found.</p>`;
  }

  $("#chips").addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (!c) return;
    category = c.dataset.cat;
    renderMenu();
  });
  $("#search").addEventListener("input", renderMenu);
  $("#menuGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const id = +b.dataset.add;
    cart.set(id, Math.min((cart.get(id) || 0) + 1, 20));
    renderCart();
  });

  const cartLines = () => [...cart].map(([id, qty]) => ({ ...MENU.find(m => m.id === id), qty }));

  function renderCart() {
    const lines = cartLines();
    $("#cartItems").innerHTML = lines.length
      ? lines.map(l => `
        <div class="cart-line">
          <span>${esc(l.name)}<br><small class="muted">${peso(l.price)}</small></span>
          <span class="qty">
            <button data-dec="${l.id}" aria-label="Decrease">−</button>
            ${l.qty}
            <button data-inc="${l.id}" aria-label="Increase">+</button>
          </span>
        </div>`).join("")
      : `<p class="muted" style="text-align:center">Your order is empty. Add something from the menu.</p>`;
    $("#cartTotal").textContent = peso(lines.reduce((s, l) => s + l.price * l.qty, 0));
    $("#placeOrder").disabled = lines.length === 0;
  }

  $("#cartItems").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    if (inc) { const id = +inc.dataset.inc; cart.set(id, Math.min(cart.get(id) + 1, 20)); }
    if (dec) {
      const id = +dec.dataset.dec;
      const q = cart.get(id) - 1;
      q <= 0 ? cart.delete(id) : cart.set(id, q);
    }
    renderCart();
  });

  $$("[data-type]").forEach(btn => btn.addEventListener("click", () => {
    orderType = btn.dataset.type;
    $$("[data-type]").forEach(b => b.classList.toggle("active", b === btn));
    const res = orderType === "Reservation";
    $("#resWrap").hidden = !res;
    $("#typeHint").textContent = res
      ? "Choose when you'd like to arrive."
      : "Pick up at the counter when your order is ready.";
  }));

  $("#placeOrder").addEventListener("click", async () => {
    const lines = cartLines();
    if (!lines.length) return;
    let reservationTime = null;
    if (orderType === "Reservation") {
      const v = $("#resTime").value;
      if (!v) return toast("Please choose a reservation date & time.");
      const d = new Date(v);
      if (d < new Date()) return toast("Reservation time must be in the future.");
      reservationTime = d.toISOString();
    }
    const btn = $("#placeOrder");
    btn.disabled = true;
    try {
      await api("/orders", {
        method: "POST",
        body: {
          items: lines.map(l => ({ id: l.id, qty: l.qty })), // prices are decided by the server
          type: orderType,
          reservationTime,
          notes: $("#notes").value.trim(),
        },
      });
      cart.clear();
      $("#notes").value = "";
      $("#resTime").value = "";
      renderCart();
      toast("Order placed!");
      showView("orders");
    } catch (err) {
      if (err.status === 401) { toast("Session expired. Please log in again."); leaveApp(); }
      else toast(err.message);
    } finally {
      btn.disabled = cart.size === 0;
    }
  });

  async function renderOrders() {
    let orders;
    try { orders = await api("/orders"); }
    catch (err) {
      if (err.status === 401) leaveApp();
      return;
    }
    if (currentView !== "orders") return;
    if (!orders.length) {
      $("#ordersList").innerHTML = `<p class="muted" style="margin-top:20px">No orders yet. Pick something from the menu!</p>`;
      return;
    }
    $("#ordersList").innerHTML = orders.map(o => {
      const idx = Math.max(STATUSES.indexOf(o.status), 0);
      const pct = (idx / (STATUSES.length - 1)) * 100;
      const summary = o.items.map(i => `${i.qty}x ${esc(i.name)}`).join(", ");
      const when = new Date(o.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
      const res = o.reservationTime
        ? ` · ${new Date(o.reservationTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
        : "";
      return `
      <article class="order">
        <div class="order-head">
          <h3>Order #${o.number}</h3>
          <span class="badge ${o.status.toLowerCase()}">${o.status}</span>
        </div>
        <div class="order-sub">${esc(user)} · ${esc(o.type)}${res}</div>
        <div class="stepper">
          <div class="fill" style="width:${pct}%"></div>
          ${STATUSES.map((s, i) => `<div class="step ${i <= idx ? "done" : ""}"><span class="dot"></span>${s}</div>`).join("")}
        </div>
        <div class="status-msg">${MESSAGES[o.status]}</div>
        <div class="order-foot">
          <div>
            <div>${summary}</div>
            <div>${when}</div>
            ${o.notes ? `<div class="order-notes">Note: ${esc(o.notes)}</div>` : ""}
          </div>
          <strong>${peso(o.total)}</strong>
        </div>
      </article>`;
    }).join("");
  }

  setInterval(() => {
    if (!document.hidden && currentView === "orders" && user) renderOrders();
  }, 4000);

  (async function init() {
    demo = !(await serverIsAvailable());
    $("#demoBanner").hidden = !demo;

    try { MENU = await api("/menu"); }
    catch (err) { toast(err.message || "Can't load the menu."); }

    try {
      const me = await api("/auth/me");
      enterApp(me.username);
    } catch {
      showView("auth");
    }
  })();
})();
