import { requestLanguage } from "@/lib/request-locale";
import { countryOptions } from "@/lib/countries";
import Registration from "./registration";

export default async function RegisterPage() {
  const { locale } = await requestLanguage();
  return <Registration initialLocale={locale} initialCountries={countryOptions(locale)} />;
}
