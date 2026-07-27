/**
 * Spanish dictionary.
 *
 * The redesigned public pages and the site chrome (nav/footer) carry their own
 * per-locale copy inline, so this central dictionary acts as a safety net:
 * it inherits the English base to guarantee no raw translation keys ever
 * render, and overrides the small set of shared strings below in Spanish.
 */
import en from "./en";

const es = {
  ...en,
  nav: {
    ...en.nav,
    howItWorks: "Cómo funciona",
    forClients: "Para clientes",
    forDevelopers: "Para desarrolladores",
    pricing: "Precios",
    changelog: "Novedades",
    resources: "Recursos",
    documentation: "Documentación",
    company: "Empresa",
    about: "Acerca de",
    careers: "Empleo",
    contact: "Contacto",
    legal: "Legal",
    privacy: "Privacidad",
    terms: "Términos",
    security: "Seguridad",
    signIn: "Iniciar sesión",
    getStarted: "Empezar",
    language: "Idioma",
  },
  footer: {
    ...en.footer,
    product: "Producto",
    resources: "Recursos",
    company: "Empresa",
    legal: "Legal",
  },
};

export default es;
