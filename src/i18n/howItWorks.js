import { useLanguage } from "@/i18n/LanguageContext";

// Copy for the "How it Works" page, kept out of the section components so each
// section stays small and both languages stay side by side.
export const howItWorksEn = {
  hero: {
    titleLead: "How Swap4Work",
    titleHighlight: "Works",
    subtitle: "Exchange things you no longer need for services from people nearby.",
    browse: "Browse Items",
    post: "Post an Item",
    storyLead: "Follow one exchange through this page:",
    story:
      "Sarah lists her used bicycle. Alex offers 3 hours of yard work. They negotiate, create an agreement, complete the work — and swap.",
    chain: [
      { label: "Item", sub: "Something you no longer need" },
      { label: "Negotiation", sub: "Discuss the terms" },
      { label: "Agreement", sub: "Both sides confirm" },
      { label: "Service", sub: "The work gets done" },
      { label: "Exchange", sub: "The item changes hands" },
      { label: "Review", sub: "Both leave a review" },
    ],
  },
  steps: {
    heading: "The Basic Process",
    sub: "From posting to completed exchange — six steps.",
    stepLabel: "Step {n}",
    items: [
      {
        title: "Post an Item",
        text: "List an item you no longer need and describe the type of service you'd like in exchange.",
        bullets: [
          "A clear, specific title",
          "Good, well-lit photos of the actual item",
          "An honest description with any defects",
          "The item's condition and approximate value",
          "The type of service you're looking for",
          "Your general area — exact home addresses are never shown publicly",
        ],
        ctaLabel: "Post an Item",
      },
      {
        title: "Browse & Discover",
        text: "Search available items and use filters to find opportunities that interest you.",
        bullets: [
          "Filter by category",
          "Filter by distance from your area",
          "Sort by newest additions",
          "Find items where a service you can offer is wanted",
          "Review the listing carefully before starting a negotiation",
          "Only approximate areas are shown — exact locations stay private",
        ],
        ctaLabel: "Browse Items",
      },
      {
        title: "Start a Negotiation",
        text: "Interested in an item? Propose the service you can provide in exchange.",
        bullets: [
          "The service you're offering",
          "An estimate of the hours involved",
          "Timing and scheduling",
          "Details of the work",
          "Counteroffers and questions through messaging",
          "Starting a negotiation is not a commitment — both sides must agree before anything is locked in",
        ],
      },
      {
        title: "Create an Agreement",
        text: "Once you both agree on the terms, the negotiation becomes an official Agreement that records the details of the exchange.",
        example: [
          ["ITEM", "Used bicycle"],
          ["SERVICE", "3 hours of yard work"],
          ["SCHEDULE", "Saturday morning"],
        ],
        note: "This is exactly what Sarah and Alex agreed on. Review the Agreement carefully before accepting — make sure the item, the work, the hours, and the timing all match what you discussed.",
      },
      {
        title: "Complete the Service & Exchange",
        text: "Follow through on the agreed terms, then close things out.",
        bullets: [
          "Complete the agreed service",
          "Log and confirm the work on the Work Progress page",
          "Exchange the item — both parties confirm the handover",
          "Mark the agreement complete",
          "Communicate through Swap4Work whenever possible",
        ],
        ctaLabel: "Start Browsing",
      },
      {
        title: "Leave a Review",
        text: "After a completed exchange, both users can review each other.",
        bullets: [
          "Rate each other 1–5 stars",
          "Write a short review of how the exchange went",
          "Reviews appear on public profiles",
          "Completed trades and hours build each member's reputation",
        ],
      },
    ],
  },
  examples: {
    heading: "What Can I Trade?",
    sub: "Swap4Work isn't limited to one category. Almost any physical item can be exchanged for a useful service — here are just a few ideas.",
    items: [
      { item: "Bicycle", service: "Yard work" },
      { item: "Furniture", service: "Moving help" },
      { item: "Electronics", service: "Computer help" },
      { item: "Tools", service: "Home improvement" },
      { item: "Camping equipment", service: "Car cleaning" },
      { item: "Baby items", service: "Babysitting / childcare" },
      { item: "Unused appliances", service: "Handyman help" },
      { item: "Sports equipment", service: "Coaching / training" },
      { item: "Books", service: "Tutoring" },
      { item: "Musical instrument", service: "Music lessons" },
    ],
    legalLead: "Every exchange must comply with Swap4Work's",
    termsLink: "Terms of Service",
    legalTail:
      "and applicable laws. Illegal, unsafe, or prohibited services are not allowed.",
  },
  tips: {
    heading: "How to Get Better Offers",
    sub: "A few habits that consistently lead to useful offers and smooth exchanges.",
    items: [
      {
        title: "Use clear photos",
        text: "Well-lit photos of the actual item — from a few angles if it helps.",
      },
      {
        title: "Write an honest description",
        text: "Say what it is, its age, and anything someone should know before offering their time.",
      },
      {
        title: "Be clear about condition",
        text: "Use the condition field and mention any defects or damage up front.",
      },
      {
        title: "Describe the service you want",
        text: "The more specific you are about the help you're looking for, the better the offers.",
      },
      {
        title: "Be realistic about the work",
        text: "Consider the item's approximate value and ask for a fair amount of work in return.",
      },
      {
        title: "Include timing info",
        text: "Mention your availability and when you'd like the work to happen.",
      },
      {
        title: "Respond promptly",
        text: "Answer negotiations and questions quickly and respectfully — it builds trust.",
      },
    ],
    highlightLabel: "Highlighted tip",
    highlight:
      "“The clearer your listing is, the more useful the offers you're likely to receive.”",
  },
  negotiation: {
    heading: "Understanding Negotiations",
    sub: "Negotiation is the heart of Swap4Work. It's a conversation with structured offers — nothing is final until you both agree.",
    basics: [
      {
        title: "Start a Negotiation",
        text: "One person expresses interest in an item and proposes a service — with the type of work, an hour estimate, a message, and timing.",
      },
      {
        title: "Counteroffer",
        text: "The other person can accept, decline, or propose different terms. Offers and counteroffers go back and forth until you either agree or part ways.",
      },
      {
        title: "Multiple Negotiators",
        text: "An item can have up to 3 active negotiations at a time — Sarah's bicycle could have one negotiation from Alex and two from other members at once. If the limit is reached, new interested users can join a waitlist and are notified when a spot opens.",
      },
    ],
    offerMade: "Offer made",
    accept: "Accept",
    counter: "Counteroffer",
    decline: "Decline",
    flowNote:
      "Both parties must agree before a trade moves forward — a negotiation is never a commitment on its own.",
    outcomesHeading: "What happens when…",
    outcomes: [
      {
        title: "An offer is accepted",
        text: "The negotiation moves to the Agreement step, and all other negotiations for that item are automatically closed (those users are notified).",
      },
      {
        title: "An offer is declined",
        text: "The negotiation ends — no Agreement is created. Waitlisted users are notified that a spot opened.",
      },
      {
        title: "A counteroffer is made",
        text: "The new offer (hours, type of work, and an optional message) is sent to the other person, and the negotiation continues.",
      },
      {
        title: "The negotiation goes quiet",
        text: "Negotiations automatically expire after 48 hours of inactivity, so stale offers don't linger.",
      },
      {
        title: "The item goes to someone else",
        text: "If the item owner accepts a different offer, your negotiation is closed and you're notified right away.",
      },
      {
        title: "You're on the waitlist",
        text: "You'll get a notification as soon as a negotiation closes or is declined — then it's first come, first served for the open spot.",
      },
    ],
  },
  agreements: {
    heading: "Agreements",
    sub: "When the conversation turns into a commitment, it becomes an official Agreement.",
    negotiationTitle: "Negotiation",
    negotiationSub: "Discussing possible terms.",
    negotiationBullets: [
      "Explore offers and counteroffers",
      "Ask questions and work out details",
      "Nothing is locked in — either side can walk away",
    ],
    agreementTitle: "Agreement",
    agreementSub:
      "Both parties have accepted the terms and are moving forward with the exchange.",
    agreementBullets: [
      "Records the item, the service, and the agreed hours",
      "The item is reserved for this exchange",
      "Work progress is tracked against it",
    ],
    exampleTitle: "An example Agreement",
    exampleSub:
      "What Sarah and Alex confirmed after negotiating on the bicycle listing:",
    exampleRows: [
      ["ITEM", "Used Bicycle"],
      ["SERVICE", "Yard work"],
      ["TIME", "3 hours"],
      ["WHEN", "Saturday morning"],
    ],
    statusLabel: "STATUS:",
    statusValue: "Accepted",
    checklistTitle: "Before you accept, confirm you both agree on:",
    checklist: [
      "Exactly which item is being exchanged",
      "Exactly what service will be provided",
      "The expected amount of work or time",
      "When the work will happen",
      "Any important conditions or special requests",
      "Handover details — where and how the item changes hands",
    ],
    checklistNote:
      "Make sure everything important is clearly understood before accepting — it's much easier to clarify now than to resolve a misunderstanding later.",
  },
  tracking: {
    heading: "Tracking the Work",
    sub: "Every agreement has a Work Progress page where both sides can see exactly where the exchange stands. In Sarah and Alex's exchange: Alex logs his 3 hours on Saturday morning, marks the work complete, and then they confirm the handover of the bicycle.",
    timeline: [
      {
        label: "Agreement Accepted",
        text: "Both parties confirmed and the agreement is locked",
      },
      { label: "Work Scheduled", text: "You agree on when the work happens" },
      {
        label: "Work Started",
        text: "The timer runs and hours are logged against the agreement",
      },
      {
        label: "Work Completed",
        text: "The worker marks the work complete and the item owner is notified",
      },
      { label: "Item Exchanged", text: "Both parties confirm the handover" },
      {
        label: "Agreement Completed",
        text: "The exchange is done — time to leave reviews",
      },
    ],
    tools: [
      {
        title: "Work timer",
        text: "Start a shared timer while you work — stopping it turns the elapsed time into a log entry. Both parties see the same timer.",
      },
      {
        title: "Time logs",
        text: "Log hours manually with a date and description (up to 12 hours per day). A progress bar shows logged hours against the agreed total.",
      },
      {
        title: "Milestones",
        text: "An agreement can include up to 5 milestones with their own hours and due dates, so bigger jobs stay on track.",
      },
    ],
  },
  reviews: {
    heading: "Reviews & Karma",
    sub: "After a completed exchange, both users can review each other with 1–5 stars and a written review.",
    signals: [
      { title: "Reliability", text: "Did the person show up and follow through?" },
      {
        title: "Communication",
        text: "Were they responsive, clear, and easy to work with?",
      },
      { title: "Quality", text: "Was the work — and the item — as promised?" },
      {
        title: "Follow-through",
        text: "Was the exchange completed as agreed?",
      },
    ],
    whereTitle: "Where reviews appear",
    whereText:
      "Reviews show on a member's public profile alongside their star average, completed trades, and total hours worked — so future partners can see a track record before starting a negotiation.",
    karmaTitle: "Karma",
    karmaText:
      "Karma is a trust score that grows with completed agreements and positive reviews — and can drop for mid-agreement cancellations and violations found in disputes.",
    karmaQuote: "“Every successful exchange helps build your reputation.”",
  },
  location: {
    heading: "Location & Privacy",
    sub: "Nearby is the whole point — but your privacy comes first.",
    points: [
      {
        title: "Location connects you — but stays vague",
        text: "Swap4Work uses your general area to help you find items and people nearby. Other members only ever see your approximate area (like your city and state) — never your street address.",
      },
      {
        title: "A 50-mile range keeps it local",
        text: "To start a negotiation on an item, you need to be within 50 miles of it — Swap4Work verifies this when you make your first offer. You can also filter browse results by distance.",
      },
      {
        title: "Share details only when appropriate",
        text: "Keep your exact home address out of your listing. Share specific meeting or work details privately with the other party only once you're comfortable.",
      },
      {
        title: "Meet smart",
        text: "Use public or otherwise appropriate meeting locations for item exchanges when possible, and use good judgment when meeting someone for the first time.",
      },
    ],
  },
  trust: {
    badge: "Trust & Safety",
    heading: "Stay Safe on Swap4Work",
    sub: "A few habits keep exchanges smooth and safe for everyone.",
    beforeTitle: "Before agreeing",
    before: [
      "Review the other user's profile",
      "Look at their reviews and history",
      "Ask questions before committing",
      "Clearly define the work involved",
      "Make sure the exchange makes sense to both of you",
    ],
    duringTitle: "During the exchange",
    during: [
      "Communicate clearly and often",
      "Follow the agreed terms",
      "Meet in an appropriate location",
      "Don't share unnecessary personal information",
    ],
    wrongTitle: "If something goes wrong",
    wrong: [
      {
        title: "Report a user",
        text: 'Open the "More Options" menu on their profile and choose Report User. You can also report an item listing directly from its page, or report a conversation from inside a negotiation.',
      },
      {
        title: "Block a user",
        text: "Blocking is available from any profile or negotiation. Blocked users disappear from your browse results and can't negotiate with you — and you can unblock them anytime from your Profile settings.",
      },
      {
        title: "Open a dispute",
        text: "For problems inside an active agreement (like a no-show or stopped work), open a formal dispute from the agreement. Reports, disputes, and blocks are all reviewed by the moderation team.",
      },
    ],
    legalLead: "Read our",
    legalTerms: "Terms of Service",
    legalSafety: "Safety Guidelines",
    legalRules: "Community Rules",
    legalPrivacy: "Privacy Policy",
    legalConj: "and",
  },
  faq: {
    heading: "Common Questions",
    sub: "Everything new members usually ask.",
    items: [
      {
        q: "What exactly is Swap4Work?",
        a: "Swap4Work is a local marketplace where people exchange physical items for services and time. Instead of a monetary payment, the item owner receives an agreed amount of work from someone nearby — and the worker receives the item.",
      },
      {
        q: "Is money exchanged?",
        a: "The exchange itself is based on items and services, not a payment between members. Listings can show an optional estimated value to help you gauge a fair amount of work, but Swap4Work never processes payments between members. Costs like transportation or materials are between you and the other party to discuss.",
      },
      {
        q: "What can I offer in exchange for an item?",
        a: "A service you can genuinely provide — yard work, moving help, tutoring, repairs, coaching, and so on. You propose the service and the number of hours in your offer. All services must comply with our Terms of Service and applicable laws.",
      },
      {
        q: "What can I list?",
        a: "Any item you own and can hand over locally: electronics, furniture, tools, sports gear, and more. You can also list a service you offer on the Browse Services page. Everything must be accurately described and comply with our Terms of Service.",
      },
      {
        q: "How do I start a negotiation?",
        a: 'Open an item\'s page and choose "Start Negotiation". You\'ll need an account with a completed profile, and you must be within 50 miles of the item — Swap4Work verifies this when you make your first offer. You then propose the service you can offer and the hours.',
      },
      {
        q: "Can I make a counteroffer?",
        a: 'Yes. Inside any active negotiation, use the "Counter Offer" button to propose new hours, a different type of work, and an optional message. Offers go back and forth until you either agree or one side declines.',
      },
      {
        q: "What happens if we can't agree?",
        a: "That's fine — either side can politely decline and the negotiation simply ends. No agreement is created, and the item stays available. Negotiations also expire automatically after 48 hours of inactivity.",
      },
      {
        q: "What happens after someone accepts my offer?",
        a: "An Agreement draft appears right inside the negotiation. Each person confirms it, and once both have confirmed, the agreement locks, the item is reserved, and you both move to the Work Progress page to schedule and log the work.",
      },
      {
        q: "What is an Agreement?",
        a: "An Agreement is the confirmed plan for the exchange. While a negotiation is the discussion phase, an Agreement means both sides have accepted the terms — the item, the service, the hours, and the timing — and are moving forward.",
      },
      {
        q: "Can multiple people negotiate for the same item?",
        a: "Yes — an item can have up to 3 active negotiations at once. If the limit is reached, you can join the item's waitlist, and you'll be notified as soon as a spot opens (when a negotiation is declined, closed, or expires).",
      },
      {
        q: "What happens if an item is no longer available?",
        a: "When both people confirm an Agreement, the item is reserved and locked. Other negotiations on it are closed automatically and those users are notified. If the agreement is later cancelled, waitlisted users are notified that the item may become available again.",
      },
      {
        q: "How is service time tracked?",
        a: "Every agreement has a Work Progress page. Either party can run a shared work timer, and the worker logs hours manually (up to 12 hours per day) with a date and description. A progress bar tracks logged hours against the agreed total, and agreements can include up to 5 milestones with their own hours and due dates.",
      },
      {
        q: "Can I cancel an agreement?",
        a: "Before work starts, either party can cancel from the negotiation. Once an agreement is locked, cancellation needs the other party's consent — you send a mutual cancellation request with a reason, and cancelling mid-agreement without mutual consent can affect your karma. If there's a genuine disagreement, you can open a formal dispute instead.",
      },
      {
        q: "What happens if the other person doesn't complete the agreed work?",
        a: 'Start by communicating through the negotiation — misunderstandings are usually fixable. If not, you can open a formal dispute from the agreement (for example, "worker stopped working" or "no show"), which the moderation team reviews. You can also report the user directly. Cancellations and upheld disputes affect a member\'s karma.',
      },
      {
        q: "How do reviews work?",
        a: "After a completed exchange, both users can leave each other a 1–5 star rating and a written review. Reviews appear on public profiles alongside completed trades and hours worked, so the community can see a real track record.",
      },
      {
        q: "How does location work?",
        a: "Swap4Work is built for local exchanges. Distances are shown in miles, you can filter browse results by distance, and you need to be within 50 miles of an item to start negotiating for it.",
      },
      {
        q: "Is my exact address visible?",
        a: "No. Listings and profiles show only your approximate area (city and state) — street addresses and ZIP codes are never displayed. Share specific meeting details privately with the other party only once you're comfortable.",
      },
      {
        q: "How do I report someone?",
        a: 'Use the "More Options" menu on their profile to report the user, the "Report this listing" button on an item page, or the report option inside a negotiation to report a conversation. Reports are reviewed by the moderation team.',
      },
      {
        q: "Can I block someone?",
        a: "Yes. You can block a user from their profile or from inside a negotiation. Blocked users disappear from your browse results and can't negotiate or message you, and you can unblock them anytime from your Profile settings.",
      },
      {
        q: "What areas does Swap4Work support?",
        a: "Swap4Work works anywhere a local community forms — you need to be within 50 miles of an item to negotiate for it. The community is young, so listings may be sparse in your area at first; posting your own item is the best way to get things started.",
      },
      {
        q: "How do I get started?",
        a: "Create an account, browse items or post something you no longer need, and start a conversation.",
      },
    ],
  },
  finalCta: {
    title: "Ready to make your first Swap?",
    sub: "Find something useful. Offer something you're good at. Make an exchange.",
    browse: "Browse Items",
    post: "Post an Item",
  },
};

