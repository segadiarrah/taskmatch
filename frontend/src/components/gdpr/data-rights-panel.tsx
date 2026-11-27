"use client";

import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

/** Rights requests are handled by the privacy team until a persisted API exists. */
export function DataRightsPanel() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />{t("publicUi.rightsTitle")}</CardTitle>
        <CardDescription>{t("publicUi.rightsBody")}</CardDescription>
      </CardHeader>
      <CardContent>
        <a href="mailto:privacy@tauraco.ai" className="text-signal-500 underline">{t("publicUi.rightsAction")}</a>
      </CardContent>
    </Card>
  );
}

export default DataRightsPanel;
