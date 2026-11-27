"use strict";
process.env.AUTH_RATE_LIMIT = "1000"; // so the tests can register many users

const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const app = require("../app");
const db = require("../backend/config/db");
const Session = require("../backend/services/session.service");
const { rateLimit } = require("../backend/middleware/rateLimit.middleware");
const { createFakeDb } = require("./fakeDb");

let server, base, fake;

before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => {
  fake = createFakeDb();
  db.setPool(fake.pool);
});

/** A tiny browser: remembers the login cookie between calls. */
function browser() {
  let cookie = "";
  const call = async (method, url, body) => {
    const res = await fetch(base + url, {
      method,
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    const setCookie = res.headers.getSetCookie();
    for (const c of setCookie) {
      const pair = c.split(";")[0];
      cookie = pair.endsWith("=") ? "" : pair;
    }
    let json = null;
    try { json = await res.json(); } catch { /* not json */ }
    return { status: res.status, json, setCookie };
  };
  call.setCookie = (c) => { cookie = c; };
  return call;
}

async function loggedIn(username = "budz") {
  const b = browser();
  const r = await b("POST", "/api/auth/register", { username, password: "pass1234" });
  assert.equal(r.status, 201);
  return b;
}

/* ------------------------------------------------------------ menu */
test("menu lists only available items, with numeric prices", async () => {
  const r = await browser()("GET", "/api/menu");
  assert.equal(r.status, 200);
  assert.equal(r.json.success, true);
  assert.deepEqual(r.json.data.map((m) => m.name), ["Americano", "Cafe Latte", "Club Sandwich"]);
  assert.equal(typeof r.json.data[0].price, "number");
});

/* ------------------------------------------------------------ auth */
test("register validates the username and password", async () => {
  const b = browser();
  assert.equal((await b("POST", "/api/auth/register", { username: "a b", password: "pass1234" })).status, 400);
  assert.equal((await b("POST", "/api/auth/register", { username: "ab", password: "pass1234" })).status, 400);
  assert.equal((await b("POST", "/api/auth/register", { username: "budz", password: "123" })).status, 400);
  assert.equal((await b("POST", "/api/auth/register", {})).status, 400);
});

test("register logs you in with an HttpOnly cookie, and never stores the plain password", async () => {
  const b = browser();
  const r = await b("POST", "/api/auth/register", { username: "budz", password: "pass1234" });
  assert.equal(r.status, 201);
  assert.deepEqual(r.json.data, { username: "budz" });
  assert.match(r.setCookie[0], /HttpOnly/i);
  assert.match(r.setCookie[0], /SameSite=Lax/i);
  const me = await b("GET", "/api/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.json.data.username, "budz");
  assert.ok(!JSON.stringify(fake.state.customers).includes("pass1234"));
  assert.match(fake.state.customers[0].password_hash, /^[0-9a-f]{32}:[0-9a-f]{128}$/);
});

test("duplicate usernames are rejected, ignoring case", async () => {
  await loggedIn("budz");
  const r = await browser()("POST", "/api/auth/register", { username: "BUDZ", password: "other1234" });
  assert.equal(r.status, 409);
});

test("login: wrong password, unknown user, then success", async () => {
  await loggedIn("budz");
  const b = browser();
  assert.equal((await b("POST", "/api/auth/login", { username: "budz", password: "nope" })).status, 401);
  assert.equal((await b("POST", "/api/auth/login", { username: "ghost", password: "pass1234" })).status, 401);
  assert.equal((await b("POST", "/api/auth/login", { username: "budz" })).status, 401);
  const ok = await b("POST", "/api/auth/login", { username: "BuDz", password: "pass1234" });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.username, "budz");
});

test("logout clears the session", async () => {
  const b = await loggedIn();
  assert.equal((await b("POST", "/api/auth/logout")).status, 200);
  assert.equal((await b("GET", "/api/auth/me")).status, 401);
});

test("tampered and expired cookies are refused", async () => {
  const b = await loggedIn();
  const good = Session.createToken({ id: 1, username: "budz" });
  const [payload, sig] = good.split(".");

  const forged = Buffer.from(JSON.stringify({ id: 99, username: "admin", exp: Date.now() + 1e9 })).toString("base64url");
  b.setCookie(`${Session.COOKIE_NAME}=${forged}.${sig}`);
  assert.equal((await b("GET", "/api/auth/me")).status, 401);

  b.setCookie(`${Session.COOKIE_NAME}=garbage`);
  assert.equal((await b("GET", "/api/auth/me")).status, 401);

  const realDateNow = Date.now;
  Date.now = () => realDateNow() + 8 * 24 * 60 * 60 * 1000; // 8 days later
  try {
    b.setCookie(`${Session.COOKIE_NAME}=${payload}.${sig}`);
    assert.equal((await b("GET", "/api/auth/me")).status, 401);
  } finally {
    Date.now = realDateNow;
  }
});

test("order routes need a login", async () => {
  const b = browser();
  assert.equal((await b("GET", "/api/orders")).status, 401);
  assert.equal((await b("POST", "/api/orders", { items: [{ id: 1, qty: 1 }], type: "Pick up" })).status, 401);
});

/* ------------------------------------------------------------ orders */
test("placing an order: prices come from the database, duplicate lines merge", async () => {
  const b = await loggedIn();
  const r = await b("POST", "/api/orders", {
    items: [{ id: 1, qty: 1, price: 1 }, { id: 2, qty: 2 }, { id: 1, qty: 1 }],
    type: "Pick up",
    notes: "  less sugar  ",
  });
  assert.equal(r.status, 201);
  const o = r.json.data;
  assert.equal(o.status, "Pending");
  assert.equal(o.number, 1);
  assert.equal(o.total, 2 * 100 + 2 * 120);
  assert.equal(o.notes, "less sugar");
  assert.equal(o.reservationTime, null);
  assert.deepEqual(o.items.map((i) => [i.name, i.price, i.qty]), [["Americano", 100, 2], ["Cafe Latte", 120, 2]]);
  assert.ok(!isNaN(new Date(o.createdAt)));
});

test("daily order numbers count up, and each customer sees only their own orders", async () => {
  const a = await loggedIn("alice");
  const b = await loggedIn("bob");
  const one = await a("POST", "/api/orders", { items: [{ id: 1, qty: 1 }], type: "Pick up" });
  const two = await b("POST", "/api/orders", { items: [{ id: 2, qty: 1 }], type: "Pick up" });
  const three = await a("POST", "/api/orders", { items: [{ id: 3, qty: 1 }], type: "Pick up" });
  assert.deepEqual([one, two, three].map((r) => r.json.data.number), [1, 2, 3]);

  const mineA = (await a("GET", "/api/orders")).json.data;
  assert.deepEqual(mineA.map((o) => o.number), [3, 1]); // newest first
  const mineB = (await b("GET", "/api/orders")).json.data;
  assert.deepEqual(mineB.map((o) => o.number), [2]);
});

test("bad orders are rejected", async () => {
  const b = await loggedIn();
  const post = (body) => b("POST", "/api/orders", body);
  assert.equal((await post({ items: [], type: "Pick up" })).status, 400);
  assert.equal((await post({ type: "Pick up" })).status, 400);
  assert.equal((await post({ items: [{ id: 1, qty: 0 }], type: "Pick up" })).status, 400);
  assert.equal((await post({ items: [{ id: 1, qty: 21 }], type: "Pick up" })).status, 400);
  assert.equal((await post({ items: [{ id: 1, qty: 11 }, { id: 1, qty: 11 }], type: "Pick up" })).status, 400);
  assert.equal((await post({ items: [{ id: 1.5, qty: 1 }], type: "Pick up" })).status, 400);
  assert.equal((await post({ items: [{ id: 999, qty: 1 }], type: "Pick up" })).status, 400);
  assert.equal((await post({ items: [{ id: 4, qty: 1 }], type: "Pick up" })).status, 400); // unavailable item
  assert.equal((await post({ items: [{ id: 1, qty: 1 }], type: "Delivery" })).status, 400);
  assert.equal(fake.state.orders.length, 0);
});

test("reservations need a future time", async () => {
  const b = await loggedIn();
  const items = [{ id: 1, qty: 1 }];
  assert.equal((await b("POST", "/api/orders", { items, type: "Reservation" })).status, 400);
  assert.equal((await b("POST", "/api/orders", { items, type: "Reservation", reservationTime: "2020-01-01T10:00:00Z" })).status, 400);

  const when = new Date(Date.now() + 3600e3).toISOString();
  const ok = await b("POST", "/api/orders", { items, type: "Reservation", reservationTime: when });
  assert.equal(ok.status, 201);
  assert.equal(ok.json.data.type, "Reservation");
  assert.equal(ok.json.data.reservationTime, when);
});

test("a failure while saving rolls everything back", async () => {
  fake = createFakeDb({ failOn: "order_items" });
  db.setPool(fake.pool);
  const b = await loggedIn();
  const r = await b("POST", "/api/orders", { items: [{ id: 1, qty: 1 }], type: "Pick up" });
  assert.equal(r.status, 500);
  assert.equal(r.json.success, false);
  assert.equal(r.json.message, "Server error."); // no internal details leak
  assert.equal(fake.state.orders.length, 0);
  assert.ok(!Object.values(fake.state.seq).some((n) => n > 0)); // order number was not used up
});

/* ------------------------------------------------------------ misc */
test("errors are JSON: bad JSON, unknown API route", async () => {
  const b = await loggedIn();
  const bad = await b("POST", "/api/orders", "{oops");
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.json, { success: false, message: "Invalid JSON." });
  const nf = await b("GET", "/api/nothing");
  assert.equal(nf.status, 404);
  assert.equal(nf.json.success, false);
});

test("rate limiter blocks after the limit", async () => {
  const limiter = rateLimit({ limit: 3, windowMs: 60_000 });
  const req = { ip: "1.2.3.4", socket: {} };
  const results = [];
  for (let i = 0; i < 5; i++) limiter(req, {}, (err) => results.push(err ? err.status : "ok"));
  assert.deepEqual(results, ["ok", "ok", "ok", 429, 429]);
});

test("the customer page is served, and nothing outside it", async () => {
  const home = await fetch(base + "/");
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Kape't Balay/);
  assert.equal((await fetch(base + "/css/styles.css")).status, 200);
  assert.equal((await fetch(base + "/js/app.js")).status, 200);
  assert.equal((await fetch(base + "/html/index.html")).status, 200);
  for (const p of ["/.env", "/..%2Fapp.js", "/..%2F.env", "/%2e%2e/app.js", "/backend/config/env.js", "/package.json"]) {
    const r = await fetch(base + p);
    assert.ok([403, 404].includes(r.status), `${p} -> ${r.status}`);
  }
});
