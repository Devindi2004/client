import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import {
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ChefHat,
  ClipboardList,
  CreditCard,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  MessageSquare,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Star,
  Moon,
  Sun,
  Table2,
  Trash2,
  Users,
  Utensils,
  WalletCards,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const DEFAULT_RESTAURANT_ID = localStorage.getItem("dineflow_restaurant_id") || "";

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dineflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const unwrap = (response) => response.data?.data ?? response.data;
const money = (value = 0) => `LKR ${Number(value).toLocaleString()}`;
const orderStatuses = ["pending", "accepted", "preparing", "ready", "served", "completed", "cancelled"];

const AuthContext = createContext(null);
const CartContext = createContext(null);
const SocketContext = createContext(null);
const ThemeContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function useCart() {
  return useContext(CartContext);
}

function useSocket() {
  return useContext(SocketContext);
}

function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("dineflow_theme") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("dineflow_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("dineflow_user") || "null"));
  const [token, setToken] = useState(() => localStorage.getItem("dineflow_token"));

  const login = async (email, password) => {
    const data = unwrap(await api.post("/auth/login", { email, password }));
    localStorage.setItem("dineflow_token", data.accessToken);
    localStorage.setItem("dineflow_refresh", data.refreshToken);
    localStorage.setItem("dineflow_user", JSON.stringify(data.user));
    if (data.user?.restaurantId) localStorage.setItem("dineflow_restaurant_id", data.user.restaurantId);
    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = unwrap(await api.post("/auth/register", payload));
    localStorage.setItem("dineflow_token", data.accessToken);
    localStorage.setItem("dineflow_refresh", data.refreshToken);
    localStorage.setItem("dineflow_user", JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("dineflow_token");
    localStorage.removeItem("dineflow_refresh");
    localStorage.removeItem("dineflow_user");
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, login, register, logout }}>{children}</AuthContext.Provider>;
}

function CartProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("dineflow_cart") || "[]"));
  useEffect(() => localStorage.setItem("dineflow_cart", JSON.stringify(items)), [items]);
  const add = (item) => {
    setItems((current) => {
      const existing = current.find((entry) => entry._id === item._id);
      if (existing) return current.map((entry) => (entry._id === item._id ? { ...entry, quantity: entry.quantity + 1 } : entry));
      return [...current, { ...item, quantity: 1, specialInstructions: "" }];
    });
  };
  const update = (id, patch) => setItems((current) => current.map((item) => (item._id === id ? { ...item, ...patch } : item)));
  const remove = (id) => setItems((current) => current.filter((item) => item._id !== id));
  const clear = () => setItems([]);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <CartContext.Provider value={{ items, add, update, remove, clear, total }}>{children}</CartContext.Provider>;
}

function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    const connection = io(SOCKET_URL, { auth: { token } });
    if (user?.role) connection.emit("join-role", user.role === "chef" || user.role === "staff" ? "kitchen" : user.role);
    connection.on("order:ready", (order) => setAlerts((current) => [`${order.orderNumber} ready for Table ${order.tableNumber}`, ...current].slice(0, 5)));
    connection.on("order:new", (order) => setAlerts((current) => [`New order ${order.orderNumber}`, ...current].slice(0, 5)));
    setSocket(connection);
    return () => connection.disconnect();
  }, [token, user?.role]);
  return <SocketContext.Provider value={{ socket, alerts }}>{children}</SocketContext.Provider>;
}

function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>{children}</SocketProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle dark and light mode">
      <span className={isDark ? "active" : ""}><Moon size={16} /> Dark</span>
      <span className={!isDark ? "active" : ""}><Sun size={16} /> Light</span>
    </button>
  );
}

function Button({ children, className = "", variant = "primary", ...props }) {
  const styles = variant === "ghost" ? "btn-ghost" : variant === "soft" ? "btn-soft" : "btn-primary";
  return <button className={`btn ${styles} ${className}`} {...props}>{children}</button>;
}

function Input(props) {
  return <input className="input" {...props} />;
}

