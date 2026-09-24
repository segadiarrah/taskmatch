import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../src/lib/billing.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { stripeUrl, formatMinor } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

test("hosted financial links require a Stripe HTTPS origin without embedded credentials", () => {
  for (const url of ["https://checkout.stripe.com/c/pay/test", "https://connect.stripe.com/setup/test", "https://dashboard.stripe.com/test", "https://pay.stripe.com/receipts/test"]) {
    assert.equal(stripeUrl(url), url);
  }
  for (const url of ["http://checkout.stripe.com/test", "https://checkout.stripe.com.example.test/", "https://stripe.com@evil.test/", "https://user:password@checkout.stripe.com/test", "https://checkout.stripe.com:8443/test", "javascript:alert(1)", "/checkout", null]) {
    assert.equal(stripeUrl(url), null);
  }
});

test("minor-unit amounts preserve cents in all supported currencies", () => {
  assert.equal(formatMinor(1259, "EUR", "en-US"), "€12.59");
  assert.equal(formatMinor(1, "USD", "en-US"), "$0.01");
  assert.equal(formatMinor(100, "GBP", "en-US"), "£1.00");
});
