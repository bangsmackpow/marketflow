import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function Onboarding() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(val: string) {
    setCompanyName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: orgError } = await authClient.organization.create({ name: companyName, slug });
    setLoading(false);
    if (orgError) {
      setError(orgError.message || "Failed to create company");
      return;
    }
    navigate("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-900">Set up your company</h1>
          <p className="mt-2 text-sm text-surface-500">Tell us about your business so we can tailor the experience.</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label htmlFor="companyName" className="label">Company name</label>
            <input id="companyName" type="text" className="input" placeholder="Acme Marketing Co." value={companyName} onChange={(e) => handleNameChange(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="slug" className="label">URL slug</label>
            <div className="flex items-center rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm text-surface-500">
              <span>marketflow.app/</span>
              <input id="slug" type="text" className="input flex-1 border-0 bg-transparent px-0" placeholder="acme-co" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
          </div>
          <div>
            <label htmlFor="industry" className="label">Industry</label>
            <select id="industry" className="input" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">Select an industry</option>
              <option value="ecommerce">E-commerce</option>
              <option value="saas">SaaS / Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="finance">Finance</option>
              <option value="hospitality">Hospitality</option>
              <option value="real-estate">Real Estate</option>
              <option value="professional-services">Professional Services</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating company..." : "Create company"}
          </button>
        </form>
      </div>
    </div>
  );
}
