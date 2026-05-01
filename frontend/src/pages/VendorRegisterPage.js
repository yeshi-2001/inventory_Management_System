import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";

const BASE = process.env.REACT_APP_API_URL;

const schema = z.object({
  companyName:     z.string().min(1, "Company name is required"),
  contactName:     z.string().min(1, "Contact name is required"),
  email:           z.string().email("Invalid email address"),
  password:        z.string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
  phone:           z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Field = ({ label, error, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <div className="mt-1">{children}</div>
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

export default function VendorRegisterPage() {
  const [success,     setSuccess]     = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
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
      setSuccess(true);
    } catch (err) {
      setServerError(err.message);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Registration Submitted!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your registration has been received. You will get an email once the admin approves your account.
          </p>
          <Link
            to="/login"
            className="block w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 text-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Register form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">📦</p>
          <h1 className="text-xl font-bold text-gray-800">Inventory WMS</h1>
          <p className="text-xs text-gray-400 mt-0.5">Warehouse Management System</p>
        </div>

        {/* Already have account — prominent button */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">Already have an account?</p>
            <p className="text-xs text-blue-500">Admin, Employee or Vendor</p>
          </div>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            Sign In →
          </Link>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400">New vendor? Register below</span>
          </div>
        </div>

        {/* Registration form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Company Name *" error={errors.companyName?.message}>
            <input
              {...register("companyName")}
              placeholder="e.g. TechSupply Co."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field label="Contact Person Name *" error={errors.contactName?.message}>
            <input
              {...register("contactName")}
              placeholder="e.g. John Silva"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field label="Email *" error={errors.email?.message}>
            <input
              type="email"
              {...register("email")}
              placeholder="company@email.com"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field label="Phone (optional)" error={errors.phone?.message}>
            <input
              {...register("phone")}
              placeholder="+94-77-1234567"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Password *" error={errors.password?.message}>
              <input
                type="password"
                {...register("password")}
                placeholder="Min 8 chars"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Confirm Password *" error={errors.confirmPassword?.message}>
              <input
                type="password"
                {...register("confirmPassword")}
                placeholder="Repeat password"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </div>

          <p className="text-xs text-gray-400">
            Password must be at least 8 characters with one uppercase letter and one number.
          </p>

          {serverError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isSubmitting ? "Submitting..." : "Register as Vendor"}
          </button>
        </form>
      </div>
    </div>
  );
}
