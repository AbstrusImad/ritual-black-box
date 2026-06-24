Eres un experto full-stack Web3 engineer, arquitecto Solidity, diseñador UI/UX avanzado, experto en frontend creativo, experto en visualización de datos on-chain y desarrollador de herramientas para builders.

Quiero que construyas una aplicación completa para Ritual L1 llamada:

# Ritual Black Box

Ritual Black Box es una herramienta web avanzada de análisis, auditoría y diagnóstico para contratos, agentes y workflows desplegados en Ritual L1.

La idea principal es crear una “caja negra” como la de un avión, pero para agentes y contratos en Ritual. Cuando un builder pega la dirección de su contrato/agente, la app reconstruye la historia pública del contrato usando datos on-chain: transacciones, eventos emitidos, callbacks, fallos visibles, balances, cambios de estado detectables, interacciones con RitualWallet, ejecución de workflows y señales relacionadas con async jobs.

La app debe ayudar al builder a entender:

* Qué hizo el contrato/agente
* Cuándo lo hizo
* Qué eventos emitió
* Qué callbacks recibió
* Qué transacciones fallaron
* Qué riesgos aparecen
* Qué partes del flujo parecen rotas
* Qué debería corregirse
* Qué información no se puede saber porque no fue emitida on-chain

Importante: la app NO debe fingir que puede saber datos internos privados o cosas que el contrato nunca emitió. Debe ser honesta: puede reconstruir lo público on-chain, pero no puede adivinar lógica interna oculta. Si falta información, debe decirlo claramente.

La app debe estar pensada para Ritual L1 testnet, chainId 1979, y debe estar diseñada alrededor de conceptos reales de Ritual como:

* RitualWallet
* Scheduler
* Async jobs
* Callback delivery
* Agents
* TEE/executor-inspired lifecycle
* Precompile-style workflows
* Memory/state updates
* On-chain events
* Failure traces
* Contract forensic analysis

NO quiero una dApp normal. NO quiero landing page genérica. NO quiero dashboard común con cards. NO quiero PFP generator. NO quiero juego. NO quiero quiz. NO quiero faucet. NO quiero casino. NO quiero prediction app. NO quiero NFT mint page. NO quiero chatbot simple. NO quiero otra app repetida de la comunidad.

Quiero una herramienta seria, original, visual, futurista, útil y memorable.

La aplicación debe ser una mezcla entre:

* Caja negra de avión
* Laboratorio cyberpunk
* Explorador on-chain inteligente
* Sala de investigación forense
* Consola técnica para builders
* Mapa visual de señales y eventos

# Concepto visual

El diseño debe ser oscuro, premium, forense, misterioso y muy avanzado.

La pantalla principal debe sentirse como una cámara de investigación futurista. En el centro debe aparecer una caja negra 3D o pseudo-3D flotando. Alrededor de la caja deben orbitar líneas, señales, bloques, eventos, hashes, callbacks y partículas. Cuando el usuario pega una dirección de contrato y hace click en “Analyze”, la caja debe abrirse visualmente y empezar un escaneo holográfico.

Estética visual:

* Black glass
* Hologramas
* Paneles flotantes
* Líneas neón
* Partículas suaves
* Glitches elegantes
* Radar circular
* Efectos de escaneo
* Mapas de señales
* Timeline vivo
* Animaciones de datos entrando a la caja
* Nodos conectados por líneas luminosas
* Errores como grietas rojas o corrupción visual
* Estados correctos como pulsos azules/violetas/verdes
* Async jobs como cápsulas viajando entre nodos
* RitualWallet como núcleo de energía
* Scheduler como reloj cósmico/mecánico
* Callbacks como señales que regresan a la caja

El estilo debe sentirse maravilloso, no básico. Debe parecer una herramienta premium que un builder recordaría inmediatamente.

# Animaciones y efectos obligatorios

La app debe incluir animaciones avanzadas, pero sin afectar demasiado el rendimiento.

Debe tener:

* Animación inicial de la Black Box flotando
* Escaneo holográfico cuando se analiza un contrato
* Timeline que se construye evento por evento
* Eventos apareciendo como señales luminosas
* Glitches suaves cuando hay errores
* Nodos que se iluminan cuando están activos
* Transiciones entre páginas con movimiento fluido
* Hover effects premium
* Micro-interacciones en botones, inputs y panels
* Pulsos de energía en RitualWallet
* Reloj animado para Scheduler
* Ondas de señal para callbacks
* Efecto “autopsy opening” en la página de fallos
* Signal Map con conexiones animadas
* Estados de carga que no sean spinners comunes
* Efectos de partículas o ruido digital sutil
* Efectos visuales diferentes para success, warning, danger y unknown

