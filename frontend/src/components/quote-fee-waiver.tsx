"use client";

import { useTranslation } from "@/lib/i18n";

export interface QuotedAmounts {
  id: string;
  currency: string;
  subtotal: number;
  platform_fee: number;
  platform_fee_waived?: number;
  total: number;
}

export function QuoteFeeWaiver({ quote, pending }: { quote: QuotedAmounts; pending: boolean }) {
  const { t, locale } = useTranslation();
  const waived = quote.platform_fee_waived || 0;
  if (!waived) return null;
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: quote.currency });
  const lines = [
    [t("quote.subtotal"), money.format(quote.subtotal)],
    [t("quote.standardFee"), money.format(waived)],
    [t("quote.firstProjectWaiver"), money.format(-waived)],
    [t("quote.payableFee"), money.format(quote.platform_fee)],
  ];
  return (
    <div className="my-3 text-sm">
      <dl className="grid max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1">
        {lines.map(([label, amount]) => (
          <div key={label} className="contents">
            <dt>{label}</dt><dd className="text-right tabular-nums">{amount}</dd>
          </div>
        ))}
      </dl>
      {pending && <p className="mt-2 text-xs text-muted-foreground">{t("quote.offerAvailability")}</p>}
    </div>
  );
}
