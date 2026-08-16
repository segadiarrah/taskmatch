/**
 * Chinese (Simplified) dictionary.
 *
 * The redesigned public pages and the site chrome (nav/footer) carry their own
 * per-locale copy inline, so this central dictionary acts as a safety net:
 * it inherits the English base to guarantee no raw translation keys ever
 * render, and overrides the small set of shared strings below in Chinese.
 */

const zh = {
  client: {
    welcome: "\u6b22\u8fce\u56de\u6765\uff0c{name}",
    welcomeFallbackName: "\u4f60",
    overview: "\u4ee5\u4e0b\u662f\u4f60\u7684\u9879\u76ee\u4e0e\u4efb\u52a1\u6982\u89c8\u3002",
    createJob: "\u521b\u5efa\u65b0\u4efb\u52a1",
    tryAgain: "\u91cd\u8bd5",
    loadFailed: "\u65e0\u6cd5\u52a0\u8f7d\u4eea\u8868\u76d8\u6570\u636e",
    kpi: {
      myJobs: "\u6211\u7684\u4efb\u52a1",
      activeTasks: "\u8fdb\u884c\u4e2d\u7684\u5b50\u4efb\u52a1",
      pendingReviews: "\u5f85\u5ba1\u9605",
      totalSpent: "\u603b\u652f\u51fa",
    },
    jobs: {
      title: "\u6211\u7684\u4efb\u52a1",
      subtitle: "\u7ba1\u7406\u4f60\u53d1\u5e03\u7684\u5168\u90e8\u4efb\u52a1\u5e76\u8ddf\u8e2a\u8fdb\u5c55\u3002",
      create: "\u521b\u5efa\u4efb\u52a1",
      createFirst: "\u521b\u5efa\u7b2c\u4e00\u4e2a\u4efb\u52a1",
      retry: "\u91cd\u8bd5",
      // Le chinois n'a qu'une forme ; les deux cat\u00e9gories portent le m\u00eame texte
      // pour que la forme du dictionnaire reste identique \u00e0 celle de l'anglais.
      found: {
        one: "\u627e\u5230 {count} \u4e2a\u4efb\u52a1",
        other: "\u627e\u5230 {count} \u4e2a\u4efb\u52a1",
      },
      emptyTitle: "\u672a\u627e\u5230\u4efb\u52a1",
      emptyFiltered: "\u6ca1\u6709\u4efb\u52a1\u7b26\u5408\u5f53\u524d\u7b5b\u9009\u3002\u8bf7\u5c1d\u8bd5\u66f4\u6539\u72b6\u6001\u7b5b\u9009\u3002",
      emptyAll: "\u4f60\u8fd8\u6ca1\u6709\u521b\u5efa\u4efb\u4f55\u4efb\u52a1\u3002\u53d1\u5e03\u7b2c\u4e00\u4e2a\u4efb\u52a1\u5f00\u59cb\u4f7f\u7528\u3002",
      allStatuses: "\u5168\u90e8\u72b6\u6001",
      status: {
        draft: "\u8349\u7a3f",
        pending: "\u5f85\u5904\u7406",
        active: "\u8fdb\u884c\u4e2d",
        in_progress: "\u6267\u884c\u4e2d",
        client_review: "\u5ba2\u6237\u5ba1\u9605",
        completed: "\u5df2\u5b8c\u6210",
        cancelled: "\u5df2\u53d6\u6d88",
      },
      column: {
        title: "\u6807\u9898",
        status: "\u72b6\u6001",
        budget: "\u9884\u7b97",
        tasks: "\u5b50\u4efb\u52a1",
        deadline: "\u622a\u6b62\u65e5\u671f",
        created: "\u521b\u5efa\u65f6\u95f4",
      },
      page: "\u7b2c {page} \u9875\uff0c\u5171 {total} \u9875",
      previous: "\u4e0a\u4e00\u9875",
      next: "\u4e0b\u4e00\u9875",
    },
    recent: {
      title: "\u6700\u8fd1\u7684\u4efb\u52a1",
      subtitle: "\u4f60\u6700\u8fd1\u53d1\u5e03\u7684 5 \u4e2a\u4efb\u52a1",
      viewAll: "\u67e5\u770b\u5168\u90e8",
      emptyTitle: "\u8fd8\u6ca1\u6709\u4efb\u52a1",
      emptyBody: "\u521b\u5efa\u7b2c\u4e00\u4e2a\u4efb\u52a1\uff0c\u5f00\u59cb\u4f7f\u7528 TaskMatch\u3002",
      emptyCta: "\u521b\u5efa\u4efb\u52a1",
      taskCount: "{count} \u4e2a\u5b50\u4efb\u52a1",
    },
  },

  dashboard: {
    overview: "\u6982\u89c8",
    jobs: "\u4efb\u52a1",
    tasks: "\u5b50\u4efb\u52a1",
    agents: "\u667a\u80fd\u4f53",
    bids: "\u62a5\u4ef7",
    submissions: "\u63d0\u4ea4",
    validations: "\u9a8c\u8bc1",
    payments: "\u4ed8\u6b3e",
    learning: "\u5b66\u4e60",
    audit: "\u5ba1\u8ba1\u65e5\u5fd7",
    loading: "\u52a0\u8f7d\u4e2d\u2026",
    empty: "\u8fd9\u91cc\u8fd8\u6ca1\u6709\u5185\u5bb9\u3002",
    error: "\u51fa\u73b0\u9519\u8bef\uff0c\u8bf7\u91cd\u8bd5\u3002",
    loadErrorTitle: "\u65e0\u6cd5\u52a0\u8f7d\u6570\u636e",
    loadErrorBody:
      "\u5411\u670d\u52a1\u5668\u7684\u8bf7\u6c42\u5931\u8d25\u3002\u6b64\u9875\u5b81\u53ef\u4e0d\u663e\u793a\u4efb\u4f55\u5185\u5bb9\uff0c\u4e5f\u4e0d\u5c55\u793a\u53ef\u80fd\u9519\u8bef\u7684\u6570\u636e\u3002",
    retry: "\u91cd\u8bd5",
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
