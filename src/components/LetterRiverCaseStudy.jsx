import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ExternalLink,
  Brain,
  Languages,
  Accessibility,
  TrendingUp,
  Database,
  Zap,
  BookOpen,
  Award,
  Compass,
  Route,
  MessageCircle,
  Layers3,
  Map as MapIcon,
  Target,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function LetterRiverCaseStudy() {
  const { scrollYProgress } = useScroll();
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.14 } },
  };

  const evidenceCards = [
    {
      label: "Product scope",
      value: "Live responsive prototype",
      detail: "A deployed learning product, not a static concept deck.",
    },
    {
      label: "Core UX problem",
      value: "Reduce learner overload",
      detail: "Turn alphabet, transliteration, meaning, recall, and reading into a navigable path.",
    },
    {
      label: "System shape",
      value: "Multi-mode learning architecture",
      detail: "Home, Read, Bridge Builder, Deep Script, Daily, Achievements, and Settings.",
    },
    {
      label: "Build approach",
      value: "Prototype in production form",
      detail: "Built in code to test flow, state, mobile interaction, and progression.",
    },
  ];

  const processSteps = [
    {
      icon: <Brain className="h-8 w-8 text-purple-500 dark:text-purple-300" />,
      step: "01",
      title: "Listen",
      description:
        "I started from the real friction of adult language learning: uncertainty, inconsistency, and the feeling that beginner tools often ask you to process too much at once.",
    },
    {
      icon: <MapIcon className="h-8 w-8 text-blue-500 dark:text-blue-300" />,
      step: "02",
      title: "Map",
      description:
        "I separated the journey into layers: letters, vocabulary, review, reading, and motivation. That helped me design Letter River as a product system instead of a pile of exercises.",
    },
    {
      icon: <Zap className="h-8 w-8 text-amber-500 dark:text-amber-300" />,
      step: "03",
      title: "Prototype",
      description:
        "I built working flows in React so I could test interaction problems that static mockups would miss: tapping, scrolling, progress states, mode transitions, and mobile readability.",
    },
    {
      icon: <Sparkles className="h-8 w-8 text-teal-500 dark:text-teal-300" />,
      step: "04",
      title: "Ship & learn",
      description:
        "I deployed the prototype and continued refining onboarding, pack browsing, mobile layout, practice-mode variety, and the path from isolated words toward contextual reading.",
    },
  ];

  const journeySteps = [
    {
      icon: <BookOpen className="h-8 w-8 text-blue-500 dark:text-blue-300" />,
      title: "The Problem: Learning a New Alphabet",
      description:
        "While learning Hebrew, I found that existing tools often jumped into phrases before solidifying the alphabet and word-recognition layer. I needed a tool that helped learners build confidence through active practice, not passive study.",
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-500 dark:text-purple-300" />,
      title: "Making Cognitive Load Visible",
      description:
        "A beginner is not learning one thing. They are processing letters, sounds, transliteration, meaning, recall, reading direction, and motivation at the same time. The product needed to separate those layers into a clearer path.",
    },
    {
      icon: <Route className="h-8 w-8 text-emerald-500 dark:text-emerald-300" />,
      title: "Designing a Guided Vocabulary Path",
      description:
        "I moved away from a flat content library and organized vocabulary into themed sections, pack states, review prompts, and guided progression so the learner can understand where they are and what to do next.",
    },
    {
      icon: <Layers3 className="h-8 w-8 text-indigo-500 dark:text-indigo-300" />,
      title: "Reinforcing the Same Words in Different Ways",
      description:
        "Language learning requires repetition, but repeated screens become stale. Letter River reuses the same learning content across Bridge Builder, Loose Planks, and Deep Script so practice stays varied while the goal remains consistent.",
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-rose-500 dark:text-rose-300" />,
      title: "Moving from Words to Context",
      description:
        "As the product matured, I expanded beyond isolated word practice into reading comprehension so learners could begin connecting vocabulary to practical situations and short phrases.",
    },
    {
      icon: <Database className="h-8 w-8 text-teal-500 dark:text-teal-300" />,
      title: "Building the Product System in Code",
      description:
        "I built the prototype in React with routed views, context providers, persistent progress, localization, practice modes, and PWA-oriented architecture so the core UX could be tested as a real product.",
    },
  ];

  const learningStack = [
    "Hebrew letters",
    "Sound patterns",
    "Transliteration",
    "Word meaning",
    "Recall",
    "Reading context",
    "Return motivation",
  ];

  const productAreas = [
    {
      icon: <Compass size={32} className="text-blue-500 dark:text-blue-300" />,
      title: "Home",
      text: "A return point for progress, recent activity, language settings, daily review, and the next best action.",
      tags: ["Continue", "Daily goal", "Progress"],
    },
    {
      icon: <Route size={32} className="text-emerald-500 dark:text-emerald-300" />,
      title: "Bridge Builder",
      text: "A guided vocabulary path that turns packs into a visible learning journey instead of a flat content library.",
      tags: ["Guided path", "Review", "Skill checks"],
    },
    {
      icon: <MessageCircle size={32} className="text-rose-500 dark:text-rose-300" />,
      title: "Read",
      text: "Reading-based practice that moves learners from isolated words toward practical language in context.",
      tags: ["Scenarios", "Typing", "Phrases"],
    },
    {
      icon: <BookOpen size={32} className="text-indigo-500 dark:text-indigo-300" />,
      title: "Deep Script",
      text: "A deeper practice mode that reuses learned vocabulary in a more challenging interaction pattern.",
      tags: ["Pack words", "Challenge", "Reinforcement"],
    },
  ];

  const curriculumSections = [
    "Foundations",
    "Daily Life",
    "People & Social Life",
    "Meaning Builders",
    "Cafe Talk",
  ];

  const designDecisions = [
    {
      title: "Guided path over content library",
      problem: "A large list of packs gives choice, but it can also create paralysis for beginners.",
      decision:
        "I organized vocabulary into a visible path with sections, progress states, and current/upcoming nodes.",
      impact: "The learner can understand where they are, what comes next, and why a pack matters.",
    },
    {
      title: "Escape hatches for different mindsets",
      problem: "Some users want guidance. Others arrive with a specific goal or want direct control.",
      decision:
        "Bridge Builder includes Guided, Browse by goal, Advanced tools, and Review Due Now entry points.",
      impact: "The product can support beginners without trapping confident learners in a single path.",
    },
    {
      title: "Same words, multiple practice patterns",
      problem: "Language learning needs repetition, but repeated screens quickly become stale.",
      decision: "The same vocabulary can move through Bridge Builder, Loose Planks, and Deep Script.",
      impact: "Reinforcement feels varied while the learning target stays consistent.",
    },
  ];

  const keyFeatures = [
    {
      icon: <Brain size={32} className="text-purple-500 dark:text-purple-300" />,
      title: "Spaced Repetition System",
      text: "Progress and review systems help difficult items return more often while familiar material can move into longer-term reinforcement.",
    },
    {
      icon: <Languages size={32} className="text-indigo-500 dark:text-indigo-300" />,
      title: "Language & Localization Architecture",
      text: "The app separates practice language from interface language, making the learning system more flexible and scalable across content sets.",
    },
    {
      icon: <Accessibility size={32} className="text-rose-500 dark:text-rose-300" />,
      title: "Inclusive Design Direction",
      text: "The interface prioritizes readable hierarchy, calm surfaces, mobile-friendly controls, and settings that support different learner needs.",
    },
    {
      icon: <Database size={32} className="text-teal-500 dark:text-teal-300" />,
      title: "Persistent Progress Model",
      text: "Progress, seen words, sessions, daily activity, and achievements are treated as part of the product experience rather than isolated game stats.",
    },
    {
      icon: <TrendingUp size={32} className="text-amber-500 dark:text-amber-300" />,
      title: "Modern Tech Stack",
      text: "React with Vite, Tailwind CSS, React Router, and context-based state management allowed me to build and test a real product flow.",
    },
    {
      icon: <Zap size={32} className="text-indigo-600 dark:text-indigo-400" />,
      title: "Interactive Practice Engine",
      text: "Game-like practice modes use interaction, feedback, and progression to make repeated exposure feel more purposeful and less mechanical.",
    },
  ];

  const skillsLearned = [
    "Educational UX and learning science principles: progressive disclosure, active recall, and reinforcement",
    "Product architecture for a multi-mode learning platform",
    "Advanced React patterns: context providers, routed views, custom hooks, and state persistence",
    "Interaction design for mobile-first practice flows",
    "Internationalization and language-content management",
    "Accessibility-minded interface decisions for readable, low-friction learning",
    "AI-assisted design and development workflows for faster prototyping",
    "Turning a personal learning need into a scalable product system",
  ];

  const nextValidation = [
    "Track where learners hesitate, abandon a session, or miss the next action.",
    "Measure whether guided sections improve return behavior compared with a flat pack list.",
    "Audit accessibility around Hebrew text size, contrast, motion, audio, and touch targets.",
    "Add clearer analytics for completion, review, and repeat practice.",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 text-slate-900 transition-colors duration-500 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <motion.div
        style={{ width: progressBarWidth }}
        className="fixed left-0 top-0 z-50 h-1.5 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500"
      />

      {/* Hero Section */}
      <header className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 via-slate-200 to-slate-100 px-6 text-center dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="relative z-10 max-w-5xl">
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {[
              "Educational Design",
              "Product UX",
              "React Prototype",
              "AI-assisted workflow",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="mb-5 bg-gradient-to-b from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-5xl font-extrabold leading-tight text-transparent md:text-7xl dark:from-white dark:via-slate-200 dark:to-slate-400">
            Letter River: Making Language Learning Navigable
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-slate-700 md:text-xl dark:text-slate-200">
            I designed and built a responsive language-learning platform that helps beginners move from letters to vocabulary, to reading through guided paths, compact practice loops, and a scalable product architecture.
          </p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200"
          >
            <motion.p variants={fadeIn}>
              <strong>Role:</strong> Product Designer, UX Researcher & Front-End Prototyper
            </motion.p>
            <motion.p variants={fadeIn}>
              <strong>Status:</strong> Live prototype / ongoing product exploration
            </motion.p>
            <motion.p variants={fadeIn}>
              <strong>Stack:</strong> React, Vite, Tailwind, GitHub, Netlify
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-slate-700 dark:text-slate-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </motion.div>
      </header>

      <main id="case-study" className="mx-auto max-w-7xl px-6 sm:px-8">
        {/* Evidence Snapshot */}
        <section className="grid gap-5 py-16 md:grid-cols-2 lg:grid-cols-4">
          {evidenceCards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                {card.label}
              </p>
              <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                {card.value}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {card.detail}
              </p>
            </article>
          ))}
        </section>

        {/* Challenge Section */}
        <section className="py-20 md:py-28">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h2 className="mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
              The Challenge
            </h2>
            <p className="text-lg leading-relaxed text-slate-700 md:text-xl dark:text-slate-200">
              Learning Hebrew as a beginner is not one problem. It is several problems stacked together: a new writing system, sound patterns, transliteration, meaning, recall, reading context, and motivation. The UX challenge was to make that complexity feel structured, forgiving, and easy to return to.
            </p>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-6 dark:border-slate-700/80 dark:bg-slate-900/70">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">What beginners face</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {learningStack.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-6 dark:border-slate-700/80 dark:bg-slate-900/70">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">How the product reframes it</h3>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {[
                  "Separate the learning journey into visible layers.",
                  "Guide the next useful action instead of showing everything at once.",
                  "Reinforce the same content through varied practice modes.",
                  "Move from isolated recognition toward contextual reading.",
                ].map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 md:py-28">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mx-auto mb-12 max-w-3xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Process: From Friction to Product System</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              I followed the same product process that guides the rest of my portfolio: listen, map, prototype, ship and learn.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-4">
            {processSteps.map((step) => (
              <motion.article
                key={step.step}
                variants={fadeIn}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-6 dark:border-slate-700/80 dark:bg-slate-900/70"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                    {step.step}
                  </span>
                  {step.icon}
                </div>
                <h3 className="mt-8 text-xl font-bold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{step.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Development Journey Section */}
        <section className="relative py-20 md:py-28">
          <motion.h2
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mb-16 text-center text-3xl font-bold tracking-tight md:text-4xl"
          >
            Product Journey
          </motion.h2>
          <div className="relative">
            <div className="absolute bottom-0 left-1/2 top-0 hidden w-0.5 bg-slate-300 md:block dark:bg-slate-700/50" />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              className="space-y-16"
            >
              {journeySteps.map((step, index) => {
                const isEven = index % 2 === 0;
                return (
                  <motion.div key={step.title} variants={fadeIn} className="relative grid items-center gap-8 md:grid-cols-2 md:gap-16">
                    <div className={isEven ? "flex justify-center md:order-1" : "flex justify-center md:order-2"}>
                      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-slate-300 bg-slate-100 shadow-sm md:mb-0 dark:border-slate-700 dark:bg-slate-900">
                        {step.icon}
                      </div>
                    </div>
                    <div className={isEven ? "text-center md:order-2 md:text-left" : "text-center md:order-1 md:text-left"}>
                      <h3 className="mb-3 text-2xl font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                      <p className="leading-relaxed text-slate-700 dark:text-slate-200">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Product Architecture */}
        <section className="py-20 md:py-28">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mx-auto mb-12 max-w-3xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">From Lessons to a Learning System</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              Letter River is organized around repeatable product areas, each solving a different part of the learner journey: returning, practicing, reviewing, reading, and continuing.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {productAreas.map((area) => (
              <motion.article
                key={area.title}
                variants={fadeIn}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 dark:border-slate-700/80 dark:bg-slate-900/60"
              >
                <div className="mb-4">{area.icon}</div>
                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{area.title}</h3>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{area.text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {area.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Curriculum Design */}
        <section className="py-20 md:py-28">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mx-auto mb-12 max-w-3xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Curriculum Design: Make the Path Visible</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              Instead of dumping vocabulary into a flat library, I grouped the learning path into themed sections that move from foundations toward practical, contextual language.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-5">
            {curriculumSections.map((section, index) => (
              <div
                key={section}
                className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-5 text-center dark:border-slate-700/80 dark:bg-slate-900/70"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">0{index + 1}</span>
                <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{section}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Design Decisions */}
        <section className="py-20 md:py-28">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mx-auto mb-12 max-w-3xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Four Design Decisions That Shaped the Product</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              Each decision was about turning complexity into a clearer user action.
            </p>
          </motion.div>

          <div className="space-y-6">
            {designDecisions.map((decision, index) => (
              <motion.article
                key={decision.title}
                variants={fadeIn}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-6 dark:border-slate-700/80 dark:bg-slate-900/70"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{decision.title}</h3>
                    <div className="mt-5 grid gap-5 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-rose-500 dark:text-rose-300">Problem</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{decision.problem}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-300">Decision</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{decision.decision}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 dark:text-amber-300">Why it mattered</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{decision.impact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Mode Sequence */}
        <section className="grid gap-10 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Repetition Without Stale Repetition</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              Language learning requires repeated exposure. Instead of repeating the exact same screen, Letter River lets the same vocabulary move through different interaction patterns. The learning target stays stable, while the experience changes.
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">
              <p className="font-bold">Product principle</p>
              <p className="mt-2 leading-relaxed">
                The playful layer exists to support practice, not distract from it. Every mode has to reinforce the learning goal.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Mode sequence</p>
                <h3 className="mt-2 text-2xl font-bold">One pack, three practice patterns</h3>
              </div>
              <Layers3 className="hidden text-blue-300 sm:block" size={34} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Bridge Builder", "Introduce and connect words."],
                ["Loose Planks", "Review through lighter recognition."],
                ["Deep Script", "Challenge recall in a deeper mode."],
              ].map(([title, text], index) => (
                <div key={title} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300">0{index + 1}</span>
                    {index < 2 ? <ArrowRight className="text-slate-500" size={18} /> : null}
                  </div>
                  <p className="mt-8 text-lg font-bold">{title}</p>
                  <p className="mt-2 text-sm text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Live App Preview */}
        <section className="py-20 md:py-28">
          <motion.h2
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl"
          >
            The Learning Platform
          </motion.h2>
          <div className="flex justify-center">
            <motion.div
              variants={fadeIn}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="group relative max-w-4xl overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100/80 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70"
            >
              <a
                href="https://letterriver.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
              >
                <img
                  src="https://api.microlink.io/?url=https://letterriver.netlify.app/&screenshot=true&meta=false&embed=screenshot.url"
                  alt="Letter River Live App Preview"
                  className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </a>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <a
                href="https://letterriver.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <ExternalLink size={18} /> Open Live App
              </a>
            </motion.div>
          </div>
          <p className="mt-4 text-center text-sm text-slate-700 dark:text-slate-300">
            View the live prototype at{" "}
            <a
              href="https://letterriver.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline transition hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:text-blue-300 dark:focus-visible:ring-offset-slate-900"
            >
              letterriver.netlify.app
            </a>
          </p>
        </section>

        {/* Key Features & Technical Highlights */}
        <section className="py-20 md:py-28">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
              Key Features & Technical Highlights
            </h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {keyFeatures.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={fadeIn}
                  className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 dark:border-slate-700/80 dark:bg-slate-900/60"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-slate-700 dark:text-slate-200">{feature.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Skills Learned */}
        <section className="rounded-3xl bg-slate-100/50 py-20 dark:bg-slate-900/30 md:py-28">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="mx-auto max-w-4xl px-6"
          >
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight md:text-4xl">Skills Developed</h2>
            <p className="mb-12 text-center text-lg text-slate-700 dark:text-slate-200">
              Building Letter River required combining UX thinking, learning design, product architecture, and front-end implementation.
            </p>
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {skillsLearned.map((skill) => (
                <motion.li
                  key={skill}
                  variants={fadeIn}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-300" />
                  <span className="text-slate-700 dark:text-slate-200">{skill}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </section>

        {/* Outcome + Next Validation */}
        <section className="grid gap-8 py-20 md:py-28 lg:grid-cols-2 lg:items-start">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-8 dark:border-slate-700/80 dark:bg-slate-900/70"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Outcome</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              Letter River is now a live prototype with a structured learning architecture, multiple practice modes, themed curriculum sections, reading practice, progress systems, mobile-first navigation, and a scalable React codebase.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              I am intentionally not claiming fabricated growth metrics. The value of this case study is in the product thinking, design decisions, and working system that can now be tested with real learners.
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-8 dark:border-slate-700/80 dark:bg-slate-900/70"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Next Validation</h2>
            <ul className="mt-5 space-y-3">
              {nextValidation.map((item) => (
                <li key={item} className="flex gap-3 text-slate-700 dark:text-slate-200">
                  <Target className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        {/* Impact & Reflection */}
        <section className="py-20 md:py-28">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Impact & Reflection</h2>
            <p className="mb-8 text-lg leading-relaxed text-slate-700 md:text-xl dark:text-slate-200">
              Letter River taught me that educational UX is less about adding features and more about managing attention. A feature only matters if it helps the learner understand what to do, why it matters, and how to keep going.
            </p>
            <blockquote className="border-l-4 border-blue-400 pl-6 text-left text-lg italic text-slate-800 dark:text-slate-200">
              “The lesson was not ‘add more features.’ It was ‘make the next step clearer.’”
            </blockquote>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center sm:px-8">
          <motion.h2
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mb-6 text-3xl font-bold text-slate-900 dark:text-white"
          >
            Explore Letter River
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center gap-6 sm:flex-row"
          >
            <motion.a
              href="https://letterriver.netlify.app/"
              variants={fadeIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-3 font-semibold text-white transition-colors duration-300 hover:bg-blue-600"
            >
              <ExternalLink size={20} /> Try Live App
            </motion.a>
          </motion.div>
        </div>
      </footer>

      <style>{`
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.08) 1px, transparent 1px);
          background-size: 2rem 2rem;
        }

        .dark .bg-grid-pattern {
          background-image: linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
}
