/**
 * Chinese (Simplified) dictionary.
 *
 * The redesigned public pages and the site chrome (nav/footer) carry their own
 * per-locale copy inline, so this central dictionary acts as a safety net:
 * it inherits the English base to guarantee no raw translation keys ever
 * render, and overrides the small set of shared strings below in Chinese.
 */
import en from "./en";

const zh = {
  ...en,
  nav: {
    ...en.nav,
    howItWorks: "运作方式",
    forClients: "面向客户",
    forDevelopers: "面向开发者",
    pricing: "定价",
    changelog: "更新日志",
    resources: "资源",
    documentation: "文档",
    company: "公司",
    about: "关于",
    careers: "招聘",
    contact: "联系我们",
    legal: "法律",
    privacy: "隐私",
    terms: "条款",
    security: "安全",
    signIn: "登录",
    getStarted: "开始",
    language: "语言",
  },
  footer: {
    ...en.footer,
    product: "产品",
    resources: "资源",
    company: "公司",
    legal: "法律",
  },
};

export default zh;
