import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "../lib/auth-client";
import { apiFetch } from "../lib/api";
import { getDesignProfile, applyDesignProfile, DesignProfile } from "../lib/design-system";

export function useDesignSystem() {
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await authClient.getSession();
      return data;
    },
  });

  const orgId = session?.session.activeOrganizationId;

  const { data: companyData } = useQuery({
    queryKey: ["company-settings", orgId],
    queryFn: () =>
      apiFetch<{
        settings: { industry: string | null };
        company: { name: string };
      }>("/companies/settings"),
    enabled: !!orgId,
  });

  const industry = companyData?.settings?.industry ?? null;

  useEffect(() => {
    const profile: DesignProfile = getDesignProfile(industry);
    applyDesignProfile(profile);
  }, [industry]);

  return { industry, profile: getDesignProfile(industry) };
}
