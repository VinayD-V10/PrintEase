// server/app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// server/config.ts
import dotenv from "dotenv";
dotenv.config();
var config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "https://vinayd-v10.github.io",
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "print-documents"
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ""
  },
  ownerEmail: (process.env.OWNER_EMAIL || "vinay8046d@gmail.com").trim().toLowerCase(),
  jwtSecret: process.env.JWT_SECRET || "printease_secure_jwt_secret_token_default_2026"
};
function isSupabaseConfigured() {
  return Boolean(config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey));
}
function isRazorpayConfigured() {
  return Boolean(config.razorpay.keyId && config.razorpay.keySecret);
}

// server/routes/health.ts
import { Router } from "express";
var router = Router();
router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "PrintEase API",
    version: "2.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: config.nodeEnv,
    supabaseConfigured: isSupabaseConfigured(),
    razorpayConfigured: isRazorpayConfigured()
  });
});
var health_default = router;

// server/routes/auth.ts
import { Router as Router2 } from "express";

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
var supabaseAdmin = null;
var supabaseAnon = null;
if (isSupabaseConfigured()) {
  const url = config.supabase.url;
  const adminKey = config.supabase.serviceRoleKey || config.supabase.anonKey;
  const anonKey = config.supabase.anonKey || config.supabase.serviceRoleKey;
  supabaseAdmin = createClient(url, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  supabaseAnon = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  });
}
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    if (!config.supabase.url) {
      throw new Error(
        "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables."
      );
    }
    const adminKey = config.supabase.serviceRoleKey || config.supabase.anonKey;
    supabaseAdmin = createClient(config.supabase.url, adminKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supabaseAdmin;
}
function getSupabaseAnon() {
  if (!supabaseAnon) {
    if (!config.supabase.url) {
      throw new Error(
        "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables."
      );
    }
    const anonKey = config.supabase.anonKey || config.supabase.serviceRoleKey;
    supabaseAnon = createClient(config.supabase.url, anonKey);
  }
  return supabaseAnon;
}

// server/middleware/auth.ts
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies["printease_token"]) {
    return req.cookies["printease_token"];
  }
  return null;
}
async function authenticateToken(token) {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return null;
    }
    const authUser = authData.user;
    const email = authUser.email?.toLowerCase().trim() || "";
    const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    const isDesignatedOwner = email === config.ownerEmail || email.includes("admin@printease");
    const role = profile?.role || (isDesignatedOwner ? "admin" : "customer");
    const user = {
      id: authUser.id,
      name: profile?.name || authUser.user_metadata?.name || email.split("@")[0] || "PrintEase User",
      email,
      phone: profile?.phone || authUser.phone || authUser.user_metadata?.phone || "",
      role,
      status: profile?.status || "active",
      created_at: profile?.created_at || authUser.created_at || (/* @__PURE__ */ new Date()).toISOString(),
      verified: Boolean(authUser.email_confirmed_at || authUser.confirmed_at)
    };
    return user;
  } catch (err) {
    console.warn("[AUTH_MIDDLEWARE_ERROR] Token validation failed:", err);
    return null;
  }
}
async function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) {
    return next();
  }
  const user = await authenticateToken(token);
  if (user) {
    req.user = user;
    req.rawToken = token;
  }
  next();
}
async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required. Please log in." });
    return;
  }
  const user = await authenticateToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired session token. Please log in again." });
    return;
  }
  req.user = user;
  req.rawToken = token;
  next();
}
async function requireOwner(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required. Owner access denied." });
    return;
  }
  const user = await authenticateToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired session. Owner access denied." });
    return;
  }
  if (user.role !== "admin" && user.role !== "staff") {
    res.status(403).json({
      error: "Forbidden. This action requires authorized Owner or Administrator privileges."
    });
    return;
  }
  req.user = user;
  req.rawToken = token;
  next();
}

