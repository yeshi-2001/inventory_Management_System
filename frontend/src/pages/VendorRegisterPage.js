import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";

const BASE = process.env.REACT_APP_API_URL;

const schema = z.object({
  companyName:  z.string().min(1, "Company name is required"),
  contactName:  z.string().min(1, "Contact name is required"),
  email:        z.string().email("Invalid email address"),
  password:     z.string().min(8, "Min 8 characters").regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
  phone:        z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

const Field = ({ label, error, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <div className="mt-1">{children}</div>
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

export default function VendorRegisterPage() {
  const [success, setSuccess] = useState(false);
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
          <p className="text-4xl mb-3">✅</p>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Registration Submitted</h2>
          <p className="text-sm text-gray-500 mb-4">You will receive an email once your account is approved by the admin.</p>
          <Link to="/login" className="text-blue-600 text-sm hover:underline">← Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <p className="text-3xl">📦</p>
          <h1 className="text-xl font-bold text-gray-800 mt-1">Vendor Registration</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Company Name *" error={errors.companyName?.message}>
            <input {...register("companyName")} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Contact Person Name *" error={errors.contactName?.message}>
            <input {...register("contactName")} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Email *" error={errors.email?.message}>
            <input type="email" {...register("email")} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Phone (optional)" error={errors.phone?.message}>
            <input {...register("phone")} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Password *" error={errors.password?.message}>
            <input type="password" {...register("password")} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>
          <Field label="Confirm Password *" error={errors.confirmPassword?.message}>
            <input type="password" {...register("confirmPassword")} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </Field>

          {serverError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? "Submitting..." : "Register"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
