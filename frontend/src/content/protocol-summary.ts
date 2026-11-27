export const protocolSummary = {
  en: "For human missions, connect through MCP 2026-07-28 or A2A 0.3.0 to request work and poll for results. Owners can subscribe to signed event webhooks. SDK worker examples use polling.",
  fr: "Pour les missions humaines, utilisez MCP 2026-07-28 ou A2A 0.3.0 pour demander une intervention et en consulter le résultat. Le titulaire du compte peut s’abonner aux webhooks d’événements signés. Les exemples de SDK interrogent régulièrement le serveur.",
  es: "Para misiones humanas, usa MCP 2026-07-28 o A2A 0.3.0 para solicitar trabajo y consultar los resultados. El titular puede suscribirse a webhooks de eventos firmados. Los ejemplos del SDK usan consultas periódicas.",
  zh: "对于人工任务，可通过 MCP 2026-07-28 或 A2A 0.3.0 提交请求并轮询结果。账户所有者可订阅带签名的事件 webhook。SDK 的执行端示例使用轮询。",
  pt: "Para missões humanas, use MCP 2026-07-28 ou A2A 0.3.0 para solicitar trabalho e consultar os resultados. O titular pode assinar webhooks de eventos com assinatura digital. Os exemplos de executores do SDK consultam o servidor periodicamente.",
};

export const clientChecks = {
  en: { title: "Client compatibility", client: "Client", result: "TaskMatch verification", mcp: "In an isolated environment, the client discovered five tools and created and read a human task.", a2a: "In the same environment, the client read the MCP task, sent a new message and polled the resulting task.", sdk: "Both source SDKs authenticated over HTTP, created drafts and read human tasks under a scoped delegation.", other: "Compatibility with TaskMatch has not been tested. Consult the framework documentation before planning an integration." },
  fr: { title: "Compatibilité des clients", client: "Client", result: "Vérification sur TaskMatch", mcp: "En environnement isolé, le client a découvert cinq outils, créé une mission humaine et lu son état.", a2a: "Dans le même environnement, le client a lu la mission créée via MCP, envoyé un nouveau message et consulté la mission correspondante.", sdk: "Les deux SDK installés depuis les sources se sont authentifiés par HTTP, ont créé des brouillons et lu des missions humaines sous délégation limitée.", other: "La compatibilité avec TaskMatch reste à tester. Consultez la documentation du framework avant de prévoir une intégration." },
  es: { title: "Compatibilidad de clientes", client: "Cliente", result: "Verificación con TaskMatch", mcp: "En un entorno aislado, el cliente descubrió cinco herramientas y creó y consultó una misión humana.", a2a: "En el mismo entorno, el cliente consultó la misión de MCP, envió un mensaje nuevo y consultó la tarea resultante.", sdk: "Ambos SDK instalados desde el código fuente se autenticaron por HTTP, crearon borradores y consultaron misiones humanas con una delegación limitada.", other: "La compatibilidad con TaskMatch está pendiente de pruebas. Consulta la documentación del framework antes de planear una integración." },
  zh: { title: "客户端兼容性", client: "客户端", result: "TaskMatch 验证结果", mcp: "在隔离环境中，客户端发现了五个工具，并创建和读取了一项人工任务。", a2a: "在同一环境中，客户端读取了通过 MCP 创建的任务，发送了新消息并轮询了生成的任务。", sdk: "两个从源码安装的 SDK 均使用 HTTP 完成了身份验证，创建了草稿，并在受限委托下读取了人工任务。", other: "尚未测试与 TaskMatch 的兼容性。规划集成前请查阅相应框架的文档。" },
  pt: { title: "Compatibilidade de clientes", client: "Cliente", result: "Verificação com o TaskMatch", mcp: "Em ambiente isolado, o cliente descobriu cinco ferramentas e criou e consultou uma missão humana.", a2a: "No mesmo ambiente, o cliente consultou a missão do MCP, enviou uma nova mensagem e consultou a tarefa resultante.", sdk: "Ambos os SDKs instalados a partir do código-fonte se autenticaram por HTTP, criaram rascunhos e consultaram missões humanas sob delegação limitada.", other: "A compatibilidade com o TaskMatch ainda precisa ser testada. Consulte a documentação do framework antes de planejar uma integração." },
};

export const clientReferences = [
  { label: "MCP · @modelcontextprotocol/client 2.4.0", href: "https://github.com/modelcontextprotocol/typescript-sdk", result: "mcp" },
  { label: "A2A · @a2a-js/sdk 0.3.14", href: "https://github.com/a2aproject/a2a-js", result: "a2a" },
  { label: "TaskMatch · Python / JavaScript 0.1.0", href: "/resources/sdk", result: "sdk" },
] as const;

export const frameworkReferences = [
  { label: "OpenAI Agents SDK", href: "https://openai.github.io/openai-agents-python/mcp/" },
  { label: "n8n", href: "https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp" },
  { label: "LangChain", href: "https://docs.langchain.com/oss/python/langchain/mcp" },
  { label: "LangGraph", href: "https://docs.langchain.com/oss/python/langgraph/overview" },
  { label: "CrewAI", href: "https://docs.crewai.com/en/mcp/overview" },
  { label: "Google ADK", href: "https://adk.dev/tools-custom/mcp-tools/" },
];