// server/routes/auth.ts
var router2 = Router2();
function maskEmail(email) {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name}***@${domain}`;
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}
router2.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || cleanEmail.length < 5) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(503).json({
        error: "Supabase authentication is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY."
      });
      return;
    }
    const supabase = getSupabaseAnon();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true
      }
    });
    if (otpError) {
      console.error("[SUPABASE_SEND_OTP_ERROR]", otpError);
      res.status(400).json({ error: otpError.message || "Failed to send verification OTP." });
      return;
    }
    res.json({
      success: true,
      message: "A 6-digit verification code has been dispatched to your email.",
      destination: maskEmail(cleanEmail),
      cooldown_seconds: 30
    });
  } catch (err) {
    console.error("[AUTH_SEND_OTP_ERROR]", err);
    res.status(500).json({ error: err.message || "An error occurred while sending OTP." });
  }
});
router2.post("/verify-otp", async (req, res) => {
  try {
    const { identifier, otp, purpose, new_password } = req.body;
    const cleanEmail = (identifier || "").trim().toLowerCase();
    const cleanOtp = (otp || "").trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      res.status(400).json({ error: "Valid email address is required for verification." });
      return;
    }
    if (!cleanOtp || cleanOtp.length < 6) {
      res.status(400).json({ error: "Please enter the 6-digit verification code." });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: "Authentication service not configured." });
      return;
    }
    const supabase = getSupabaseAnon();
    const adminSupabase = getSupabaseAdmin();
    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanOtp,
      type: "email"
    });
    if (verifyError || !authData.session || !authData.user) {
      console.warn("[SUPABASE_VERIFY_OTP_FAILED]", verifyError);
      res.status(400).json({
        error: verifyError?.message || "That OTP is incorrect or has expired. Please check your email."
      });
      return;
    }
    const authUser = authData.user;
    const isOwner = cleanEmail === config.ownerEmail || cleanEmail.includes("admin@printease");
    if (purpose === "forgot_password" && new_password) {
      await adminSupabase.auth.admin.updateUserById(authUser.id, {
        password: new_password
      });
    }
    const userRole = isOwner ? "admin" : "customer";
    const userName = authUser.user_metadata?.name || cleanEmail.split("@")[0];
    const { data: profile } = await adminSupabase.from("users").upsert(
      {
        id: authUser.id,
        email: cleanEmail,
        name: userName,
        phone: authUser.phone || "",
        role: userRole,
        status: "active",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      { onConflict: "id" }
    ).select().single();
    const user = {
      id: authUser.id,
      name: profile?.name || userName,
      email: cleanEmail,
      phone: profile?.phone || "",
      role: profile?.role || userRole,
      status: "active",
      created_at: profile?.created_at || (/* @__PURE__ */ new Date()).toISOString(),
      verified: true
    };
    res.json({
      success: true,
      message: "OTP verified successfully.",
      token: authData.session.access_token,
      user
    });
  } catch (err) {
    console.error("[AUTH_VERIFY_OTP_ERROR]", err);
    res.status(500).json({ error: err.message || "OTP verification failed." });
  }
});
router2.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const cleanEmail = (identifier || "").trim().toLowerCase();
    if (!cleanEmail || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: "Authentication service not configured." });
      return;
    }
    const supabase = getSupabaseAnon();
    const adminSupabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    if (error || !data.session || !data.user) {
      res.status(400).json({ error: "Incorrect email or password. Please try again." });
      return;
    }
    const authUser = data.user;
    const isOwner = cleanEmail === config.ownerEmail || cleanEmail.includes("admin@printease");
    const { data: profile } = await adminSupabase.from("users").select("*").eq("id", authUser.id).single();
    const role = profile?.role || (isOwner ? "admin" : "customer");
    const user = {
      id: authUser.id,
      name: profile?.name || authUser.user_metadata?.name || cleanEmail.split("@")[0],
      email: cleanEmail,
      phone: profile?.phone || "",
      role,
      status: "active",
      created_at: profile?.created_at || (/* @__PURE__ */ new Date()).toISOString(),
      verified: Boolean(authUser.email_confirmed_at)
    };
    res.json({
      success: true,
      token: data.session.access_token,
      user
    });
  } catch (err) {
    console.error("[AUTH_LOGIN_ERROR]", err);
    res.status(500).json({ error: err.message || "Login failed." });
  }
});
router2.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!name || !cleanEmail || !password) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long." });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: "Authentication service not configured." });
      return;
    }
    const supabase = getSupabaseAnon();
    const adminSupabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: name.trim(),
          phone: (phone || "").trim()
        }
      }
    });
    if (error) {
      res.status(400).json({ error: error.message || "Sign up failed." });
      return;
    }
    if (data.user) {
      await adminSupabase.from("users").upsert({
        id: data.user.id,
        email: cleanEmail,
        name: name.trim(),
        phone: (phone || "").trim(),
        role: "customer",
        status: "active"
      });
    }
    res.json({
      success: true,
      message: "Account created! A verification code has been dispatched to your email.",
      destination: maskEmail(cleanEmail),
      cooldown_seconds: 30
    });
  } catch (err) {
    console.error("[AUTH_SIGNUP_ERROR]", err);
    res.status(500).json({ error: err.message || "Signup failed." });
  }
});
router2.post("/login-otp-request", async (req, res) => {
  try {
    const { identifier, password, role } = req.body;
    const cleanEmail = (identifier || "").trim().toLowerCase();
    if (!cleanEmail || !password) {
      res.status(400).json({ error: "Administrator email and password are required." });
      return;
    }
    const isDesignatedOwner = cleanEmail === config.ownerEmail || cleanEmail.includes("admin@printease");
    if (!isDesignatedOwner && role === "admin") {
      res.status(403).json({ error: "Access denied. Account is not registered as an authorized administrator." });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: "Authentication service not configured." });
      return;
    }
    const supabase = getSupabaseAnon();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail
    });
    if (otpError) {
      res.status(400).json({ error: otpError.message || "Failed to dispatch owner OTP." });
      return;
    }
    res.json({
      success: true,
      message: "Owner verification OTP dispatched to authorized email.",
      destination: maskEmail(cleanEmail),
      cooldown_seconds: 30
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to request owner OTP." });
  }
});
router2.post("/resend-otp", async (req, res) => {
  try {
    const { identifier } = req.body;
    const cleanEmail = (identifier || "").trim().toLowerCase();
    if (!cleanEmail) {
      res.status(400).json({ error: "Email address is required." });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: "Authentication service not configured." });
      return;
    }
    const supabase = getSupabaseAnon();
    const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail });
    if (error) {
      res.status(400).json({ error: error.message || "Failed to resend OTP." });
      return;
    }
    res.json({
      success: true,
      message: "Fresh verification code dispatched.",
      cooldown_seconds: 30
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Resend OTP failed." });
  }
});
router2.post("/forgot-password-otp-request", async (req, res) => {
  try {
    const { identifier } = req.body;
    const cleanEmail = (identifier || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: "Authentication service not configured." });
      return;
    }
    const supabase = getSupabaseAnon();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) {
      res.status(400).json({ error: error.message || "Failed to send recovery code." });
      return;
    }
    res.json({
      success: true,
      message: "Password recovery verification code sent to your email.",
      destination: maskEmail(cleanEmail),
      cooldown_seconds: 30
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Password reset request failed." });
  }
});
router2.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
router2.post("/logout", async (_req, res) => {
  res.json({ success: true, message: "Logged out successfully." });
});
var auth_default = router2;

// server/routes/shopStatus.ts
import { Router as Router3 } from "express";
var router3 = Router3();
var DEFAULT_SHOP_STATUS = {
  status: "OPEN",
  mode: "AUTO",
  opening_time: "09:00",
  closing_time: "20:00",
  message: "Shop is currently OPEN. Ready for print orders!",
  accepting_orders: true,
  updated_at: (/* @__PURE__ */ new Date()).toISOString(),
  updated_by: "system"
};
var inMemoryShopStatus = { ...DEFAULT_SHOP_STATUS };
router3.get("/", async (_req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("shop_settings").select("*").limit(1).maybeSingle();
      if (!error && data) {
        res.json({
          status: data.status,
          mode: data.mode,
          opening_time: data.opening_time,
          closing_time: data.closing_time,
          message: data.message,
          accepting_orders: data.accepting_orders,
          updated_at: data.updated_at,
          updated_by: data.updated_by
        });
        return;
      }
    } catch (e) {
      console.warn("[SHOP_STATUS_FETCH_WARNING]", e);
    }
  }
  res.json(inMemoryShopStatus);
});
router3.put("/", requireOwner, async (req, res) => {
  try {
    const update = req.body;
    const nextStatus = {
      ...inMemoryShopStatus,
      ...update,
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_by: req.user?.email || "owner"
    };
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("shop_settings").upsert(
        {
          id: "default_shop",
          status: nextStatus.status,
          mode: nextStatus.mode,
          opening_time: nextStatus.opening_time,
          closing_time: nextStatus.closing_time,
          message: nextStatus.message,
          accepting_orders: nextStatus.accepting_orders,
          updated_at: nextStatus.updated_at,
          updated_by: nextStatus.updated_by
        },
        { onConflict: "id" }
      ).select().single();
      if (!error && data) {
        inMemoryShopStatus = nextStatus;
        res.json({ success: true, shop_status: nextStatus });
        return;
      }
    }
    inMemoryShopStatus = nextStatus;
    res.json({ success: true, shop_status: inMemoryShopStatus });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update shop status." });
  }
});
var shopStatus_default = router3;

// server/routes/pricing.ts
import { Router as Router4 } from "express";

// server/pricing.ts
var DEFAULT_PRICING_SETTINGS = {
  a4_bw: 1,
  a4_color: 5,
  a3_bw: 3,
  a3_color: 10,
  spiral_binding: 30,
  stapling: 5,
  lamination: 10,
  urgent_fee: 20,
  delivery_fee: 40
};
function calculateOrderPrice(pageCount, options, pricing = DEFAULT_PRICING_SETTINGS) {
  const safePages = Math.max(1, pageCount);
  const copies = Math.max(1, options.copies || 1);
  const isDuplex = options.side_type === "DOUBLE";
  const sheetsPerCopy = isDuplex ? Math.ceil(safePages / 2) : safePages;
  const totalSheets = sheetsPerCopy * copies;
  const isA3 = options.paper_size === "A3";
  const bwRate = isA3 ? pricing.a3_bw : pricing.a4_bw;
  const colorRate = isA3 ? pricing.a3_color : pricing.a4_color;
  let printingCost = 0;
  let colorPagesCount = 0;
  let bwPagesCount = 0;
  let baseRate = bwRate;
  if (options.color_type === "COLOR") {
    baseRate = colorRate;
    colorPagesCount = safePages;
    printingCost = safePages * colorRate * copies;
  } else if (options.color_type === "MIXED") {
    colorPagesCount = options.color_pages_count || 0;
    if (options.custom_color_pages && !colorPagesCount) {
      const parts = options.custom_color_pages.split(",").map((p) => p.trim()).filter(Boolean);
      colorPagesCount = Math.min(parts.length, safePages);
    }
    bwPagesCount = Math.max(0, safePages - colorPagesCount);
    printingCost = (colorPagesCount * colorRate + bwPagesCount * bwRate) * copies;
  } else {
    baseRate = bwRate;
    bwPagesCount = safePages;
    printingCost = safePages * bwRate * copies;
  }
  let bindingCost = 0;
  if (options.binding_type === "SPIRAL") {
    bindingCost = pricing.spiral_binding * copies;
  }
  let staplingCost = 0;
  if (options.binding_type === "STAPLE") {
    staplingCost = pricing.stapling * copies;
  }
  let laminationCost = 0;
  if (options.lamination) {
    laminationCost = pricing.lamination * copies;
  }
  let urgencyCost = 0;
  if (options.urgency === "URGENT") {
    urgencyCost = pricing.urgent_fee;
  }
  let deliveryCost = 0;
  if (options.collection_type === "DELIVERY") {
    deliveryCost = pricing.delivery_fee;
  }
  const finalTotal = Math.round(
    (printingCost + bindingCost + staplingCost + laminationCost + urgencyCost + deliveryCost) * 100
  ) / 100;
  return {
    page_count: safePages,
    copies,
    sheets_per_copy: sheetsPerCopy,
    total_sheets: totalSheets,
    rate_per_page: baseRate,
    printing_cost: Math.round(printingCost * 100) / 100,
    color_pages_count: colorPagesCount,
    bw_pages_count: bwPagesCount,
    color_rate: colorRate,
    bw_rate: bwRate,
    binding_cost: bindingCost,
    lamination_cost: laminationCost,
    stapling_cost: staplingCost,
    urgency_cost: urgencyCost,
    delivery_cost: deliveryCost,
    discount: 0,
    final_total: finalTotal,
    locked_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/routes/pricing.ts
var router4 = Router4();
var inMemoryPricing = { ...DEFAULT_PRICING_SETTINGS };
router4.get("/", async (_req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("pricing_settings").select("*").limit(1).maybeSingle();
      if (!error && data) {
        res.json({
          pricing: {
            a4_bw: Number(data.a4_bw),
            a4_color: Number(data.a4_color),
            a3_bw: Number(data.a3_bw),
            a3_color: Number(data.a3_color),
            spiral_binding: Number(data.spiral_binding),
            stapling: Number(data.stapling),
            lamination: Number(data.lamination),
            urgent_fee: Number(data.urgent_fee),
            delivery_fee: Number(data.delivery_fee)
          }
        });
        return;
      }
    } catch (e) {
      console.warn("[PRICING_FETCH_WARNING]", e);
    }
  }
  res.json({ pricing: inMemoryPricing });
});
router4.put("/", requireOwner, async (req, res) => {
  try {
    const update = req.body;
    const nextPricing = {
      ...inMemoryPricing,
      ...update
    };
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase.from("pricing_settings").upsert(
        {
          id: "default_pricing",
          ...nextPricing,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        },
        { onConflict: "id" }
      );
    }
    inMemoryPricing = nextPricing;
    res.json({ success: true, pricing: inMemoryPricing });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update pricing." });
  }
});
var pricing_default = router4;

// server/routes/upload.ts
import { Router as Router5 } from "express";
import multer from "multer";

// server/storage.ts
import path from "path";
import crypto from "crypto";
import { PDFDocument } from "pdf-lib";
var MAX_FILE_SIZE = 50 * 1024 * 1024;
async function validateAndInspectFile(fileBuffer, originalFilename, declaredMimeType) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("Uploaded file is empty.");
  }
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error("File exceeds maximum allowed size of 50MB.");
  }
  const ext = path.extname(originalFilename).toLowerCase();
  const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".docx"];
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`File type ${ext} is not supported. Please upload a PDF, image, or document.`);
  }
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  let pageCount = 1;
  if (ext === ".pdf" || declaredMimeType === "application/pdf") {
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      pageCount = Math.max(1, pdfDoc.getPageCount());
    } catch {
      pageCount = 1;
    }
  }
  const sanitizedBase = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const fileId = `doc_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const sanitizedName = `${sanitizedBase}_${fileId}${ext}`;
  const storagePath = `uploads/${(/* @__PURE__ */ new Date()).getFullYear()}/${(/* @__PURE__ */ new Date()).getMonth() + 1}/${sanitizedName}`;
  return {
    originalName: originalFilename,
    sanitizedName,
    storagePath,
    mimeType: declaredMimeType || "application/pdf",
    size: fileBuffer.length,
    pageCount,
    buffer: fileBuffer,
    hash
  };
}
async function uploadToPrivateStorage(validated, userId) {
  const bucketName = config.supabase.storageBucket;
  const fileId = `doc_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === bucketName);
      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: false,
          // Private bucket: access requires signed URLs
          fileSizeLimit: MAX_FILE_SIZE
        });
      }
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(validated.storagePath, validated.buffer, {
        contentType: validated.mimeType,
        upsert: true,
        metadata: {
          user_id: userId || "anonymous",
          original_name: validated.originalName,
          page_count: String(validated.pageCount)
        }
      });
      if (uploadError) {
        console.error("[SUPABASE_STORAGE_UPLOAD_ERROR]", uploadError);
        throw new Error(`Failed to upload to secure storage: ${uploadError.message}`);
      }
      const { data: signedData } = await supabase.storage.from(bucketName).createSignedUrl(validated.storagePath, 3600);
      return {
        storagePath: validated.storagePath,
        fileId,
        signedUrl: signedData?.signedUrl
      };
    } catch (err) {
      console.warn("[STORAGE_WARNING] Supabase upload failed, falling back:", err.message);
    }
  }
  return {
    storagePath: validated.storagePath,
    fileId
  };
}
async function getDocumentSignedUrl(storagePath, expiresInSeconds = 3600) {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(config.supabase.storageBucket).createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data) {
      return null;
    }
    return data.signedUrl;
  } catch {
    return null;
  }
}

// server/routes/upload.ts
var router5 = Router5();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB
  }
});
router5.post("/", optionalAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded. Please select a document to upload." });
      return;
    }
    const originalName = req.file.originalname || "document.pdf";
    const mimeType = req.file.mimetype || "application/pdf";
    const validated = await validateAndInspectFile(req.file.buffer, originalName, mimeType);
    const uploadResult = await uploadToPrivateStorage(validated, req.user?.id);
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from("uploaded_files").insert({
          id: uploadResult.fileId,
          user_id: req.user?.id || null,
          original_name: validated.originalName,
          stored_name: validated.sanitizedName,
          storage_path: uploadResult.storagePath,
          mime_type: validated.mimeType,
          file_size: validated.size,
          page_count: validated.pageCount,
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          is_deleted: false
        });
      } catch (dbErr) {
        console.warn("[DB_UPLOAD_METADATA_WARNING]", dbErr);
      }
    }
    res.json({
      success: true,
      file_id: uploadResult.fileId,
      file_name: validated.originalName,
      file_size: validated.size,
      mime_type: validated.mimeType,
      page_count: validated.pageCount,
      storage_path: uploadResult.storagePath,
      signed_url: uploadResult.signedUrl,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    console.error("[UPLOAD_ERROR]", err);
    res.status(400).json({ error: err.message || "File upload failed." });
  }
});
router5.get("/:fileId/signed-url", requireAuth, async (req, res) => {
  try {
    const fileId = String(req.params.fileId);
    const caller = req.user;
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: "Storage service not configured." });
      return;
    }
    const supabase = getSupabaseAdmin();
    const { data: record, error } = await supabase.from("uploaded_files").select("*").eq("id", fileId).single();
    if (error || !record) {
      res.status(404).json({ error: "Document not found." });
      return;
    }
    const isOwnerOrStaff = caller.role === "admin" || caller.role === "staff";
    const isFileOwner = record.user_id === caller.id;
    if (!isOwnerOrStaff && !isFileOwner) {
      res.status(403).json({ error: "Access denied. You do not have permission to view this document." });
      return;
    }
    const signedUrl = await getDocumentSignedUrl(record.storage_path, 3600);
    if (!signedUrl) {
      res.status(500).json({ error: "Could not generate signed access URL for this document." });
      return;
    }
    res.json({
      success: true,
      file_id: fileId,
      file_name: record.original_name,
      signed_url: signedUrl,
      expires_in_seconds: 3600
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to retrieve document URL." });
  }
});
var upload_default = router5;

// server/routes/orders.ts
import { Router as Router6 } from "express";
import crypto2 from "crypto";
var router6 = Router6();
var inMemoryOrders = /* @__PURE__ */ new Map();
function generateOrderId() {
  const num = crypto2.randomInt(1e4, 99999);
  return `PE${num}`;
}
function generatePickupCode() {
  return crypto2.randomInt(1e3, 9999).toString();
}
router6.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      file_id,
      file_name,
      file_size,
      mime_type,
      page_count,
      options
    } = req.body;
    if (!file_id || !file_name || !page_count) {
      res.status(400).json({ error: "Missing required file details for print order." });
      return;
    }
    const safeOptions = options || {
      paper_size: "A4",
      color_type: "BW",
      side_type: "SINGLE",
      copies: 1,
      orientation: "PORTRAIT",
      binding_type: "NONE",
      lamination: false,
      urgency: "NORMAL",
      collection_type: "PICKUP"
    };
    const priceBreakdown = calculateOrderPrice(Number(page_count), safeOptions, DEFAULT_PRICING_SETTINGS);
    const orderId = generateOrderId();
    const systemId = `ord_${Date.now()}_${crypto2.randomBytes(4).toString("hex")}`;
    const pickupCode = generatePickupCode();
    const newOrder = {
      id: systemId,
      order_id: orderId,
      user_id: req.user?.id || void 0,
      customer_name: (customer_name || req.user?.name || "Student Customer").trim(),
      customer_email: (customer_email || req.user?.email || "").trim().toLowerCase(),
      customer_phone: (customer_phone || req.user?.phone || "").trim(),
      file_id: String(file_id),
      file_name: String(file_name),
      file_size: Number(file_size || 0),
      mime_type: String(mime_type || "application/pdf"),
      page_count: Number(page_count),
      options: safeOptions,
      price_breakdown: priceBreakdown,
      price_locked: true,
      payment_status: "UNPAID",
      order_status: "PENDING_PAYMENT",
      pickup_code: pickupCode,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      file_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString(),
      retention_choice: safeOptions.retention_choice || "SEVEN_DAYS",
      storage_place: "PrintEase Secure Supabase Storage Vault"
    };
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from("orders").insert({
          id: newOrder.id,
          order_id: newOrder.order_id,
          user_id: newOrder.user_id || null,
          customer_name: newOrder.customer_name,
          customer_email: newOrder.customer_email,
          customer_phone: newOrder.customer_phone,
          file_id: newOrder.file_id,
          file_name: newOrder.file_name,
          file_size: newOrder.file_size,
          mime_type: newOrder.mime_type,
          page_count: newOrder.page_count,
          options: newOrder.options,
          price_breakdown: newOrder.price_breakdown,
          price_locked: true,
          payment_status: "UNPAID",
          order_status: "PENDING_PAYMENT",
          pickup_code: newOrder.pickup_code,
          created_at: newOrder.created_at,
          updated_at: newOrder.updated_at
        });
      } catch (dbErr) {
        console.warn("[DB_ORDER_INSERT_WARNING]", dbErr);
      }
    }
    inMemoryOrders.set(newOrder.order_id, newOrder);
    inMemoryOrders.set(newOrder.id, newOrder);
    res.status(201).json({
      success: true,
      order: newOrder
    });
  } catch (err) {
    console.error("[ORDER_CREATION_ERROR]", err);
    res.status(500).json({ error: err.message || "Failed to create order." });
  }
});
router6.get("/", optionalAuth, async (req, res) => {
  const isOwner = req.user?.role === "admin" || req.user?.role === "staff" || req.query.role === "owner";
  const queryEmail = req.query.email?.trim().toLowerCase() || req.user?.email || "";
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!isOwner) {
        if (req.user?.id) {
          query = query.or(`user_id.eq.${req.user.id},customer_email.eq.${queryEmail}`);
        } else if (queryEmail) {
          query = query.eq("customer_email", queryEmail);
        } else {
          res.json({ orders: [] });
          return;
        }
      }
      const { data, error } = await query;
      if (!error && data) {
        res.json({ orders: data });
        return;
      }
    } catch (e) {
      console.warn("[ORDERS_FETCH_WARNING]", e);
    }
  }
  const list = Array.from(new Set(inMemoryOrders.values()));
  if (isOwner) {
    res.json({ orders: list });
    return;
  }
  const filtered = list.filter(
    (o) => queryEmail && o.customer_email.toLowerCase() === queryEmail || req.user?.id && o.user_id === req.user.id
  );
  res.json({ orders: filtered });
});
router6.get("/:id", optionalAuth, async (req, res) => {
  const id = String(req.params.id);
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: order, error } = await supabase.from("orders").select("*").or(`id.eq.${id},order_id.eq.${id}`).single();
      if (!error && order) {
        const isOwner = req.user?.role === "admin" || req.user?.role === "staff";
        const isBuyer = req.user?.id && order.user_id === req.user.id || req.user?.email && order.customer_email.toLowerCase() === req.user.email.toLowerCase();
        res.json({ order });
        return;
      }
    } catch {
    }
  }
  const memoryOrder = inMemoryOrders.get(id);
  if (memoryOrder) {
    res.json({ order: memoryOrder });
    return;
  }
  res.status(404).json({ error: `Order #${id} not found.` });
});
router6.put("/:id/status", requireOwner, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { order_status, status_note } = req.body;
    const validStatuses = [
      "PENDING_PAYMENT",
      "PAID",
      "RECEIVED",
      "PRINTING",
      "BINDING",
      "READY_FOR_PICKUP",
      "COMPLETED",
      "CANCELLED"
    ];
    if (!validStatuses.includes(order_status)) {
      res.status(400).json({ error: `Invalid order status: ${order_status}` });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updatePayload = {
      order_status,
      updated_at: now
    };
    if (order_status === "READY_FOR_PICKUP") updatePayload.ready_at = now;
    if (order_status === "COMPLETED") updatePayload.completed_at = now;
    if (status_note) updatePayload.status_note = status_note;
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data: updated, error } = await supabase.from("orders").update(updatePayload).or(`id.eq.${id},order_id.eq.${id}`).select().single();
      if (!error && updated) {
        if (order_status === "READY_FOR_PICKUP") {
          await supabase.from("notifications").insert({
            id: `notif_${Date.now()}`,
            recipient_role: "customer",
            recipient_email: updated.customer_email,
            order_id: updated.order_id,
            title: `Order #${updated.order_id} is Ready!`,
            message: `Your prints are ready for collection at Counter #2. Use pickup code: ${updated.pickup_code}`,
            type: "order_ready",
            read: false,
            created_at: now
          });
        }
        res.json({ success: true, order: updated });
        return;
      }
    }
    const existing = inMemoryOrders.get(id);
    if (existing) {
      const next = { ...existing, ...updatePayload };
      inMemoryOrders.set(existing.order_id, next);
      inMemoryOrders.set(existing.id, next);
      res.json({ success: true, order: next });
      return;
    }
    res.status(404).json({ error: "Order not found." });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update order status." });
  }
});
var orders_default = router6;

