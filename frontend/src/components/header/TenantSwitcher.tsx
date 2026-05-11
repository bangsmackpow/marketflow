import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronDown } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import { getDesignProfile, applyDesignProfile } from "../../lib/design-system";

export default function TenantSwitcher() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await authClient.getSession();
      return data;
    },
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data } = await authClient.organization.list();
      return data;
    },
  });

  const activeOrgId = session?.session.activeOrganizationId;
  const activeOrg = organizations?.find((o) => o.id === activeOrgId) ?? null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitch(orgId: string) {
    await authClient.organization.setActive({ organizationId: orgId });
    setOpen(false);

    const { data: newSession } = await authClient.getSession();
    const newOrgId = newSession?.session.activeOrganizationId;

    if (newOrgId) {
      const profile = getDesignProfile(null);
      applyDesignProfile(profile);
    }

    queryClient.invalidateQueries({ queryKey: ["session"] });
    queryClient.invalidateQueries({ queryKey: ["organizations"] });
  }

  if (!organizations || organizations.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
      >
        <Building2 className="h-4 w-4" style={{ color: "var(--clr-primary, #0070c4)" }} />
        <span className="max-w-[120px] truncate font-medium">{activeOrg?.name || "Select company"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-surface-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-surface-200 bg-white py-1 shadow-lg">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-surface-400">
            Switch company
          </div>
          {organizations.map((org) => {
            const isActive = org.id === activeOrgId;
            return (
              <button
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-surface-50 text-surface-900" : "text-surface-600 hover:bg-surface-50"
                }`}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                  style={{
                    backgroundColor: isActive ? "var(--clr-primary, #0070c4)" : "var(--clr-muted, #f1f3f5)",
                    color: isActive ? "#fff" : "var(--clr-muted-foreground, #868e96)",
                  }}
                >
                  {org.name.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{org.name}</p>
                  <p className="text-xs text-surface-400">/{org.slug}</p>
                </div>
                {isActive && <Check className="h-4 w-4" style={{ color: "var(--clr-primary, #0070c4)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