Usa animaciones con Framer Motion o una librería similar. Si usas canvas/WebGL/Three.js para la caja 3D, debe estar bien optimizado. Si no usas 3D real, crea un efecto 2.5D convincente con CSS, SVG y motion.

# Estructura de la app

La app debe ser multi-page y con estructura única. No uses el patrón común de landing + dashboard + form + results.

Debe tener estas áreas principales:

## 1. Analyze Chamber

Esta es la entrada principal de la app.

Aquí el builder puede:

* Conectar wallet
* Ver la red Ritual L1 testnet
* Pegar una dirección de contrato/agente
* Opcionalmente cargar ABI
* Iniciar análisis
* Ver si la dirección parece contrato válido
* Ver si hay eventos detectables
* Ver si el contrato tiene historial suficiente
* Ver advertencias si el contrato no emite logs útiles

La UI debe parecer una cámara de escaneo. El input de dirección no debe parecer un formulario aburrido. Debe estar integrado en el diseño, como si el usuario insertara una “señal” dentro de la caja negra.

Durante el análisis, mostrar pasos visuales:

* Verificando address
* Buscando bytecode
* Leyendo historial público
* Decodificando eventos
* Detectando callbacks
* Buscando fallos
* Construyendo timeline
* Generando informe
* Identificando riesgos

Si no hay suficiente información, mostrar un mensaje honesto:
“Este contrato no emite suficientes eventos para reconstruir una historia completa. Puedes instalar BlackBoxLogger.sol para mejorar el análisis.”

## 2. Agent Flight Recorder

Esta página muestra todo lo que el contrato/agente hizo como una historia cronológica.

No debe ser una tabla aburrida. Debe ser un timeline vivo, como el registro de vuelo de un avión.

Cada evento debe mostrar:

* Timestamp
* Block number
* Transaction hash
* Tipo de evento
* Estado: success, warning, failure, unknown
* Explicación humana
* Detalles técnicos expandibles
* Contrato relacionado
* Wallet relacionada
* Nodo visual relacionado

Ejemplos de eventos:

* Contract deployed
* RitualWallet funded
* Scheduler wake detected
* Async job requested
* Callback received
* Memory updated
* Execution failed
* Funds missing
* Unknown external call
* Owner changed
* Permission updated
* Repeated failure pattern detected

Debe haber filtros visuales:

* All signals
* Success
* Warning
* Failure
* Callback
* Scheduler
* Wallet
* Memory
* Unknown

También debe haber un modo “Narrative Mode” que convierta el timeline técnico en una explicación simple:

“El agente fue activado, intentó ejecutar una tarea async, pero no se encontró un callback exitoso después. Esto puede indicar timeout, fallo de executor o falta de eventos.”

## 3. Failure Autopsy

Esta página analiza fallos.

Debe sentirse como una autopsia técnica de un fallo on-chain. Visualmente, la app abre la Black Box y muestra dentro las piezas rotas del flujo.

Debe detectar y explicar problemas como:

* Transacciones revertidas
* Eventos incompletos
* Callback no recibido
* Posible callback mal validado
* Async job sin continuación visible
* Falta de fondos en RitualWallet
* Estado cambiado entre request y callback
* Scheduler inactivo
* Repeated failed transactions
* Owner-only function failed
* Unknown error selector
* Missing ABI
* Contract not verified or not decodable
* Too few events emitted
* Possible TOCTOU risk
* Missing Failure Handler pattern

Cada fallo debe tener:

* Severidad: low, medium, high, critical
* Confianza: detected, inferred, uncertain
* Explicación simple
* Evidencia on-chain
* Posible causa
* Recomendación
* Código o patrón sugerido cuando aplique

Ejemplo:
“Se detectó una transacción fallida después de una llamada que parece iniciar un async job. No hay callback visible después. Causa posible: el contrato no emitió evento de callback, el job falló, o el callback route no fue configurado.”

La app nunca debe inventar. Si algo es inferencia, debe marcarlo como inferencia.

## 4. Signal Map

Esta página muestra un mapa visual de relaciones.

Debe representar:

* Contrato principal
* Wallet del usuario
* Contratos llamados
* RitualWallet
* CallbackRouter
* Scheduler
* Memory contracts
* Otros contratos relacionados
* Transacciones importantes
* Eventos importantes

Debe parecer un mapa de investigación con nodos conectados, no un gráfico genérico.

Tipos de conexiones:

* Transaction
* Event emitted
* Callback
* Funding
* Ownership
* Scheduler wake
* Memory update
* Unknown interaction

Cada nodo debe poder abrir un inspector lateral con detalles.

Debe tener zoom, pan, hover y animaciones de señales viajando entre nodos.

## 5. Fix Console

Esta página da recomendaciones prácticas.

No debe ser solo “errores”. Debe decir qué hacer.