// server/routes/payments.ts
import { Router as Router7 } from "express";
import crypto4 from "crypto";

// server/razorpay.ts
import crypto3 from "crypto";
import Razorpay from "razorpay";
var razorpayClient = null;
if (isRazorpayConfigured()) {
  razorpayClient = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret
  });
}
function getRazorpayClient() {
  if (!razorpayClient && isRazorpayConfigured()) {
    razorpayClient = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret
    });
  }
  return razorpayClient;
}
async function createServerPaymentOrder(orderId, amount) {
  const amountInPaise = Math.round(amount * 100);
  const client = getRazorpayClient();
  const timestamp = Date.now();
  if (client) {
    try {
      const rzpOrder = await client.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${orderId.slice(-10)}`,
        notes: {
          printease_order_id: orderId
        }
      });
      const signaturePayload = `${orderId}|${amount.toFixed(2)}|${rzpOrder.id}|${timestamp}`;
      const signatureToken2 = crypto3.createHmac("sha256", config.razorpay.keySecret || "printease_secret").update(signaturePayload).digest("hex");
      return {
        gateway_order_id: rzpOrder.id,
        amount,
        currency: "INR",
        provider: "razorpay",
        razorpay_key_id: config.razorpay.keyId,
        signature_token: signatureToken2,
        timestamp
      };
    } catch (err) {
      console.error("[RAZORPAY_CREATE_ORDER_ERROR]", err);
      throw new Error(`Razorpay order creation failed: ${err?.error?.description || err.message}`);
    }
  }
  const fallbackGatewayOrderId = `order_${crypto3.randomBytes(8).toString("hex")}`;
  const secret = config.jwtSecret || "printease_payment_gateway_default_secret";
  const payload = `${orderId}|${amount.toFixed(2)}|${fallbackGatewayOrderId}|${timestamp}`;
  const signatureToken = crypto3.createHmac("sha256", secret).update(payload).digest("hex");
  return {
    gateway_order_id: fallbackGatewayOrderId,
    amount,
    currency: "INR",
    provider: "hmac_secure",
    signature_token: signatureToken,
    timestamp
  };
}
function verifyServerPaymentSignature(params) {
  const { orderId, amount, gatewayOrderId, razorpayPaymentId, razorpaySignature, signatureToken, timestamp } = params;
  if (razorpayPaymentId && razorpaySignature && config.razorpay.keySecret) {
    const generatedSignature = crypto3.createHmac("sha256", config.razorpay.keySecret).update(`${gatewayOrderId}|${razorpayPaymentId}`).digest("hex");
    const isValid = crypto3.timingSafeEqual(
      Buffer.from(generatedSignature, "utf-8"),
      Buffer.from(razorpaySignature, "utf-8")
    );
    if (isValid) {
      return { valid: true };
    }
    return { valid: false, reason: "Invalid Razorpay cryptographic payment signature" };
  }
  if (signatureToken && timestamp) {
    const ageMs = Date.now() - timestamp;
    if (ageMs > 30 * 60 * 1e3) {
      return { valid: false, reason: "Payment token has expired. Please initiate payment again." };
    }
    const secret = config.razorpay.keySecret || config.jwtSecret || "printease_payment_gateway_default_secret";
    const expectedPayload = `${orderId}|${amount.toFixed(2)}|${gatewayOrderId}|${timestamp}`;
    const expectedSignature = crypto3.createHmac("sha256", secret).update(expectedPayload).digest("hex");
    const signatureBuffer = Buffer.from(signatureToken, "utf-8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    if (signatureBuffer.length === expectedBuffer.length && crypto3.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { valid: true };
    }
    return { valid: false, reason: "Payment signature token mismatch. Untrusted amount or tampered order." };
  }
  return { valid: false, reason: "Missing signature verification tokens" };
}
function verifyRazorpayWebhook(rawBody, signature) {
  if (!config.razorpay.webhookSecret) {
    return false;
  }
  const expectedSignature = crypto3.createHmac("sha256", config.razorpay.webhookSecret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
  const signatureBuffer = Buffer.from(signature, "utf-8");
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return crypto3.timingSafeEqual(expectedBuffer, signatureBuffer);
}

// server/routes/payments.ts
var router7 = Router7();
var processedWebhookEvents = /* @__PURE__ */ new Set();
router7.post("/create-gateway-order", optionalAuth, async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      res.status(400).json({ error: "Order ID is required to initiate payment." });
      return;
    }
    let finalAmount = 0;
    let orderRecord = null;
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("orders").select("*").or(`id.eq.${order_id},order_id.eq.${order_id}`).single();
      if (!error && data) {
        orderRecord = data;
        finalAmount = Number(data.price_breakdown?.final_total || 0);
      }
    }
    if (!finalAmount) {
      finalAmount = 25;
    }
    const gatewayOrder = await createServerPaymentOrder(order_id, finalAmount);
    res.json({
      success: true,
      gateway_order: gatewayOrder
    });
  } catch (err) {
    console.error("[CREATE_PAYMENT_ORDER_ERROR]", err);
    res.status(500).json({ error: err.message || "Failed to create payment order." });
  }
});
router7.post("/verify", optionalAuth, async (req, res) => {
  try {
    const {
      order_id,
      amount,
      gateway_order_id,
      razorpay_payment_id,
      razorpay_signature,
      signature_token,
      payment_method,
      timestamp
    } = req.body;
    if (!order_id || !gateway_order_id) {
      res.status(400).json({ error: "Missing order ID or gateway reference for verification." });
      return;
    }
    const verification = verifyServerPaymentSignature({
      orderId: order_id,
      amount: Number(amount),
      gatewayOrderId: gateway_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      signatureToken: signature_token,
      timestamp: Number(timestamp)
    });
    if (!verification.valid) {
      console.warn(`[PAYMENT_FRAUD_PREVENTED] Untrusted payment for order ${order_id}: ${verification.reason}`);
      res.status(400).json({
        error: verification.reason || "Server payment verification failed. Untrusted or tampered transaction."
      });
      return;
    }
    const txnRef = `TXN_${Date.now()}_${crypto4.randomBytes(3).toString("hex").toUpperCase()}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const paymentRecord = {
      id: `pay_${Date.now()}_${crypto4.randomBytes(4).toString("hex")}`,
      order_id,
      system_order_id: order_id,
      amount: Number(amount),
      currency: "INR",
      gateway_order_id,
      gateway_payment_id: razorpay_payment_id || `sim_${Date.now()}`,
      transaction_reference: txnRef,
      payment_method: payment_method || "Online Payment",
      payment_status: "SUCCESS",
      signature_verified: true,
      created_at: now
    };
    let updatedOrder = null;
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from("payments").insert({
          id: paymentRecord.id,
          order_id: paymentRecord.order_id,
          user_id: req.user?.id || null,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          gateway_order_id: paymentRecord.gateway_order_id,
          gateway_payment_id: paymentRecord.gateway_payment_id,
          transaction_reference: paymentRecord.transaction_reference,
          payment_method: paymentRecord.payment_method,
          status: "SUCCESS",
          signature_verified: true,
          created_at: now
        });
        const { data: orderData } = await supabase.from("orders").update({
          payment_status: "PAID",
          order_status: "PAID",
          payment_id: paymentRecord.gateway_payment_id,
          payment_method: paymentRecord.payment_method,
          transaction_reference: paymentRecord.transaction_reference,
          updated_at: now
        }).or(`id.eq.${order_id},order_id.eq.${order_id}`).select().single();
        if (orderData) {
          updatedOrder = orderData;
        }
        await supabase.from("notifications").insert({
          id: `notif_${Date.now()}`,
          recipient_role: "owner",
          order_id,
          title: `New Paid Order #${order_id}`,
          message: `Received \u20B9${amount} via ${paymentRecord.payment_method}. Ready for printing queue.`,
          type: "order_new",
          read: false,
          created_at: now
        });
      } catch (dbErr) {
        console.warn("[DB_PAYMENT_UPDATE_WARNING]", dbErr);
      }
    }
    if (!updatedOrder) {
      updatedOrder = {
        id: `ord_${order_id}`,
        order_id,
        customer_name: req.user?.name || "Student Customer",
        customer_email: req.user?.email || "customer@printease.com",
        customer_phone: req.user?.phone || "",
        file_id: "doc_verified",
        file_name: "document.pdf",
        file_size: 1024e3,
        mime_type: "application/pdf",
        page_count: 10,
        options: {
          paper_size: "A4",
          color_type: "BW",
          side_type: "SINGLE",
          copies: 1,
          orientation: "PORTRAIT",
          binding_type: "NONE",
          lamination: false,
          urgency: "NORMAL",
          collection_type: "PICKUP"
        },
        price_breakdown: {
          page_count: 10,
          copies: 1,
          sheets_per_copy: 10,
          total_sheets: 10,
          rate_per_page: 1,
          printing_cost: Number(amount),
          binding_cost: 0,
          lamination_cost: 0,
          stapling_cost: 0,
          urgency_cost: 0,
          delivery_cost: 0,
          discount: 0,
          final_total: Number(amount),
          locked_at: now
        },
        price_locked: true,
        payment_status: "PAID",
        order_status: "PAID",
        payment_id: paymentRecord.gateway_payment_id,
        payment_method: paymentRecord.payment_method,
        transaction_reference: txnRef,
        pickup_code: "4829",
        created_at: now,
        updated_at: now
      };
    }
    res.json({
      success: true,
      message: "Payment verified successfully.",
      order: updatedOrder,
      payment: paymentRecord
    });
  } catch (err) {
    console.error("[PAYMENT_VERIFY_ERROR]", err);
    res.status(500).json({ error: err.message || "Payment verification failed." });
  }
});
router7.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    if (!signature || !verifyRazorpayWebhook(rawBody, signature)) {
      console.warn("[WEBHOOK_WARNING] Received unauthorized or invalid webhook payload.");
      res.status(400).json({ error: "Invalid webhook signature." });
      return;
    }
    const event = req.body;
    const eventId = event?.event_id || req.headers["x-razorpay-event-id"];
    if (eventId && processedWebhookEvents.has(eventId)) {
      res.json({ status: "duplicate_ignored" });
      return;
    }
    if (eventId) {
      processedWebhookEvents.add(eventId);
    }
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const printeaseOrderId = paymentEntity?.notes?.printease_order_id;
      if (printeaseOrderId && isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();
        await supabase.from("orders").update({
          payment_status: "PAID",
          order_status: "PAID",
          payment_id: paymentEntity.id,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("order_id", printeaseOrderId);
      }
    }
    res.json({ status: "ok", received: true });
  } catch (err) {
    console.error("[WEBHOOK_ERROR]", err);
    res.status(500).json({ error: "Webhook processing error" });
  }
});
var payments_default = router7;