function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{status}</span>;
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <Icon size={22} />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon = Utensils, title, text }) {
  return (
    <div className="empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Header({ title, actions }) {
  const { user, logout } = useAuth();
  return (
    <header className="header">
      <div>
        <p className="eyebrow">DineFlow</p>
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        <ThemeToggle />
        {actions}
        {user && <Button variant="ghost" onClick={logout}><LogOut size={16} /> Logout</Button>}
      </div>
    </header>
  );
}

function Sidebar({ links }) {
  return (
    <aside className="sidebar">
      <Link to="/" className="brand"><ChefHat /> DineFlow</Link>
      <nav>{links.map((link) => <Link key={link.to} to={link.to}><link.icon size={18} /> {link.label}</Link>)}</nav>
    </aside>
  );
}

function MobileNav({ links }) {
  return <nav className="mobile-nav">{links.map((link) => <Link key={link.to} to={link.to}><link.icon size={18} /><span>{link.label}</span></Link>)}</nav>;
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head"><h3>{title}</h3><Button variant="ghost" onClick={onClose}>Close</Button></div>
        {children}
      </div>
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id || row.id || JSON.stringify(row)}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return children;
}

function roleHome(role) {
  if (role === "admin") return "/admin";
  if (role === "waiter") return "/waiter";
  if (role === "chef" || role === "staff" || role === "kitchen") return "/kitchen";
  return "/customer";
}

function LandingPage() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link to="/" className="brand landing-brand"><ChefHat /> <span>DineFlow<small>Smart Dining</small></span></Link>
        <div>
          <ThemeToggle />
          <Link to="/login">For Restaurants</Link>
          <Link className="btn btn-primary" to="/menu/demo-table">Order now <Plus size={16} /></Link>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AI-powered restaurant flow</p>
          <h1>DineFlow</h1>
          <p>A smart restaurant ordering and management system connecting QR menus, personalized recommendations, live kitchen operations, waiter alerts, payments, and owner analytics in one polished platform.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/menu/demo-table"><QrCode size={18} /> Browse digital menu</Link>
            <Link className="btn btn-soft" to="/login"><Users size={18} /> View platform</Link>
          </div>
          <div className="hero-metrics">
            <div><strong>40%</strong><span>faster service</span></div>
            <div><strong>24/7</strong><span>digital menu</span></div>
            <div><strong>4</strong><span>role dashboards</span></div>
            <div><strong>AI</strong><span>recommendations</span></div>
          </div>
        </div>
      </section>
      <section className="role-grid">
        {[
          ["Customer", "Browse, order, pay, track, reserve, review.", ShoppingCart],
          ["Waiter", "Mobile table status and ready order alerts.", Bell],
          ["Kitchen", "Large incoming order board with clear notes.", ChefHat],
          ["Admin", "Analytics, users, tables, menu, inventory, reports.", BarChart3],
        ].map(([title, text, Icon]) => <div className="feature-card" key={title}><Icon /><h3>{title}</h3><p>{text}</p></div>)}
      </section>
    </main>
  );
}

function LoginPage({ mode = "login" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "customer@example.com", password: "Customer@123", phone: "", role: "customer" });
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const user = mode === "register" ? await register(form) : await login(form.email, form.password);
      navigate(roleHome(user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed.");
    }
  };
  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <ChefHat size={34} />
        <h1>{mode === "register" ? "Create account" : "Welcome back"}</h1>
        {mode === "register" && <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
        <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {mode === "register" && <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}
        {mode === "register" && <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>customer</option><option>waiter</option><option>chef</option><option>staff</option></select>}
        {error && <p className="error">{error}</p>}
        <Button>{mode === "register" ? "Register" : "Login"}</Button>
        <div className="demo-logins">
          <span>admin@example.com / Admin@123</span>
          <span>waiter@example.com / Waiter@123</span>
          <span>chef@example.com / Chef@123</span>
          <span>customer@example.com / Customer@123</span>
        </div>
        <Link to={mode === "register" ? "/login" : "/register"}>{mode === "register" ? "Have an account?" : "Create a customer account"}</Link>
      </form>
    </main>
  );
}

function useResource(path, fallback = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      setData(unwrap(await api.get(path)));
    } catch {
      setData(fallback);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [path]);
  return { data, setData, loading, load };
}