Ejemplos de recomendaciones:

* Añade eventos más claros
* Añade BlackBoxLogger.sol
* Valida msg.sender en callbacks
* Emite evento al crear async job
* Emite evento al recibir callback
* Emite evento al actualizar memoria
* Añade Budget Check antes de crear jobs
* Añade Failure Handler
* Separa workflows async en varias fases
* Añade timeout handling
* Añade correlationId para conectar request y callback
* Evita asumir que el estado no cambia entre request y callback
* Documenta qué precompile estás usando
* Añade eventos para Scheduler wake cycles

Cada recomendación debe incluir:

* Por qué importa
* Riesgo si no se corrige
* Dificultad
* Impacto
* Ejemplo de evento Solidity
* Patrón de código recomendado

## 6. BlackBox Integration Kit

Esta sección ayuda a builders a mejorar el análisis futuro.

Debe incluir un contrato opcional llamado BlackBoxLogger.sol que los builders pueden integrar en sus contratos.

La app debe generar código para eventos recomendados:

* AgentBooted
* RitualWalletChecked
* AsyncJobRequested
* AsyncJobCompleted
* CallbackReceived
* CallbackRejected
* MemoryUpdated
* SchedulerWake
* BudgetLow
* FailureDetected
* RecoveryAttempted
* WorkflowPaused
* WorkflowResumed

El usuario debe poder copiar:

* BlackBoxLogger.sol
* Interfaz IBlackBoxLogger.sol
* Ejemplo de integración en un contrato existente
* Eventos recomendados
* Ejemplo de callback seguro
* Ejemplo de workflow async con correlationId

Importante: BlackBoxLogger no debe ser obligatorio. La app debe poder analizar contratos públicos sin él, pero debe explicar que la calidad del análisis mejora mucho si el contrato emite eventos claros.

## 7. Evidence Vault

Esta página guarda análisis locales.

No usar backend obligatorio para MVP. Puede usar localStorage/IndexedDB.

Debe permitir:

* Guardar análisis
* Comparar dos análisis del mismo contrato
* Exportar reporte JSON
* Exportar reporte Markdown
* Copiar resumen para Discord/GitHub
* Marcar eventos importantes
* Añadir notas locales del builder

# Funcionalidad on-chain

La app debe leer información pública on-chain usando RPC de Ritual L1 testnet.

Debe intentar obtener:

* Bytecode del address
* Balance
* Transaction receipts si están disponibles
* Logs/events
* Block timestamps
* Reverted tx info cuando sea posible
* Contract interactions detectables
* Event topics
* Decoding con ABI si el usuario proporciona ABI
* Decoding parcial sin ABI usando topics conocidos

Si no hay indexer disponible, crear una capa de abstracción para que el sistema pueda funcionar con mocks durante MVP y luego conectar un indexer/explorer real.

La arquitectura debe estar preparada para tres modos:

1. Demo Mode
   Usa datos mock realistas para mostrar cómo funciona la app.

2. RPC Mode
   Lee información disponible desde RPC público.

3. Enhanced Mode
   Usa ABI/import/manual event definitions para decodificar mejor.

No usar APIs externas innecesarias. El núcleo debe depender de RPC/on-chain y datos ingresados por el usuario. Si se usa una API externa opcional, debe estar aislada y documentada.

# Smart contracts

Crear contratos Solidity conceptuales para la capa de integración Black Box.

Contratos requeridos:

* BlackBoxLogger.sol
* IBlackBoxLogger.sol
* BlackBoxRegistry.sol
* ExampleRitualAgent.sol
* ExampleCallbackWorkflow.sol

BlackBoxLogger.sol debe emitir eventos claros para que la app pueda reconstruir el historial del agente.

BlackBoxRegistry.sol debe permitir registrar contratos que adoptan BlackBox logging.

ExampleRitualAgent.sol debe mostrar cómo un agente podría emitir logs durante su ciclo de vida.

ExampleCallbackWorkflow.sol debe mostrar un patrón conceptual de async request y callback.

Los contratos deben incluir comentarios explicando dónde se integrarían primitivas reales de Ritual como:

* Scheduler
* RitualWallet
* Async jobs
* Callback delivery
* Precompile calls
* Memory updates

Seguridad:

* Validar ownership
* Validar callback sender en el ejemplo
* Usar correlationId para conectar request y callback
* Emitir eventos antes y después de acciones importantes
* No asumir que el estado no cambia entre request y callback
* Incluir advertencia sobre riesgos TOCTOU
* Mantener todo como testnet/MVP
* No manejar fondos reales de mainnet

# Frontend stack

Usar un stack moderno:

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion
* Wagmi/Viem o ethers para Web3
* Zustand o similar para estado
* React Flow o una alternativa para Signal Map si conviene
* Monaco Editor o un visor de código para contratos/logs
* LocalStorage/IndexedDB para guardar análisis
* Componentes propios bien diseñados