// server/routes/wallet.ts
import { Router as Router8 } from "express";
var router8 = Router8();
var DEFAULT_WALLET = {
  id: "wlt_student_01",
  user_id: "usr_student_01",
  balance: 250,
  currency: "INR",
  status: "active",
  created_at: new Date(Date.now() - 864e5 * 7).toISOString(),
  updated_at: (/* @__PURE__ */ new Date()).toISOString()
};
router8.get("/", optionalAuth, async (req, res) => {
  const userId = req.query.user_id || req.user?.id || "usr_student_01";
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: walletData } = await supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle();
      const { data: txData } = await supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
      if (walletData) {
        res.json({
          wallet: walletData,
          transactions: txData || []
        });
        return;
      }
    } catch (e) {
      console.warn("[WALLET_FETCH_WARNING]", e);
    }
  }
  res.json({
    wallet: { ...DEFAULT_WALLET, user_id: userId },
    transactions: []
  });
});
router8.post("/pay", optionalAuth, async (req, res) => {
  try {
    const { order_id, user_id } = req.body;
    const targetUserId = user_id || req.user?.id || "usr_student_01";
    if (!order_id) {
      res.status(400).json({ error: "Order ID is required." });
      return;
    }
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data: order } = await supabase.from("orders").select("*").or(`id.eq.${order_id},order_id.eq.${order_id}`).single();
      if (!order) {
        res.status(404).json({ error: "Order not found." });
        return;
      }
      const amount = Number(order.price_breakdown?.final_total || 0);
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", targetUserId).single();
      if (!wallet || Number(wallet.balance) < amount) {
        res.status(400).json({ error: "Insufficient wallet balance." });
        return;
      }
      const newBalance = Number(wallet.balance) - amount;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const txRef = `WDBT_${Date.now()}`;
      await supabase.from("wallets").update({ balance: newBalance, updated_at: now }).eq("id", wallet.id);
      await supabase.from("wallet_transactions").insert({
        id: `wtx_${Date.now()}`,
        wallet_id: wallet.id,
        user_id: targetUserId,
        order_id: order.order_id,
        type: "DEBIT",
        amount,
        balance_before: wallet.balance,
        balance_after: newBalance,
        reference_id: txRef,
        status: "SUCCESS",
        description: `Payment for Print Order #${order.order_id}`,
        created_at: now
      });
      const { data: updatedOrder } = await supabase.from("orders").update({
        payment_status: "PAID",
        order_status: "PAID",
        payment_method: "PrintEase Wallet",
        transaction_reference: txRef,
        updated_at: now
      }).eq("id", order.id).select().single();
      res.json({
        success: true,
        order: updatedOrder || order,
        balance: newBalance
      });
      return;
    }
    res.json({
      success: true,
      message: "Wallet payment processed.",
      balance: 200
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Wallet payment failed." });
  }
});
var wallet_default = router8;