function CustomerLayout({ children }) {
  const links = [
    { to: "/customer", label: "Home", icon: Home },
    { to: "/customer/menu", label: "Menu", icon: Utensils },
    { to: "/customer/cart", label: "Cart", icon: ShoppingCart },
    { to: "/customer/tracking", label: "Track", icon: ClipboardList },
    { to: "/customer/reservations", label: "Reserve", icon: CalendarDays },
  ];
  return <div className="app-shell customer-shell"><MobileNav links={links} /><main>{children}</main></div>;
}

function CustomerDashboard() {
  const { user } = useAuth();
  const { data: orders } = useResource("/orders/my");
  return (
    <CustomerLayout>
      <Header title={`Hi, ${user?.name || "guest"}`} actions={<Link className="btn btn-primary" to="/customer/menu"><MenuIcon size={16} /> Order now</Link>} />
      <div className="stats-grid">
        <StatCard icon={Star} label="Loyalty points" value={user?.loyaltyPoints || 0} />
        <StatCard icon={ClipboardList} label="Orders" value={orders.length} />
        <StatCard icon={WalletCards} label="Last total" value={orders[0] ? money(orders[0].totalAmount) : money(0)} />
      </div>
      <AIChatbot />
      <OrderList orders={orders.slice(0, 4)} />
    </CustomerLayout>
  );
}

function MenuPage() {
  const { tableId } = useParams();
  const { add } = useCart();
  const { data: menu } = useResource("/menu");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(menu.map((item) => item.category))];
  const filtered = menu.filter((item) => (category === "All" || item.category === category) && item.name.toLowerCase().includes(query.toLowerCase()));
  if (tableId) localStorage.setItem("dineflow_table_id", tableId);
  return (
    <CustomerLayout>
      <Header title={tableId ? `Table ${tableId} Menu` : "Menu"} actions={<Link className="btn btn-soft" to="/customer/cart"><ShoppingCart size={16} /> Cart</Link>} />
      <div className="toolbar">
        <label className="search"><Search size={18} /><Input placeholder="Search dishes" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <div className="tabs">{categories.map((name) => <button className={category === name ? "active" : ""} onClick={() => setCategory(name)} key={name}>{name}</button>)}</div>
      </div>
      <div className="menu-grid">{filtered.map((item) => <MenuItemCard key={item._id} item={item} onAdd={() => add(item)} />)}</div>
    </CustomerLayout>
  );
}

function MenuItemCard({ item, onAdd }) {
  const image = item.imageUrl?.startsWith("http") ? item.imageUrl : `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80`;
  return (
    <article className="menu-card">
      <img src={image} alt={item.name} />
      <div>
        <span>{item.category}</span>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="card-foot"><strong>{money(item.price)}</strong><Button onClick={onAdd}><Plus size={16} /> Add</Button></div>
      </div>
    </article>
  );
}

