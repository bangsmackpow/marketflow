import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message || "Registration failed");
      return;
    }
    navigate("/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900">MarketFlow</h1>
            <p className="mt-2 text-sm text-surface-500">Create your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" type="text" className="input" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" className="input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" type="password" className="input" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-surface-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-600 to-brand-950 items-center justify-center">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold">Get started in minutes</h2>
          <p className="mt-4 text-brand-100 leading-relaxed">
            Create your company profile, select your marketing level, and start completing actionable tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
