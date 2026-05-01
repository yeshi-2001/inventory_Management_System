import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";

const BASE = process.env.REACT_APP_API_URL;

const ROLES = ["Admin", "Employee", "Vendor"];

// ─── Validation schemas ───────────────────────────────────────────────────────
const passwordRules = z
  .string()
  .min(8, "Min 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number");

const userSchema = z.object({
  fullName:        z.string().min(2, "Full name is required"),
  email:           z.string().email("Invalid email address"),
  password:        passwordRules,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match", path: ["confirmPassword"],
});

const vendorSchema = z.object({
  companyName:     z.string().min(1, "Company name is required"),
  contactName:     z.string().min(1, "Contact name is required"),
  email:           z.string().email("Invalid email address"),
  phone:           z.string().optional(),
  password:        passwordRules,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match", path: ["confirmPassword"],
});

// ─── Field wrapper ────────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <div className="mt-1">{children}</div>
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

// ─── Admin / Employee form ────────────────────────────────────────────────────
function UserForm({ role, onSuccess }) {
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const res  = await fetch(`${BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, role: role.toLowerCase() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSuccess();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Full Name *" error={errors.fullName?.message}>
        <input {...register("fullName")} placeholder="e.g. Yeshika Silva" className={inputCls} />
      </Field>
      <Field label="Email *" error={errors.email?.message}>
        <input type="email" {...register("email")} placeholder="you@example.com" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password *" error={errors.password?.message}>
          <input type="password" {...register("password")} placeholder="Min 8 chars" className={inputCls} />
        </Field>
        <Field label="Confirm Password *" error={errors.confirmPassword?.message}>
          <input type="password" {...register("confirmPassword")} placeholder="Repeat" className={inputCls} />
        </Field>
      </div>
      <p className="text-xs text-gray-400">Min 8 characters, one uppercase letter, one number.</p>

      {serverError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>
      )}

      <button type="submit" disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
        {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {isSubmitting ? "Creating account..." : `Register as ${role}`}
      </button>
    </form>
  );
}

// ─── Vendor form ──────────────────────────────────────────────────────────────
function VendorForm({ onSuccess }) {
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(vendorSchema),
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const res  = await fetch(`${BASE}/auth/register-vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSuccess("vendor");
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Company Name *" error={errors.companyName?.message}>
        <input {...register("companyName")} placeholder="e.g. TechSupply Co." className={inputCls} />
      </Field>
      <Field label="Contact Person Name *" error={errors.contactName?.message}>
        <input {...register("contactName")} placeholder="e.g. John Silva" className={inputCls} />
      </Field>
      <Field label="Email *" error={errors.email?.message}>
        <input type="email" {...register("email")} placeholder="company@email.com" className={inputCls} />
      </Field>
      <Field label="Phone (optional)" error={errors.phone?.message}>
        <input {...register("phone")} placeholder="+94-77-1234567" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password *" error={errors.password?.message}>
          <input type="password" {...register("password")} placeholder="Min 8 chars" className={inputCls} />
        </Field>
        <Field label="Confirm Password *" error={errors.confirmPassword?.message}>
          <input type="password" {...register("confirmPassword")} placeholder="Repeat" className={inputCls} />
        </Field>
      </div>
      <p className="text-xs text-gray-400">Min 8 characters, one uppercase letter, one number.</p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
        ⏳ Vendor accounts require admin approval before you can log in.
      </div>

      {serverError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>
      )}

      <button type="submit" disabled={isSubmitting}
        className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
        {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {isSubmitting ? "Submitting..." : "Register as Vendor"}
      </button>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [role,    setRole]    = useState("Admin");
  const [success, setSuccess] = useState(null); // null | "user" | "vendor"
  const navigate = useNavigate();

  const handleSuccess = (type = "user") => setSuccess(type);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
          <p className="text-5xl mb-4">{success === "vendor" ? "⏳" : "✅"}</p>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {success === "vendor" ? "Registration Submitted!" : "Account Created!"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {success === "vendor"
              ? "Your vendor registration is received. You will be notified by email once the admin approves your account."
              : "Your account has been created successfully. You can now sign in."}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">📦</p>
          <h1 className="text-xl font-bold text-gray-800">Create an Account</h1>
          <p className="text-xs text-gray-400 mt-0.5">Inventory Management System</p>
        </div>

        {/* Role tabs */}
        <div className="flex rounded-lg overflow-hidden border mb-6">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium transition ${
                role === r ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Role description */}
        <div className="mb-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          {role === "Admin"    && "👑 Admin accounts have full access to inventory, analytics, billing, and user management."}
          {role === "Employee" && "👤 Employee accounts can access the POS billing system and billing history."}
          {role === "Vendor"   && "🏭 Vendor accounts can submit stock offers. Requires admin approval before login."}
        </div>

        {/* Form based on role */}
        {role === "Vendor"
          ? <VendorForm onSuccess={handleSuccess} />
          : <UserForm role={role} onSuccess={handleSuccess} />
        }

        {/* Sign in link */}
        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in here →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