La app debe ser responsive, pero priorizar desktop porque es una herramienta avanzada para builders.

# UI/UX obligatorio

Debe tener:

* Navegación lateral o radial, no navbar genérico
* Command palette
* Inspector panel
* Search dentro del timeline
* Expand/collapse de detalles técnicos
* Copy buttons
* Import ABI
* Export report
* Demo data button
* Address validation
* Network indicator
* Risk score visual
* Confidence labels
* Empty states hermosos
* Error states útiles
* Loading states cinematográficos
* Tooltips educativos
* Explicaciones simples para conceptos Ritual

La app debe enseñar mientras el usuario la usa. No crear una documentación larga separada. Cada evento, riesgo y recomendación debe explicar el concepto en contexto.

# Tipos de análisis

La app debe generar un informe con secciones:

* Contract Identity
* Activity Timeline
* Detected Patterns
* Ritual-related Signals
* Callback Analysis
* Failure Analysis
* Risk Score
* Missing Evidence
* Recommendations
* Integration Suggestions
* Exportable Summary

Risk Score debe ser visual y explicado. No debe fingir precisión absoluta. Debe decir si el score se basa en evidencia fuerte, parcial o insuficiente.

Ejemplo de labels:

* Verified Signal
* Decoded Event
* Inferred Pattern
* Missing Evidence
* Unknown Behavior
* Potential Risk
* Critical Finding

# Diseño de datos

Crear tipos TypeScript claros para:

* ContractAnalysis
* TimelineEvent
* SignalNode
* SignalEdge
* FailureFinding
* Recommendation
* RiskScore
* EvidenceItem
* DecodedLog
* UnknownLog
* BlackBoxEvent
* AnalysisMode
* ConfidenceLevel

Crear datos demo realistas para mostrar:

* Un agente que funciona bien
* Un agente con callback fallido
* Un workflow con falta de fondos
* Un contrato sin suficientes eventos
* Un flujo con posible TOCTOU
* Un agente con Scheduler activo

# Modo Demo

El modo demo es importante para que la app se vea completa aunque no haya datos reales suficientes.

Debe incluir un contrato demo llamado “Sigil Agent Alpha” o similar, con una historia visual:

* Deployed
* Funded
* Scheduler wake
* Async job requested
* Callback received
* Memory updated
* Second wake
* Budget low
* Async job timeout
* Failure detected
* Recovery suggested

Este demo debe alimentar Analyze Chamber, Flight Recorder, Failure Autopsy, Signal Map y Fix Console.

# README

Crear un README único, no genérico.

El README debe explicar la app como:

“Ritual Black Box is a forensic flight recorder for Ritual-native agents and async workflows.”

Aunque el proyecto esté en español, el README puede estar en inglés si el ecosistema Ritual lo requiere. Debe tener una estructura original, no la típica estructura aburrida.

Secciones sugeridas:

* What is inside the Black Box?
* Why Ritual agents need flight recorders
* How the forensic engine works
* What the app can know
* What the app cannot know
* BlackBoxLogger integration
* Ritual concepts used
* Demo mode
* Future real Ritual integrations
* Safety and testnet notes

# Entregables

El resultado debe incluir:

* Proyecto frontend completo
* Smart contracts
* Componentes UI completos
* Animaciones avanzadas
* Datos demo
* Motor de análisis mock
* Capa RPC preparada
* ABI importer
* Timeline engine
* Failure analysis engine
* Signal Map
* Fix Console
* BlackBoxLogger integration kit
* Export JSON/Markdown
* README único
* Setup instructions
* Código limpio y organizado

# Reglas importantes

No construir una app básica.
No crear una landing genérica.
No usar cards repetidas de dashboard normal.
No hacer un juego.
No hacer un quiz.
No hacer un PFP generator.
No hacer un mint page.
No hacer un casino.
No hacer un prediction app.
No hacer un faucet.
No hacer un chatbot simple.
No copiar estructuras comunes de otros proyectos Ritual.

La app debe sentirse como una herramienta nueva, seria, útil y visualmente impresionante.

La experiencia final debe ser:

El builder entra, conecta wallet, pega la dirección de su contrato/agente en Ritual, pulsa Analyze, la Black Box se abre, la app reconstruye la historia pública del agente, muestra timeline, mapa de señales, fallos, riesgos y recomendaciones claras.

Debe quedar claro que Ritual Black Box no adivina magia: analiza evidencia pública on-chain y mejora mucho cuando los contratos emiten eventos claros usando BlackBoxLogger.sol.

El resultado final debe parecer una herramienta premium de auditoría y diagnóstico para el ecosistema Ritual L1.