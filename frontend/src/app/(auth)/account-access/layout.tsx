import { requestLanguage } from "@/lib/request-locale";
import { shareMetadata } from "@/lib/share-metadata";

const description = {
  en: { title: "Account access", body: "Verify your email address or request a password reset." },
  fr: { title: "Accès au compte", body: "Vérifiez votre adresse e-mail ou demandez à réinitialiser votre mot de passe." },
  es: { title: "Acceso a la cuenta", body: "Verifica tu correo electrónico o solicita restablecer la contraseña." },
  pt: { title: "Acesso à conta", body: "Verifique seu e-mail ou solicite a redefinição da senha." },
  zh: { title: "账户访问", body: "验证您的电子邮箱或申请重置密码。" },
};

export async function generateMetadata() {
  const { locale } = await requestLanguage();
  const { title, body } = description[locale];
  return { ...shareMetadata("/account-access", locale, { title, description: body }), robots: { index: false, follow: false } };
}

export default function AccountAccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