export const howItWorksEs = {
  hero: {
    titleLead: "Así funciona",
    titleHighlight: "Swap4Work",
    subtitle:
      "Intercambia cosas que ya no necesitas por servicios de personas cercanas.",
    browse: "Explorar artículos",
    post: "Publicar un artículo",
    storyLead: "Sigue un intercambio de principio a fin en esta página:",
    story:
      "Sarah publica su bicicleta usada. Alex ofrece 3 horas de trabajo en el jardín. Negocian, crean un acuerdo, completan el trabajo y hacen el intercambio.",
    chain: [
      { label: "Artículo", sub: "Algo que ya no necesitas" },
      { label: "Negociación", sub: "Se hablan las condiciones" },
      { label: "Acuerdo", sub: "Ambas partes confirman" },
      { label: "Servicio", sub: "El trabajo se realiza" },
      { label: "Intercambio", sub: "El artículo cambia de manos" },
      { label: "Reseña", sub: "Ambos dejan una reseña" },
    ],
  },
  steps: {
    heading: "El proceso básico",
    sub: "Desde publicar hasta completar el intercambio: seis pasos.",
    stepLabel: "Paso {n}",
    items: [
      {
        title: "Publica un artículo",
        text: "Publica un artículo que ya no necesitas y describe el tipo de servicio que te gustaría recibir a cambio.",
        bullets: [
          "Un título claro y específico",
          "Buenas fotos del artículo real, con buena luz",
          "Una descripción honesta con cualquier defecto",
          "El estado del artículo y su valor aproximado",
          "El tipo de servicio que buscas",
          "Tu zona general: las direcciones exactas nunca se muestran públicamente",
        ],
        ctaLabel: "Publicar un artículo",
      },
      {
        title: "Explora y descubre",
        text: "Busca artículos disponibles y usa los filtros para encontrar oportunidades que te interesen.",
        bullets: [
          "Filtrar por categoría",
          "Filtrar por distancia desde tu zona",
          "Ordenar por los más recientes",
          "Encontrar artículos donde se busque un servicio que puedas ofrecer",
          "Revisar bien la publicación antes de iniciar una negociación",
          "Solo se muestran zonas aproximadas: las ubicaciones exactas siguen siendo privadas",
        ],
        ctaLabel: "Explorar artículos",
      },
      {
        title: "Inicia una negociación",
        text: "¿Te interesa un artículo? Propón el servicio que puedes ofrecer a cambio.",
        bullets: [
          "El servicio que ofreces",
          "Una estimación de las horas necesarias",
          "Fechas y horarios",
          "Detalles del trabajo",
          "Contraofertas y preguntas por mensajería",
          "Iniciar una negociación no es un compromiso: ambas partes deben aceptar antes de que algo quede cerrado",
        ],
      },
      {
        title: "Crea un acuerdo",
        text: "Cuando ambas partes acuerdan las condiciones, la negociación se convierte en un Acuerdo oficial que registra los detalles del intercambio.",
        example: [
          ["ARTÍCULO", "Bicicleta usada"],
          ["SERVICIO", "3 horas de trabajo en el jardín"],
          ["HORARIO", "Sábado por la mañana"],
        ],
        note: "Esto es exactamente lo que acordaron Sarah y Alex. Revisa el Acuerdo con atención antes de aceptar: asegúrate de que el artículo, el trabajo, las horas y los horarios coincidan con lo que hablaron.",
      },
      {
        title: "Completa el servicio y el intercambio",
        text: "Cumple las condiciones acordadas y luego cierra el proceso.",
        bullets: [
          "Completa el servicio acordado",
          "Registra y confirma el trabajo en la página de Progreso del trabajo",
          "Haz el intercambio del artículo: ambas partes confirman la entrega",
          "Marca el acuerdo como completado",
          "Comunícate por Swap4Work siempre que sea posible",
        ],
        ctaLabel: "Empezar a explorar",
      },
      {
        title: "Deja una reseña",
        text: "Después de completar un intercambio, ambas personas pueden valorarse.",
        bullets: [
          "Valorarse mutuamente de 1 a 5 estrellas",
          "Escribir una reseña breve de cómo fue el intercambio",
          "Las reseñas aparecen en los perfiles públicos",
          "Los intercambios completados y las horas suman a la reputación de cada miembro",
        ],
      },
    ],
  },
  examples: {
    heading: "¿Qué puedo intercambiar?",
    sub: "Swap4Work no se limita a una sola categoría. Casi cualquier artículo físico se puede intercambiar por un servicio útil: aquí tienes algunas ideas.",
    items: [
      { item: "Bicicleta", service: "Trabajo en el jardín" },
      { item: "Muebles", service: "Ayuda con la mudanza" },
      { item: "Electrónica", service: "Ayuda con la computadora" },
      { item: "Herramientas", service: "Mejoras del hogar" },
      { item: "Equipo de campamento", service: "Limpieza del auto" },
      { item: "Artículos de bebé", service: "Cuidado de niños" },
      { item: "Electrodomésticos sin uso", service: "Ayuda de manitas" },
      { item: "Equipo deportivo", service: "Entrenamiento" },
      { item: "Libros", service: "Clases particulares" },
      { item: "Instrumento musical", service: "Clases de música" },
    ],
    legalLead: "Todo intercambio debe cumplir los",
    termsLink: "Términos de servicio",
    legalTail:
      "de Swap4Work y las leyes aplicables. No se permiten servicios ilegales, inseguros o prohibidos.",
  },
  tips: {
    heading: "Cómo recibir mejores ofertas",
    sub: "Algunos hábitos que suelen dar lugar a ofertas útiles e intercambios fluidos.",
    items: [
      {
        title: "Usa fotos claras",
        text: "Fotos del artículo real con buena luz, y desde varios ángulos si ayuda.",
      },
      {
        title: "Escribe una descripción honesta",
        text: "Di qué es, cuánto tiempo tiene y cualquier cosa que alguien deba saber antes de ofrecer su tiempo.",
      },
      {
        title: "Sé claro sobre el estado",
        text: "Usa el campo de estado y menciona por adelantado cualquier defecto o daño.",
      },
      {
        title: "Describe el servicio que quieres",
        text: "Cuanto más específico seas sobre la ayuda que buscas, mejores serán las ofertas.",
      },
      {
        title: "Sé realista con el trabajo",
        text: "Considera el valor aproximado del artículo y pide una cantidad justa de trabajo a cambio.",
      },
      {
        title: "Incluye información de horarios",
        text: "Menciona tu disponibilidad y cuándo te gustaría que se hiciera el trabajo.",
      },
      {
        title: "Responde rápido",
        text: "Contesta negociaciones y preguntas con rapidez y respeto: genera confianza.",
      },
    ],
    highlightLabel: "Consejo destacado",
    highlight:
      "«Cuanto más clara sea tu publicación, más útiles serán las ofertas que recibas».",
  },
  negotiation: {
    heading: "Entender las negociaciones",
    sub: "La negociación es el corazón de Swap4Work. Es una conversación con ofertas estructuradas: nada es definitivo hasta que ambas partes aceptan.",
    basics: [
      {
        title: "Inicia una negociación",
        text: "Una persona muestra interés en un artículo y propone un servicio, con el tipo de trabajo, una estimación de horas, un mensaje y los horarios.",
      },
      {
        title: "Contraoferta",
        text: "La otra persona puede aceptar, rechazar o proponer otras condiciones. Las ofertas y contraofertas van y vienen hasta que llegan a un acuerdo o cada uno sigue su camino.",
      },
      {
        title: "Varias personas negociando",
        text: "Un artículo puede tener hasta 3 negociaciones activas a la vez: la bicicleta de Sarah podría tener una negociación de Alex y dos de otros miembros al mismo tiempo. Si se alcanza el límite, las nuevas personas interesadas pueden apuntarse a una lista de espera y reciben un aviso cuando se libera un lugar.",
      },
    ],
    offerMade: "Oferta enviada",
    accept: "Aceptar",
    counter: "Contraoferta",
    decline: "Rechazar",
    flowNote:
      "Ambas partes deben aceptar antes de que un intercambio avance: una negociación nunca es un compromiso por sí sola.",
    outcomesHeading: "Qué pasa cuando…",
    outcomes: [
      {
        title: "Se acepta una oferta",
        text: "La negociación pasa al paso de Acuerdo y todas las demás negociaciones de ese artículo se cierran automáticamente (se avisa a esas personas).",
      },
      {
        title: "Se rechaza una oferta",
        text: "La negociación termina y no se crea ningún Acuerdo. Las personas en lista de espera reciben un aviso de que se liberó un lugar.",
      },
      {
        title: "Se hace una contraoferta",
        text: "La nueva oferta (horas, tipo de trabajo y un mensaje opcional) se envía a la otra persona y la negociación continúa.",
      },
      {
        title: "La negociación se queda en silencio",
        text: "Las negociaciones caducan automáticamente tras 48 horas de inactividad, para que las ofertas antiguas no queden abiertas.",
      },
      {
        title: "El artículo se lo queda otra persona",
        text: "Si la persona dueña del artículo acepta otra oferta, tu negociación se cierra y recibes un aviso de inmediato.",
      },
      {
        title: "Estás en la lista de espera",
        text: "Recibirás un aviso en cuanto se cierre o se rechace una negociación; luego el lugar libre es para quien llegue primero.",
      },
    ],
  },
  agreements: {
    heading: "Acuerdos",
    sub: "Cuando la conversación se convierte en compromiso, pasa a ser un Acuerdo oficial.",
    negotiationTitle: "Negociación",
    negotiationSub: "Hablando posibles condiciones.",
    negotiationBullets: [
      "Explorar ofertas y contraofertas",
      "Hacer preguntas y definir detalles",
      "Nada queda cerrado: cualquiera de las dos partes puede retirarse",
    ],
    agreementTitle: "Acuerdo",
    agreementSub:
      "Ambas partes han aceptado las condiciones y siguen adelante con el intercambio.",
    agreementBullets: [
      "Registra el artículo, el servicio y las horas acordadas",
      "El artículo queda reservado para este intercambio",
      "El progreso del trabajo se sigue a partir de él",
    ],
    exampleTitle: "Un acuerdo de ejemplo",
    exampleSub:
      "Lo que Sarah y Alex confirmaron tras negociar la publicación de la bicicleta:",
    exampleRows: [
      ["ARTÍCULO", "Bicicleta usada"],
      ["SERVICIO", "Trabajo en el jardín"],
      ["TIEMPO", "3 horas"],
      ["CUÁNDO", "Sábado por la mañana"],
    ],
    statusLabel: "ESTADO:",
    statusValue: "Aceptado",
    checklistTitle: "Antes de aceptar, confirma que ambos estáis de acuerdo en:",
    checklist: [
      "Exactamente qué artículo se intercambia",
      "Exactamente qué servicio se va a prestar",
      "La cantidad de trabajo o tiempo prevista",
      "Cuándo se hará el trabajo",
      "Cualquier condición importante o petición especial",
      "Los detalles de la entrega: dónde y cómo cambia de manos el artículo",
    ],
    checklistNote:
      "Asegúrate de que todo lo importante queda claro antes de aceptar: es mucho más fácil aclararlo ahora que resolver un malentendido después.",
  },
  tracking: {
    heading: "Seguimiento del trabajo",
    sub: "Cada acuerdo tiene una página de Progreso del trabajo donde ambas partes pueden ver exactamente en qué punto está el intercambio. En el intercambio de Sarah y Alex: Alex registra sus 3 horas el sábado por la mañana, marca el trabajo como completado y luego confirman la entrega de la bicicleta.",
    timeline: [
      {
        label: "Acuerdo aceptado",
        text: "Ambas partes confirmaron y el acuerdo queda bloqueado",
      },
      {
        label: "Trabajo programado",
        text: "Acordáis cuándo se hace el trabajo",
      },
      {
        label: "Trabajo iniciado",
        text: "El cronómetro avanza y las horas se registran en el acuerdo",
      },
      {
        label: "Trabajo completado",
        text: "La persona que trabaja marca el trabajo como completado y se avisa a la persona dueña del artículo",
      },
      {
        label: "Artículo intercambiado",
        text: "Ambas partes confirman la entrega",
      },
      {
        label: "Acuerdo completado",
        text: "El intercambio ha terminado: es momento de dejar reseñas",
      },
    ],
    tools: [
      {
        title: "Cronómetro de trabajo",
        text: "Inicia un cronómetro compartido mientras trabajas: al detenerlo, el tiempo transcurrido se convierte en un registro. Ambas partes ven el mismo cronómetro.",
      },
      {
        title: "Registros de tiempo",
        text: "Registra horas manualmente con fecha y descripción (hasta 12 horas al día). Una barra de progreso muestra las horas registradas frente al total acordado.",
      },
      {
        title: "Hitos",
        text: "Un acuerdo puede incluir hasta 5 hitos con sus propias horas y fechas límite, para que los trabajos grandes no se desvíen.",
      },
    ],
  },
  reviews: {
    heading: "Reseñas y karma",
    sub: "Tras completar un intercambio, ambas personas pueden valorarse con 1 a 5 estrellas y una reseña escrita.",
    signals: [
      {
        title: "Fiabilidad",
        text: "¿La persona apareció y cumplió lo acordado?",
      },
      {
        title: "Comunicación",
        text: "¿Fue receptiva, clara y fácil de tratar?",
      },
      {
        title: "Calidad",
        text: "¿El trabajo y el artículo fueron como se prometió?",
      },
      {
        title: "Cumplimiento",
        text: "¿Se completó el intercambio según lo acordado?",
      },
    ],
    whereTitle: "Dónde aparecen las reseñas",
    whereText:
      "Las reseñas aparecen en el perfil público de cada miembro junto a su promedio de estrellas, sus intercambios completados y el total de horas trabajadas, para que futuras contrapartes puedan ver su historial antes de iniciar una negociación.",
    karmaTitle: "Karma",
    karmaText:
      "El karma es una puntuación de confianza que crece con los acuerdos completados y las reseñas positivas, y puede bajar por cancelaciones a mitad de acuerdo e infracciones detectadas en disputas.",
    karmaQuote:
      "«Cada intercambio exitoso ayuda a construir tu reputación».",
  },
  location: {
    heading: "Ubicación y privacidad",
    sub: "Lo cercano es la clave, pero tu privacidad va primero.",
    points: [
      {
        title: "La ubicación te conecta, pero se mantiene general",
        text: "Swap4Work usa tu zona general para ayudarte a encontrar artículos y personas cercanas. Los demás miembros solo ven tu zona aproximada (como tu ciudad y estado), nunca tu dirección.",
      },
      {
        title: "Un radio de 50 millas lo mantiene local",
        text: "Para iniciar una negociación sobre un artículo debes estar a menos de 50 millas de él: Swap4Work lo verifica cuando haces tu primera oferta. También puedes filtrar los resultados de búsqueda por distancia.",
      },
      {
        title: "Comparte detalles solo cuando corresponda",
        text: "No incluyas tu dirección exacta en la publicación. Comparte detalles concretos de encuentro o del trabajo en privado con la otra persona solo cuando te sientas cómodo.",
      },
      {
        title: "Queda con cabeza",
        text: "Cuando sea posible, usa lugares públicos o adecuados para los intercambios de artículos, y usa tu criterio cuando quedes con alguien por primera vez.",
      },
    ],
  },
  trust: {
    badge: "Confianza y seguridad",
    heading: "Mantente seguro en Swap4Work",
    sub: "Algunos hábitos mantienen los intercambios fluidos y seguros para todos.",
    beforeTitle: "Antes de aceptar",
    before: [
      "Revisa el perfil de la otra persona",
      "Mira sus reseñas e historial",
      "Haz preguntas antes de comprometerte",
      "Define claramente el trabajo implicado",
      "Asegúrate de que el intercambio tiene sentido para ambos",
    ],
    duringTitle: "Durante el intercambio",
    during: [
      "Comunícate con claridad y con frecuencia",
      "Cumple las condiciones acordadas",
      "Quedad en un lugar adecuado",
      "No compartas información personal innecesaria",
    ],
    wrongTitle: "Si algo sale mal",
    wrong: [
      {
        title: "Reportar a una persona",
        text: "Abre el menú «Más opciones» de su perfil y elige Reportar usuario. También puedes reportar una publicación directamente desde su página o reportar una conversación desde dentro de una negociación.",
      },
      {
        title: "Bloquear a una persona",
        text: "Puedes bloquear desde cualquier perfil o negociación. Las personas bloqueadas desaparecen de tus resultados de búsqueda y no pueden negociar contigo, y puedes desbloquearlas cuando quieras desde tu perfil.",
      },
      {
        title: "Abrir una disputa",
        text: "Para problemas dentro de un acuerdo activo (como una ausencia o un trabajo detenido), abre una disputa formal desde el acuerdo. Los reportes, las disputas y los bloqueos los revisa el equipo de moderación.",
      },
    ],
    legalLead: "Lee nuestros",
    legalTerms: "Términos de servicio",
    legalSafety: "Consejos de seguridad",
    legalRules: "Normas de la comunidad",
    legalPrivacy: "Política de privacidad",
    legalConj: "y la",
  },
  faq: {
    heading: "Preguntas frecuentes",
    sub: "Todo lo que suelen preguntar los nuevos miembros.",
    items: [
      {
        q: "¿Qué es exactamente Swap4Work?",
        a: "Swap4Work es un mercado local donde las personas intercambian artículos físicos por servicios y tiempo. En lugar de un pago en dinero, la persona dueña del artículo recibe una cantidad acordada de trabajo de alguien cercano, y quien trabaja recibe el artículo.",
      },
      {
        q: "¿Se usa dinero?",
        a: "El intercambio se basa en artículos y servicios, no en un pago entre miembros. Las publicaciones pueden mostrar un valor estimado opcional para ayudarte a calcular una cantidad justa de trabajo, pero Swap4Work nunca procesa pagos entre miembros. Los costos como transporte o materiales son algo que debes hablar con la otra persona.",
      },
      {
        q: "¿Qué puedo ofrecer a cambio de un artículo?",
        a: "Un servicio que realmente puedas prestar: trabajo en el jardín, ayuda con mudanzas, clases particulares, reparaciones, entrenamiento, etc. Propones el servicio y el número de horas en tu oferta. Todos los servicios deben cumplir nuestros Términos de servicio y las leyes aplicables.",
      },
      {
        q: "¿Qué puedo publicar?",
        a: "Cualquier artículo que tengas y puedas entregar en tu zona: electrónica, muebles, herramientas, equipo deportivo y más. También puedes publicar un servicio que ofrezcas en la página Explorar servicios. Todo debe estar descrito con exactitud y cumplir nuestros Términos de servicio.",
      },
      {
        q: "¿Cómo inicio una negociación?",
        a: "Abre la página de un artículo y elige «Iniciar negociación». Necesitas una cuenta con el perfil completo y estar a menos de 50 millas del artículo: Swap4Work lo verifica cuando haces tu primera oferta. Después propones el servicio que puedes ofrecer y las horas.",
      },
      {
        q: "¿Puedo hacer una contraoferta?",
        a: "Sí. Dentro de cualquier negociación activa, usa el botón «Contraoferta» para proponer nuevas horas, otro tipo de trabajo y un mensaje opcional. Las ofertas van y vienen hasta que llegáis a un acuerdo o una de las partes rechaza.",
      },
      {
        q: "¿Qué pasa si no llegamos a un acuerdo?",
        a: "No pasa nada: cualquiera de las dos partes puede rechazar con cortesía y la negociación simplemente termina. No se crea ningún acuerdo y el artículo sigue disponible. Además, las negociaciones caducan automáticamente tras 48 horas de inactividad.",
      },
      {
        q: "¿Qué pasa cuando alguien acepta mi oferta?",
        a: "Aparece un borrador de Acuerdo dentro de la negociación. Cada persona lo confirma y, cuando ambos lo han confirmado, el acuerdo se bloquea, el artículo queda reservado y ambos pasan a la página de Progreso del trabajo para programar y registrar el trabajo.",
      },
      {
        q: "¿Qué es un Acuerdo?",
        a: "Un Acuerdo es el plan confirmado del intercambio. Mientras que la negociación es la fase de conversación, un Acuerdo significa que ambas partes han aceptado las condiciones (el artículo, el servicio, las horas y los horarios) y siguen adelante.",
      },
      {
        q: "¿Pueden varias personas negociar por el mismo artículo?",
        a: "Sí: un artículo puede tener hasta 3 negociaciones activas a la vez. Si se alcanza el límite, puedes apuntarte a la lista de espera del artículo y recibirás un aviso en cuanto se libere un lugar (cuando una negociación se rechaza, se cierra o caduca).",
      },
      {
        q: "¿Qué pasa si un artículo ya no está disponible?",
        a: "Cuando ambas personas confirman un Acuerdo, el artículo queda reservado y bloqueado. Las demás negociaciones sobre ese artículo se cierran automáticamente y se avisa a esas personas. Si el acuerdo se cancela después, se avisa a quienes están en lista de espera de que el artículo podría volver a estar disponible.",
      },
      {
        q: "¿Cómo se controla el tiempo de servicio?",
        a: "Cada acuerdo tiene una página de Progreso del trabajo. Cualquiera de las partes puede usar un cronómetro compartido, y quien trabaja registra las horas manualmente (hasta 12 horas al día) con fecha y descripción. Una barra de progreso muestra las horas registradas frente al total acordado, y los acuerdos pueden incluir hasta 5 hitos con sus propias horas y fechas límite.",
      },
      {
        q: "¿Puedo cancelar un acuerdo?",
        a: "Antes de que empiece el trabajo, cualquiera de las partes puede cancelar desde la negociación. Una vez que el acuerdo está bloqueado, la cancelación necesita el consentimiento de la otra persona: envías una solicitud de cancelación mutua con un motivo, y cancelar a mitad de acuerdo sin consentimiento mutuo puede afectar a tu karma. Si hay un desacuerdo real, puedes abrir una disputa formal.",
      },
      {
        q: "¿Qué pasa si la otra persona no completa el trabajo acordado?",
        a: "Empieza por hablar a través de la negociación: los malentendidos suelen tener solución. Si no, puedes abrir una disputa formal desde el acuerdo (por ejemplo, «la persona dejó de trabajar» o «no se presentó»), que revisa el equipo de moderación. También puedes reportar a la persona directamente. Las cancelaciones y las disputas con razón afectan al karma del miembro.",
      },
      {
        q: "¿Cómo funcionan las reseñas?",
        a: "Tras completar un intercambio, ambas personas pueden dejarse una valoración de 1 a 5 estrellas y una reseña escrita. Las reseñas aparecen en los perfiles públicos junto a los intercambios completados y las horas trabajadas, para que la comunidad vea un historial real.",
      },
      {
        q: "¿Cómo funciona la ubicación?",
        a: "Swap4Work está pensado para intercambios locales. Las distancias se muestran en millas, puedes filtrar los resultados por distancia y debes estar a menos de 50 millas de un artículo para empezar a negociar por él.",
      },
      {
        q: "¿Se ve mi dirección exacta?",
        a: "No. Las publicaciones y los perfiles solo muestran tu zona aproximada (ciudad y estado): las direcciones y los códigos postales nunca se muestran. Comparte detalles concretos de encuentro en privado con la otra persona solo cuando te sientas cómodo.",
      },
      {
        q: "¿Cómo reporto a alguien?",
        a: "Usa el menú «Más opciones» de su perfil para reportar a la persona, el botón «Reportar esta publicación» en la página de un artículo, o la opción de reportar dentro de una negociación para reportar una conversación. Los reportes los revisa el equipo de moderación.",
      },
      {
        q: "¿Puedo bloquear a alguien?",
        a: "Sí. Puedes bloquear a una persona desde su perfil o desde dentro de una negociación. Las personas bloqueadas desaparecen de tus resultados de búsqueda y no pueden negociar ni enviarte mensajes, y puedes desbloquearlas cuando quieras desde tu perfil.",
      },
      {
        q: "¿En qué zonas funciona Swap4Work?",
        a: "Swap4Work funciona allí donde se forme una comunidad local: debes estar a menos de 50 millas de un artículo para negociar por él. La comunidad es joven, así que al principio puede haber pocas publicaciones en tu zona; publicar tu propio artículo es la mejor forma de empezar.",
      },
      {
        q: "¿Cómo empiezo?",
        a: "Crea una cuenta, explora artículos o publica algo que ya no necesites y empieza una conversación.",
      },
    ],
  },
  finalCta: {
    title: "¿Listo para hacer tu primer intercambio?",
    sub: "Encuentra algo útil. Ofrece algo en lo que seas bueno. Haz un intercambio.",
    browse: "Explorar artículos",
    post: "Publicar un artículo",
  },
};

export function useHowItWorks() {
  const { lang } = useLanguage();
  return lang === "es" ? howItWorksEs : howItWorksEn;
}