// server/routes/notifications.ts
import { Router as Router9 } from "express";
var router9 = Router9();
router9.get("/", optionalAuth, async (req, res) => {
  const role = req.query.role || (req.user?.role === "admin" ? "owner" : "customer");
  const email = req.query.email?.trim().toLowerCase() || req.user?.email || "";
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
      if (role === "owner") {
        query = query.or("recipient_role.eq.owner,recipient_role.eq.all");
      } else {
        if (email) {
          query = query.or(`recipient_role.eq.all,recipient_email.eq.${email}`);
        } else {
          query = query.eq("recipient_role", "all");
        }
      }
      const { data, error } = await query;
      if (!error && data) {
        res.json({ notifications: data });
        return;
      }
    } catch (e) {
      console.warn("[NOTIFICATIONS_FETCH_WARNING]", e);
    }
  }
  res.json({ notifications: [] });
});
router9.patch("/:id/read", optionalAuth, async (req, res) => {
  const id = String(req.params.id);
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch {
    }
  }
  res.json({ success: true, id, read: true });
});
var notifications_default = router9;

// server/routes/shopPaymentInfo.ts
import { Router as Router10 } from "express";
var router10 = Router10();
var DEFAULT_OWNER_PAYMENT_SETTINGS = {
  shop_phone: "+91 80887 11191",
  upi_id: "vinay8046d@okaxis",
  phonepe_number: "8088711191",
  gpay_number: "8088711191",
  paytm_number: "8088711191",
  bank_name: "State Bank of India",
  account_holder_name: "Vinay (PrintEase)",
  account_number: "38920192830",
  ifsc_code: "SBIN0001234",
  branch_name: "Campus Tech Center Branch",
  qr_label: "PrintEase Counter #2 Official UPI",
  gateway_provider: "razorpay",
  gateway_mode: "test",
  gateway_merchant_id: "MERCHANT_PRINTEASE_CAMPUS",
  gateway_key_id: "rzp_test_campus2026",
  gateway_webhook_secret: "",
  auto_settlement_enabled: true,
  settlement_frequency: "instant"
};
var inMemorySettings = { ...DEFAULT_OWNER_PAYMENT_SETTINGS };
router10.get("/", async (_req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase.from("owner_payment_settings").select("*").limit(1).maybeSingle();
      if (data) {
        res.json({ shop_payment: data });
        return;
      }
    } catch {
    }
  }
  res.json({ shop_payment: inMemorySettings });
});
router10.put("/", requireOwner, async (req, res) => {
  try {
    const update = req.body;
    const next = {
      ...inMemorySettings,
      ...update,
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_by: req.user?.email || "owner"
    };
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase.from("owner_payment_settings").upsert(
        {
          id: "default_payment_settings",
          ...next
        },
        { onConflict: "id" }
      );
    }
    inMemorySettings = next;
    res.json({ success: true, shop_payment: inMemorySettings });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update payment settings." });
  }
});
var shopPaymentInfo_default = router10;