function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const subtotal = cart.total;
  const serviceFee = cart.items.length ? 250 : 0;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + serviceFee + tax;
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CustomerLayout>
      <Header title="Cart" actions={<Link className="btn btn-primary" to="/customer/checkout"><CreditCard size={16} /> Checkout</Link>} />
      {!cart.items.length ? <EmptyState title="Your cart is empty" text="Add dishes from the menu to begin." /> : (
        <section className="cart-page">
          <div className="cart-main-panel">
            <button className="cart-back" type="button" onClick={() => navigate("/customer/menu")}>
              <ChevronLeft size={22} /> Shopping Continue
            </button>
            <div className="cart-title-row">
              <div>
                <h2>Shopping cart</h2>
                <p>You have {itemCount} item{itemCount === 1 ? "" : "s"} in your cart</p>
              </div>
              <Link className="btn btn-soft" to="/customer/menu"><Plus size={16} /> Add more</Link>
            </div>
            <div className="cart-list pro-cart-list">
              {cart.items.map((item) => (
                <article className="cart-row pro-cart-row" key={item._id}>
                  <img
                    className="cart-thumb"
                    src={item.imageUrl?.startsWith("http") ? item.imageUrl : "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=85"}
                    alt={item.name}
                  />
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <p>{item.specialInstructions || "Add special instructions for the kitchen"}</p>
                    <Input placeholder="Special instructions" value={item.specialInstructions} onChange={(e) => cart.update(item._id, { specialInstructions: e.target.value })} />
                  </div>
                  <div className="cart-qty-control">
                    <button type="button" onClick={() => cart.update(item._id, { quantity: item.quantity + 1 })}><ChevronUp size={18} /></button>
                    <strong>{item.quantity}</strong>
                    <button type="button" onClick={() => cart.update(item._id, { quantity: Math.max(1, item.quantity - 1) })}><ChevronDown size={18} /></button>
                  </div>
                  <strong className="cart-line-price">{money(item.price * item.quantity)}</strong>
                  <button className="cart-delete" type="button" onClick={() => cart.remove(item._id)} aria-label={`Remove ${item.name}`}>
                    <Trash2 size={22} />
                  </button>
                </article>
              ))}
            </div>
          </div>

          <aside className="cart-summary-card">
            <div className="cart-summary-head">
              <div>
                <span className="eyebrow">Secure checkout</span>
                <h2>Order Details</h2>
              </div>
              <div className="cart-avatar"><ChefHat size={22} /></div>
            </div>
            <p className="summary-label">Payment type</p>
            <div className="payment-type-grid">
              <span>Cash</span>
              <span>Card</span>
              <span>PayHere</span>
              <span>All</span>
            </div>
            <label className="summary-field">
              Customer name
              <Input placeholder="Name" />
            </label>
            <label className="summary-field">
              Table number
              <Input placeholder={localStorage.getItem("dineflow_table_id") || "01"} />
            </label>
            <div className="summary-mini-grid">
              <label className="summary-field">Coupon<Input placeholder="DINEFLOW" /></label>
              <label className="summary-field">Guests<Input placeholder="2" /></label>
            </div>
            <div className="summary-totals">
              <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <div><span>Service fee</span><strong>{money(serviceFee)}</strong></div>
              <div><span>Tax</span><strong>{money(tax)}</strong></div>
              <div className="grand-total"><span>Total</span><strong>{money(total)}</strong></div>
            </div>
            <Link className="cart-checkout-btn" to="/customer/checkout">
              <span>{money(total)}</span>
              <strong>Checkout</strong>
              <Plus size={18} />
            </Link>
          </aside>
        </section>
      )}
    </CustomerLayout>
  );
}

function CheckoutPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customerName: user?.name || "", contactNumber: user?.phone || "", tableNumber: localStorage.getItem("dineflow_table_id") || "01", paymentMethod: "cash", specialInstructions: "" });
  const placeOrder = async () => {
    const payload = {
      ...form,
      totalAmount: cart.total,
      restaurantId: user?.restaurantId || DEFAULT_RESTAURANT_ID || undefined,
      items: cart.items.map((item) => ({ menuItem: item._id, quantity: item.quantity, price: item.price, specialInstructions: item.specialInstructions })),
    };
    const order = unwrap(await api.post("/orders", payload));
    await api.post("/payments", { orderId: order._id, paymentMethod: form.paymentMethod, amount: cart.total });
    cart.clear();
    navigate(`/customer/payment/${order._id}`);
  };
  return (
    <CustomerLayout>
      <Header title="Checkout" />
      <div className="form-grid">
        <Input placeholder="Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <Input placeholder="Phone" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
        <Input placeholder="Table" value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} />
        <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}><option value="cash">Cash</option><option value="card">Mock Card</option><option value="payhere">PayHere Test</option></select>
        <textarea className="input textarea" placeholder="Order notes" value={form.specialInstructions} onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })} />
        <div className="total-row"><span>Total</span><strong>{money(cart.total)}</strong></div>
        <Button disabled={!cart.items.length} onClick={placeOrder}><CreditCard size={16} /> Place order</Button>
      </div>
    </CustomerLayout>
  );
}

