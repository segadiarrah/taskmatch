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

  /* ------------------------------------------------------------------------ */
  /*  \u62a5\u4ef7 \u2014 \u7531 TaskMatch \u5b9a\u4ef7\uff0c\u5ba2\u6237\u786e\u8ba4                                 */
  /* ------------------------------------------------------------------------ */
  quote: {
    title: "\u60a8\u7684\u62a5\u4ef7",
    subtitle:
      "TaskMatch \u4e3a\u6bcf\u9879\u4efb\u52a1\u5b9a\u4ef7\u2014\u2014\u60a8\u65e0\u9700\u5728\u5e02\u573a\u4e0a\u7ade\u4ef7\u3002\u5728\u60a8\u786e\u8ba4\u4e4b\u524d\uff0c\u4e0d\u4f1a\u6267\u884c\u4efb\u4f55\u5de5\u4f5c\uff0c\u4e5f\u4e0d\u4f1a\u8ba1\u8d39\u3002",
    pricingInProgress: "\u6b63\u5728\u4e3a\u60a8\u7684\u9700\u6c42\u5b9a\u4ef7\u2014\u2014\u9700\u8981\u51e0\u79d2\u949f\u3002",
    pricingHint: "TaskMatch \u6309\u4efb\u52a1\u5b9a\u4ef7\u3002\u672a\u7ecf\u60a8\u786e\u8ba4\u4e0d\u4f1a\u5f00\u59cb\u3002",
    totalLabel: "\u603b\u8ba1",
    totalBreakdown: "\u5305\u542b",
    platformFee: "\u5e73\u53f0\u670d\u52a1\u8d39",
    humanEquivalent: "\u4eba\u5de5\u4e13\u5bb6\u7b49\u6548\u62a5\u4ef7",
    savings: "\u60a8\u8282\u7701",
    validUntil: "\u6709\u6548\u671f\u81f3",
    perTask: "\u5404\u4efb\u52a1\u4ef7\u683c",
    routeLlm: "AI \u4ee3\u7406",
    routeHuman: "\u4eba\u5de5\u4e13\u5bb6",
    routeHybrid: "AI + \u4eba\u5de5\u590d\u6838",
    tokenCost: "Token \u6210\u672c",
    compute: "\u7b97\u529b",
    orchestration: "\u7f16\u6392\u8c03\u5ea6",
    validation: "\u9a8c\u8bc1",
    expertRange: "\u5411\u4e13\u5bb6\u63d0\u4f9b\u7684\u533a\u95f4\uff1a",
    humanWouldCost: "\u4eba\u5de5\u4e13\u5bb6\u7684\u8d39\u7528\u4e3a\uff1a",
    hoursShort: " \u5c0f\u65f6",
    gateNotice:
      "\u786e\u8ba4\u540e\u5c06\u542f\u52a8\u6267\u884c\uff0c\u5e76\u5c06\u91d1\u989d\u7f6e\u4e8e\u6258\u7ba1\u3002\u4ec5\u5728\u4ea4\u4ed8\u901a\u8fc7\u9a8c\u8bc1\u540e\u624d\u4f1a\u652f\u4ed8\u3002",
    accept: "\u786e\u8ba4\u5e76\u5f00\u59cb",
    accepting: "\u786e\u8ba4\u4e2d\u2026",
    decline: "\u62d2\u7edd",
    rejecting: "\u62d2\u7edd\u4e2d\u2026",
    confirmReject: "\u786e\u8ba4\u62d2\u7edd",
    cancel: "\u53d6\u6d88",
    rejectPrompt: "\u8fd9\u4e2a\u4ef7\u683c\u54ea\u91cc\u4e0d\u5408\u9002\uff1f",
    statusAccepted: "\u5df2\u786e\u8ba4",
    statusRejected: "\u5df2\u62d2\u7edd",
    statusExpired: "\u5df2\u8fc7\u671f",
    acceptedNotice: "\u62a5\u4ef7\u5df2\u786e\u8ba4\u2014\u2014\u6267\u884c\u5df2\u5f00\u59cb\u3002",
    rejectedReason: "\u62d2\u7edd\u7406\u7531\uff1a",
    requoteHint: "\u8c03\u6574\u9700\u6c42\u6216\u4ea4\u4ed8\u65b9\u5f0f\u540e\uff0c\u91cd\u65b0\u7533\u8bf7\u62a5\u4ef7\u3002",
    errorLoad: "\u65e0\u6cd5\u52a0\u8f7d\u62a5\u4ef7\u3002",
    errorAccept: "\u65e0\u6cd5\u786e\u8ba4\u62a5\u4ef7\uff0c\u8bf7\u91cd\u8bd5\u3002",
    errorReject: "\u65e0\u6cd5\u62d2\u7edd\u62a5\u4ef7\uff0c\u8bf7\u91cd\u8bd5\u3002",
  },

  /* ------------------------------------------------------------------------ */
  /*  \u4ea4\u4ed8\u4e0e\u79fb\u4ea4                                                          */
  /* ------------------------------------------------------------------------ */
  delivery: {
    title: "\u4ea4\u4ed8\u4e0e\u79fb\u4ea4",
    subtitle:
      "\u5b8c\u6210\u7684\u5de5\u4f5c\u5982\u4f55\u9001\u8fbe\u2014\u2014\u6587\u6863\u3001\u4ee3\u7801\u4ed3\u5e93\uff0c\u6216\u5b89\u88c5\u5728\u60a8\u81ea\u5df1\u7684\u57fa\u7840\u8bbe\u65bd\u4e0a\u3002",
    loading: "\u6b63\u5728\u52a0\u8f7d\u4ea4\u4ed8\u65b9\u6848\u2026",
    signedOff: "\u5df2\u786e\u8ba4\u9a8c\u6536",
    modeTitle: "\u4ea4\u4ed8\u65b9\u5f0f",
    mode: {
      document: "\u6587\u6863",
      repository: "\u4ee3\u7801\u4ed3\u5e93",
      dataset: "\u6570\u636e\u96c6",
      installation: "\u5b89\u88c5\u90e8\u7f72",
      hosted: "\u6258\u7ba1",
    },
    requirements: "\u9700\u8981\u60a8\u63d0\u4f9b\u7684\u5185\u5bb9",
    requoteNotice:
      "\u66f4\u6539\u4ea4\u4ed8\u65b9\u5f0f\u4f1a\u6539\u53d8\u6240\u9700\u7684\u5de5\u4f5c\u91cf\u3002\u8bf7\u91cd\u65b0\u7533\u8bf7\u62a5\u4ef7\u4ee5\u5339\u914d\u4ef7\u683c\u3002",
    accessTitle: "\u8bbf\u95ee\u51ed\u636e",
    accessHelp:
      "\u9759\u6001\u52a0\u5bc6\u5b58\u50a8\uff0c\u9650\u5236\u67e5\u770b\u6b21\u6570\uff0c\u6bcf\u6b21\u8bbf\u95ee\u5747\u6709\u5ba1\u8ba1\u8bb0\u5f55\uff0c\u5e76\u5728\u60a8\u9a8c\u6536\u65f6\u81ea\u52a8\u5410\u9500\u3002",
    vaultUnavailable:
      "\u5f53\u524d\u73af\u5883\u672a\u914d\u7f6e\u51ed\u636e\u4fdd\u9669\u5e93\uff0c\u65e0\u6cd5\u5b58\u50a8\u51ed\u636e\u3002\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u3002",
    addGrant: "\u5171\u4eab\u51ed\u636e",
    grantLabel: "\u7528\u9014\u8bf4\u660e",
    grantSecret: "\u51ed\u636e",
    store: "\u5b89\u5168\u5b58\u50a8",
    reveal: "\u67e5\u770b",
    reveals: "\u6b21\u67e5\u770b",
    revoke: "\u5410\u9500",
    grantRevoked: "\u5df2\u5410\u9500",
    grantExpired: "\u5df2\u8fc7\u671f",
    signOffHelp: "\u786e\u8ba4\u4ea4\u4ed8\u5df2\u9001\u8fbe\u3002\u60a8\u5171\u4eab\u7684\u6240\u6709\u51ed\u636e\u5c06\u7acb\u5373\u5410\u9500\u3002",
    signOffAction: "\u786e\u8ba4\u79fb\u4ea4",
    errorUpdate: "\u65e0\u6cd5\u66f4\u65b0\u4ea4\u4ed8\u65b9\u5f0f\u3002",
    errorGrant: "\u65e0\u6cd5\u5b58\u50a8\u51ed\u636e\u3002",
    errorReveal: "\u8be5\u51ed\u636e\u5df2\u65e0\u6cd5\u518d\u6b21\u67e5\u770b\u3002",
    errorRevoke: "\u65e0\u6cd5\u5410\u9500\u51ed\u636e\u3002",
    errorSignOff: "\u65e0\u6cd5\u786e\u8ba4\u79fb\u4ea4\u3002",
  },

};

export default zh;