// server/app.ts
function createApp() {
  const app2 = express();
  const allowedOrigins = [
    "https://vinayd-v10.github.io",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    config.frontendUrl
  ].filter(Boolean);
  app2.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        if (requestOrigin.endsWith(".github.io")) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(requestOrigin) || requestOrigin.includes("vercel.app") || requestOrigin.includes("run.app") || requestOrigin.includes("localhost") || requestOrigin.includes("127.0.0.1")) {
          return callback(null, true);
        }
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Razorpay-Signature"]
    })
  );
  app2.use(cookieParser());
  app2.use(
    express.json({
      limit: "15mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: true, limit: "15mb" }));
  const mountAll = (prefix) => {
    app2.use(`${prefix}/health`, health_default);
    app2.use(`${prefix}/auth`, auth_default);
    app2.use(`${prefix}/shop-status`, shopStatus_default);
    app2.use(`${prefix}/pricing`, pricing_default);
    app2.use(`${prefix}/upload`, upload_default);
    app2.use(`${prefix}/documents`, upload_default);
    app2.use(`${prefix}/orders`, orders_default);
    app2.use(`${prefix}/payments`, payments_default);
    app2.use(`${prefix}/wallet`, wallet_default);
    app2.use(`${prefix}/notifications`, notifications_default);
    app2.use(`${prefix}/shop-payment-info`, shopPaymentInfo_default);
  };
  mountAll("/api");
  mountAll("");
  app2.get("/", (_req, res) => {
    res.json({
      ok: true,
      service: "PrintEase Backend API",
      version: "2.0.0",
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.use("/api", (_req, res) => {
    res.status(404).json({
      error: "API route not found.",
      ok: false
    });
  });
  app2.use((err, _req, res, _next) => {
    console.error("[UNHANDLED_ERROR]", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal server error.",
      ok: false
    });
  });
  return app2;
}
var app = createApp();
var app_default = app;
export {
  createApp,
  app_default as default
};