function PaymentPage() {
  const { orderId } = useParams();
  const { data: order } = useResource(`/orders/${orderId}`, null);
  return (
    <CustomerLayout>
      <Header title="Payment" />
      <div className="payment-card">
        <CreditCard size={40} />
        <h2>{order?.paymentStatus === "paid" ? "Payment complete" : "Payment pending"}</h2>
        <p>{order?.paymentMethod === "payhere" ? "PayHere is configured in test mode; backend returns the signed payload for integration." : "Mock payments are processed immediately for cash and card."}</p>
        <Link className="btn btn-primary" to={`/customer/tracking/${order?.orderNumber || orderId}`}>Track order</Link>
      </div>
    </CustomerLayout>
  );
}

function TrackingPage() {
  const { orderId } = useParams();
  const path = orderId ? `/orders/${orderId}` : "/orders/my";
  const { data, load } = useResource(path, orderId ? null : []);
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !orderId) return;
    socket.emit("join-order", orderId);
    socket.emit("order:subscribe", { orderNumber: orderId });
    socket.on("order:update", load);
    return () => socket.off("order:update", load);
  }, [socket, orderId]);
  return (
    <CustomerLayout>
      <Header title={orderId ? "Live order tracking" : "Order history"} />
      {orderId ? <OrderTracker order={data} /> : <OrderList orders={data} />}
    </CustomerLayout>
  );
}

function OrderTracker({ order }) {
  if (!order) return <EmptyState title="Order not found" text="Check the order number and try again." />;
  const index = orderStatuses.indexOf(order.status);
  return (
    <div className="tracker">
      <h2>{order.orderNumber}</h2>
      <StatusBadge status={order.status} />
      <div className="steps">{orderStatuses.slice(0, 6).map((status, idx) => <div className={idx <= index ? "done" : ""} key={status}><span />{status}</div>)}</div>
      <OrderList orders={[order]} />
    </div>
  );
}

function OrderList({ orders = [] }) {
  if (!orders.length) return <EmptyState title="No orders yet" text="Orders will appear here as soon as they are placed." />;
  return <div className="order-list">{orders.map((order) => <OrderCard key={order._id} order={order} />)}</div>;
}

function OrderCard({ order, actions }) {
  return (
    <article className="order-card">
      <div><h3>{order.orderNumber}</h3><p>Table {order.tableNumber} - {order.customerName}</p></div>
      <StatusBadge status={order.status} />
      <strong>{money(order.totalAmount)}</strong>
      {actions}
    </article>
  );
}

function ReservationPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ date: "", time: "19:00", persons: 2, customerName: user?.name || "", contactNumber: user?.phone || "", restaurantId: user?.restaurantId || DEFAULT_RESTAURANT_ID });
  const [message, setMessage] = useState("");
  const submit = async () => {
    await api.post("/reservations", form);
    setMessage("Reservation request sent.");
  };
  return (
    <CustomerLayout>
      <Header title="Reservation" />
      <div className="form-grid">
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        <Input type="number" min="1" value={form.persons} onChange={(e) => setForm({ ...form, persons: Number(e.target.value) })} />
        <Input placeholder="Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <Input placeholder="Phone" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
        <Button onClick={submit}><CalendarDays size={16} /> Reserve</Button>
        {message && <p className="success">{message}</p>}
      </div>
    </CustomerLayout>
  );
}

function ReviewPage() {
  const { data: orders } = useResource("/orders/my");
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [orderId, setOrderId] = useState("");
  const submit = async () => {
    await api.post("/reviews", { rating, comment, orderId, restaurantId: user?.restaurantId || DEFAULT_RESTAURANT_ID });
    setComment("");
  };
  return (
    <CustomerLayout>
      <Header title="Review" />
      <div className="form-grid">
        <select className="input" value={orderId} onChange={(e) => setOrderId(e.target.value)}>{orders.map((order) => <option value={order._id} key={order._id}>{order.orderNumber}</option>)}</select>
        <Input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
        <textarea className="input textarea" placeholder="Share your experience" value={comment} onChange={(e) => setComment(e.target.value)} />
        <Button onClick={submit}><Star size={16} /> Submit review</Button>
      </div>
    </CustomerLayout>
  );
}

function AIChatbot() {
  const [messages, setMessages] = useState([{ from: "bot", text: "Ask me for dish ideas, spice levels, or pairings." }]);
  const [text, setText] = useState("");
  const ask = async () => {
    if (!text.trim()) return;
    const userText = text;
    setMessages((current) => [...current, { from: "user", text: userText }]);
    setText("");
    try {
      const data = unwrap(await api.post("/ai/recommendations", { preferences: userText.toLowerCase().split(/\s+/), limit: 3 }));
      const names = (data.recommendations || []).map((item) => `${item.name}: ${item.recommendationReason || "popular pick"}`).join(" ");
      setMessages((current) => [...current, { from: "bot", text: names || "Try the signature burger with fresh lime soda." }]);
    } catch {
      setMessages((current) => [...current, { from: "bot", text: "Try the Rice & Curry Platter if you want comfort, or grilled prawns for something lighter." }]);
    }
  };
  return (
    <section className="chat">
      <h2><Bot size={20} /> Food assistant</h2>
      <div>{messages.map((message, index) => <p className={message.from} key={index}>{message.text}</p>)}</div>
      <label><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What should I order?" /><Button onClick={ask}><MessageSquare size={16} /></Button></label>
    </section>
  );
}

function StaffLayout({ role, children }) {
  const links = role === "admin"
    ? [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }, { to: "/admin/users", label: "Users", icon: Users }, { to: "/admin/menu", label: "Menu", icon: Utensils }, { to: "/admin/tables", label: "Tables", icon: Table2 }, { to: "/admin/reports", label: "Reports", icon: BarChart3 }]
    : role === "waiter"
      ? [{ to: "/waiter", label: "Orders", icon: Bell }, { to: "/waiter/tables", label: "Tables", icon: Table2 }, { to: "/waiter/manual-order", label: "Manual", icon: Plus }]
      : [{ to: "/kitchen", label: "Board", icon: ChefHat }, { to: "/kitchen/inventory", label: "Stock", icon: ClipboardList }];
  return <div className="dashboard-shell"><Sidebar links={links} /><main>{children}</main></div>;
}

function WaiterDashboard() {
  const { data: orders, load } = useResource("/waiter/orders");
  const { alerts } = useSocket();
  const markServed = async (id) => { await api.patch(`/waiter/orders/${id}/served`); load(); };
  return (
    <StaffLayout role="waiter">
      <Header title="Waiter mobile dashboard" />
      <div className="alert-strip">{alerts.map((alert) => <span key={alert}><Bell size={14} /> {alert}</span>)}</div>
      <div className="kanban">{["pending", "preparing", "ready"].map((status) => <section key={status}><h2>{status}</h2>{orders.filter((order) => order.status === status).map((order) => <OrderCard order={order} key={order._id} actions={<Button onClick={() => markServed(order._id)}>Served</Button>} />)}</section>)}</div>
    </StaffLayout>
  );
}

function WaiterTables() {
  const { data: tables, load } = useResource("/tables");
  const toggle = async (table) => { await api.patch(`/waiter/tables/${table._id}/status`, { isOccupied: !table.isOccupied }); load(); };
  return (
    <StaffLayout role="waiter">
      <Header title="Assigned tables" />
      <div className="table-grid">{tables.map((table) => <div className="table-card" key={table._id}><Table2 /><h3>Table {table.tableNumber}</h3><p>{table.capacity} seats</p><StatusBadge status={table.isOccupied ? "occupied" : "free"} /><Button onClick={() => toggle(table)}>{table.isOccupied ? "Mark free" : "Mark occupied"}</Button></div>)}</div>
    </StaffLayout>
  );
}

function ManualOrder() {
  return <MenuPage />;
}

function KitchenDashboard() {
  const { data: orders, load } = useResource("/kitchen/orders");
  const advance = async (order) => {
    const next = { pending: "accepted", accepted: "preparing", preparing: "ready", ready: "served" }[order.status] || order.status;
    await api.patch(`/kitchen/orders/${order._id}/status`, { status: next });
    load();
  };
  return (
    <StaffLayout role="kitchen">
      <Header title="Kitchen order board" />
      <div className="kitchen-board">{["pending", "accepted", "preparing", "ready"].map((status) => <section key={status}><h2>{status}</h2>{orders.filter((order) => order.status === status).map((order) => <article className="kitchen-card" key={order._id}><h3>{order.orderNumber}</h3><p>Table {order.tableNumber}</p><ul>{order.items?.map((item) => <li key={item._id}>{item.quantity} x {item.name}<small>{item.specialInstructions}</small></li>)}</ul><Button onClick={() => advance(order)}>Advance</Button></article>)}</section>)}</div>
    </StaffLayout>
  );
}

function InventoryPage() {
  const { data } = useResource("/kitchen/inventory");
  return (
    <StaffLayout role="kitchen">
      <Header title="Inventory and low stock" />
      <DataTable columns={[{ key: "itemName", label: "Item" }, { key: "quantity", label: "Qty" }, { key: "unit", label: "Unit" }, { key: "lowStockLimit", label: "Low limit" }, { key: "status", label: "Status", render: (row) => row.quantity <= row.lowStockLimit ? <StatusBadge status="low" /> : <StatusBadge status="ready" /> }]} rows={data} />
    </StaffLayout>
  );
}

function AdminDashboard() {
  const { data: analytics } = useResource("/admin/analytics", {});
  const sales = analytics.salesByDay || analytics.salesTrend || [{ name: "Today", sales: analytics.totalSales || 0 }];
  const popular = analytics.popularItems || [];
  return (
    <StaffLayout role="admin">
      <Header title="Admin dashboard" />
      <div className="stats-grid">
        <StatCard icon={WalletCards} label="Total sales" value={money(analytics.totalSales)} />
        <StatCard icon={ClipboardList} label="Today orders" value={analytics.todayOrders || 0} />
        <StatCard icon={Bell} label="Pending" value={analytics.pendingOrders || 0} />
        <StatCard icon={ChefHat} label="Completed" value={analytics.completedOrders || 0} />
      </div>
      <div className="chart-grid">
        <div className="chart-card"><h2>Sales</h2><ResponsiveContainer height={260}><BarChart data={sales}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="sales" fill="#8b6f47" /></BarChart></ResponsiveContainer></div>
        <div className="chart-card"><h2>Popular items</h2><ResponsiveContainer height={260}><PieChart><Pie data={popular} dataKey="orderCount" nameKey="name" outerRadius={95}>{popular.map((_, i) => <Cell key={i} fill={["#5d4524", "#8b6f47", "#c1b495", "#6f6341"][i % 4]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      </div>
    </StaffLayout>
  );
}

function AdminResource({ title, path, columns }) {
  const { data, load } = useResource(path);
  const [open, setOpen] = useState(false);
  return (
    <StaffLayout role="admin">
      <Header title={title} actions={<Button onClick={() => setOpen(true)}><Plus size={16} /> Add</Button>} />
      <DataTable columns={columns} rows={data} />
      <Modal open={open} title={`Add ${title}`} onClose={() => setOpen(false)}>
        <p className="muted">Use the API-backed table as a starter for full CRUD forms. Existing records can be managed through the same REST endpoints.</p>
        <Button onClick={() => { setOpen(false); load(); }}>Done</Button>
      </Modal>
    </StaffLayout>
  );
}

function ReportsPage() {
  return (
    <StaffLayout role="admin">
      <Header title="Reports" />
      <div className="report-grid">
        <AdminResourceCard title="Sales report" path="/admin/analytics/sales-report" icon={BarChart3} />
        <AdminResourceCard title="Order summary" path="/admin/analytics/orders-summary" icon={ClipboardList} />
      </div>
    </StaffLayout>
  );
}

function AdminResourceCard({ title, path, icon: Icon }) {
  const { data } = useResource(path, {});
  return <div className="feature-card"><Icon /><h3>{title}</h3><pre>{JSON.stringify(data, null, 2)}</pre></div>;
}

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage mode="register" />} />
          <Route path="/menu/:tableId" element={<MenuPage />} />
          <Route path="/customer" element={<ProtectedRoute roles={["customer"]}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/menu" element={<ProtectedRoute roles={["customer"]}><MenuPage /></ProtectedRoute>} />
          <Route path="/customer/cart" element={<ProtectedRoute roles={["customer"]}><CartPage /></ProtectedRoute>} />
          <Route path="/customer/checkout" element={<ProtectedRoute roles={["customer"]}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/customer/payment/:orderId" element={<ProtectedRoute roles={["customer"]}><PaymentPage /></ProtectedRoute>} />
          <Route path="/customer/tracking" element={<ProtectedRoute roles={["customer"]}><TrackingPage /></ProtectedRoute>} />
          <Route path="/customer/tracking/:orderId" element={<ProtectedRoute roles={["customer"]}><TrackingPage /></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute roles={["customer"]}><TrackingPage /></ProtectedRoute>} />
          <Route path="/customer/reservations" element={<ProtectedRoute roles={["customer"]}><ReservationPage /></ProtectedRoute>} />
          <Route path="/customer/reviews" element={<ProtectedRoute roles={["customer"]}><ReviewPage /></ProtectedRoute>} />
          <Route path="/waiter" element={<ProtectedRoute roles={["waiter"]}><WaiterDashboard /></ProtectedRoute>} />
          <Route path="/waiter/tables" element={<ProtectedRoute roles={["waiter"]}><WaiterTables /></ProtectedRoute>} />
          <Route path="/waiter/manual-order" element={<ProtectedRoute roles={["waiter"]}><ManualOrder /></ProtectedRoute>} />
          <Route path="/kitchen" element={<ProtectedRoute roles={["chef", "staff", "kitchen"]}><KitchenDashboard /></ProtectedRoute>} />
          <Route path="/kitchen/inventory" element={<ProtectedRoute roles={["chef", "staff", "kitchen"]}><InventoryPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminResource title="Users" path="/admin/users" columns={[{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }]} /></ProtectedRoute>} />
          <Route path="/admin/menu" element={<ProtectedRoute roles={["admin"]}><AdminResource title="Menu items" path="/admin/menu" columns={[{ key: "name", label: "Name" }, { key: "category", label: "Category" }, { key: "price", label: "Price", render: (row) => money(row.price) }, { key: "isAvailable", label: "Status", render: (row) => <StatusBadge status={row.isAvailable ? "ready" : "cancelled"} /> }]} /></ProtectedRoute>} />
          <Route path="/admin/tables" element={<ProtectedRoute roles={["admin"]}><AdminResource title="Tables and QR codes" path="/admin/tables" columns={[{ key: "tableNumber", label: "Table" }, { key: "capacity", label: "Seats" }, { key: "qrCodeUrl", label: "QR", render: (row) => <QRCodeSVG value={row.qrCodeUrl || `${location.origin}/menu/${row._id}`} size={56} /> }]} /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute roles={["admin"]}><AdminResource title="Orders" path="/admin/orders" columns={[{ key: "orderNumber", label: "Order" }, { key: "customerName", label: "Customer" }, { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> }, { key: "totalAmount", label: "Total", render: (row) => money(row.totalAmount) }]} /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute roles={["admin"]}><AdminResource title="Payments" path="/admin/payments" columns={[{ key: "paymentMethod", label: "Method" }, { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> }, { key: "amount", label: "Amount", render: (row) => money(row.amount) }]} /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute roles={["admin"]}><AdminResource title="Reviews" path="/admin/reviews" columns={[{ key: "rating", label: "Rating" }, { key: "comment", label: "Comment" }]} /></ProtectedRoute>} />
          <Route path="/admin/reservations" element={<ProtectedRoute roles={["admin"]}><AdminResource title="Reservations" path="/admin/reservations" columns={[{ key: "customerName", label: "Customer" }, { key: "time", label: "Time" }, { key: "persons", label: "Persons" }, { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> }]} /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute roles={["admin"]}><AdminResource title="Inventory" path="/admin/inventory" columns={[{ key: "itemName", label: "Item" }, { key: "quantity", label: "Qty" }, { key: "unit", label: "Unit" }, { key: "lowStockLimit", label: "Low limit" }]} /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={["admin"]}><ReportsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<App />);
