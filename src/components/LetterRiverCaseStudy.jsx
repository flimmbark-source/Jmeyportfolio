import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Code2,
  ExternalLink,
  Eye,
  Flame,
  Languages,
  Layers3,
  MousePointer2,
  Route,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";

const imagePath = (name) => `/images/${name}`;

const screenshots = {
  desktopHero: imagePath("Desktop_Hero_Screen.png"),
  vocabJourney: imagePath("Vocab_Journey.png"),
  bridgeBuilder: imagePath("Bridge_Builder.png"),
  loosePlanks: imagePath("Loose_Planks.png"),
  deepScript: imagePath("Deep_Script.png"),
  vocabPack: imagePath("Vocab_pack.png"),
  home: imagePath("Home_Screen.png"),
  settings: imagePath("Settings_Screen.png"),
  read: imagePath("Read_Screen.png"),
  letterRiver: imagePath("Letter_River.png"),
};

const panel = "rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900";
const sectionPad = "p-6 sm:p-8 lg:p-10";

function SectionEyebrow({ number, children }) {
  return (
    <p className="mb-3 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.68rem] text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">
        {number}
      </span>
      {children}
    </p>
  );
}

function DesktopFrame({ src, alt, caption, className = "" }) {
  return (
    <figure className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-950 ${className}`}>
      <div className="bg-slate-100 p-2 dark:bg-slate-800">
        <img src={src} alt={alt} loading="lazy" className="mx-auto max-h-[420px] w-full rounded-2xl object-contain" />
      </div>
      {caption ? (
        <figcaption className="border-t border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function MobileFrame({ src, alt, caption, className = "", imageClassName = "h-[390px] object-cover object-top" }) {
  return (
    <figure className={`mx-auto w-full max-w-[220px] overflow-hidden rounded-[1.55rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 ${className}`}>
      <img src={src} alt={alt} loading="lazy" className={`w-full ${imageClassName}`} />
      {caption ? (
        <figcaption className="border-t border-slate-200 px-3 py-2 text-center text-xs font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function EvidenceNote({ children }) {
  return (
    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-relaxed text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
      {children}
    </div>
  );
}

function DecisionCard({ number, title, text, children, note }) {
  return (
    <article className={`${panel} overflow-hidden`}>
      <div className="border-b border-slate-200 bg-[#fbf8ef] p-5 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-black text-white">
            {number}
          </span>
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{text}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
      <div className="border-t border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
        <strong className="text-slate-950 dark:text-white">Why it mattered: </strong>
        {note}
      </div>
    </article>
  );
}

function FlowCard({ icon, title, detail }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-[#fbf8ef] p-5 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
        {icon}
      </div>
      <h3 className="font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{detail}</p>
    </article>
  );
}

export default function LetterRiverCaseStudy() {
  const { scrollYProgress } = useScroll();
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const cognitiveLoad = [
    { icon: <BookOpen size={22} />, title: "Letters", detail: "New shapes, no reference" },
    { icon: <Flame size={22} />, title: "Sounds", detail: "Different from English" },
    { icon: <Languages size={22} />, title: "Transliteration", detail: "Another layer to decode" },
    { icon: <Sparkles size={22} />, title: "Meaning", detail: "Learn use, not just a label" },
    { icon: <Brain size={22} />, title: "Recall", detail: "Remember and recognize" },
    { icon: <ArrowRight size={22} className="rotate-180" />, title: "Reading direction", detail: "Right-to-left feels unfamiliar" },
    { icon: <Target size={22} />, title: "Motivation", detail: "Easy to feel stuck early" },
  ];

  const systemFlow = [
    { src: screenshots.home, title: "Home", note: "See the next action." },
    { src: screenshots.vocabPack, title: "Pack", note: "Understand the goal." },
    { src: screenshots.bridgeBuilder, title: "Bridge Builder", note: "Build recognition." },
    { src: screenshots.loosePlanks, title: "Loose Planks", note: "Recall and review." },
    { src: screenshots.deepScript, title: "Deep Script", note: "Practice letter forms." },
    { src: screenshots.read, title: "Read", note: "Use words in context." },
  ];

  return (
    <div className="min-h-screen bg-[#f6f2e8] text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <motion.div style={{ width: progressBarWidth }} className="fixed left-0 top-0 z-50 h-1 bg-gradient-to-r from-emerald-700 via-teal-500 to-amber-400" />

      <main id="overview" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className={`${panel} overflow-hidden bg-gradient-to-br from-[#fbf8ef] via-white to-[#dceee8] dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/40`}>
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10 xl:p-12">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="flex flex-col justify-center">
              <p className="mb-4 text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">Case study</p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-emerald-950 dark:text-white sm:text-5xl xl:text-6xl">
                Letter River: making language learning navigable.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200">
                I designed and built a guided Hebrew learning system that reduces early cognitive overload by moving learners from letters, to vocabulary, to meaningful reading through connected practice loops.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="https://letterriver.netlify.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-900">
                  Explore prototype <ExternalLink size={16} />
                </a>
                <a href="https://github.com/flimmbark-source/HebrewLetterRiver" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
                  View GitHub <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.55 }} className="grid gap-4 sm:grid-cols-[1fr_180px] sm:items-end">
              <DesktopFrame src={screenshots.desktopHero} alt="Letter River desktop home screen" caption="Responsive desktop prototype" />
              <div className="hidden sm:block">
                <MobileFrame src={screenshots.home} alt="Letter River mobile home screen" caption="Mobile home" imageClassName="h-[340px] object-cover object-top" />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            ["My role", "UX / Product Design", "Full-stack prototyping"],
            ["Status", "In progress", "Live coded prototype"],
            ["Stack", "React + TypeScript", "Tailwind + Firebase"],
            ["Focus", "Cognitive load", "Engagement & retention"],
          ].map(([label, title, detail]) => (
            <article key={label} className={`${panel} p-5`}>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{label}</p>
              <h2 className="mt-2 text-base font-black text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
            </article>
          ))}
        </section>

        <section id="challenge" className={`${panel} ${sectionPad} mt-5 scroll-mt-24`}>
          <div className="grid gap-8 lg:grid-cols-[0.38fr_1fr] lg:items-start">
            <div>
              <SectionEyebrow number="01">The UX problem</SectionEyebrow>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">Beginners face stacked cognitive load.</h2>
              <p className="mt-4 text-slate-700 dark:text-slate-300">New learners are not just memorizing words. They are juggling unfamiliar symbols, sounds, direction, transliteration, meaning, recall, and motivation at once.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cognitiveLoad.map((item) => (
                <article key={item.title} className="min-w-0 rounded-2xl border border-slate-200 bg-[#fbf8ef] p-4 text-center dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300">{item.icon}</div>
                  <h3 className="mt-3 break-words text-sm font-black leading-tight text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className={`${panel} ${sectionPad} mt-5 scroll-mt-24`}>
          <div className="grid gap-8 lg:grid-cols-[0.32fr_1fr]">
            <div>
              <SectionEyebrow number="02">From lessons to a learning system</SectionEyebrow>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">A connected loop that builds skill and confidence.</h2>
              <p className="mt-4 text-slate-700 dark:text-slate-300">Each screen supports the next one. Words are introduced, practiced in different ways, and then used in context.</p>
              <EvidenceNote>Review is not a separate destination. It brings words back into the loop at the right moment.</EvidenceNote>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {systemFlow.map((step) => (
                <article key={step.title} className="rounded-3xl border border-slate-200 bg-[#fbf8ef] p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <MobileFrame src={step.src} alt={`${step.title} screenshot from Letter River`} imageClassName="h-[330px] object-cover object-top" />
                  <h3 className="mt-4 text-center text-sm font-black text-slate-950 dark:text-white">{step.title}</h3>
                  <p className="mt-1 text-center text-xs leading-relaxed text-slate-600 dark:text-slate-300">{step.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className={`${sectionPad} mt-5 scroll-mt-24 ${panel}`}>
          <SectionEyebrow number="03">Three design decisions</SectionEyebrow>
          <div className="grid gap-6 lg:grid-cols-3">
            <DecisionCard number="1" title="Guide the next action." text="Beginners need clarity, not more choices." note="The learner always has a recommended action, while secondary paths stay available.">
              <MobileFrame src={screenshots.vocabJourney} alt="Vocabulary Journey screen with current pack card" imageClassName="h-[390px] object-cover object-top" />
              <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="rounded-2xl bg-white p-3 dark:bg-slate-900">Current pack is clearly prioritized.</span>
                <span className="rounded-2xl bg-white p-3 dark:bg-slate-900">Review and reading remain secondary actions.</span>
              </div>
            </DecisionCard>

            <DecisionCard number="2" title="Reuse words across patterns." text="Repetition works better when the task changes." note="The same vocabulary can return as recognition, recall, and script practice without feeling like the same drill.">
              <div className="grid gap-4">
                <MobileFrame src={screenshots.bridgeBuilder} alt="Bridge Builder screenshot" imageClassName="h-[240px] object-cover object-top" className="max-w-[260px]" />
                <MobileFrame src={screenshots.loosePlanks} alt="Loose Planks screenshot" imageClassName="h-[240px] object-cover object-top" className="max-w-[260px]" />
                <MobileFrame src={screenshots.deepScript} alt="Deep Script screenshot" imageClassName="h-[240px] object-cover object-top" className="max-w-[260px]" />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                Bridge Builder <ArrowRight size={14} /> Review <ArrowRight size={14} /> Deep Script
              </div>
            </DecisionCard>

            <DecisionCard number="3" title="Move recognition into reading." text="Known words become useful inside short, meaningful tasks." note="Reading becomes a continuation of practice, not a separate jump in difficulty.">
              <MobileFrame src={screenshots.read} alt="Read in context screenshot" imageClassName="h-[390px] object-cover object-top" />
              <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="rounded-2xl bg-white p-3 dark:bg-slate-900">Familiar words appear in context.</span>
                <span className="rounded-2xl bg-white p-3 dark:bg-slate-900">Support stays nearby without overloading the screen.</span>
              </div>
            </DecisionCard>
          </div>
        </section>

        <section id="architecture" className={`${panel} ${sectionPad} mt-5 scroll-mt-24`}>
          <div className="grid gap-10 lg:grid-cols-[0.35fr_1fr] lg:items-start">
            <div>
              <SectionEyebrow number="04">Built as a working product</SectionEyebrow>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">A coded prototype that reflects real product architecture.</h2>
              <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {["React + TypeScript", "Tailwind", "Firebase", "Deployed on Netlify", "GitHub workflow"].map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-700 dark:text-emerald-300" /> {item}</li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FlowCard icon={<Settings size={21} />} title="Language settings" detail="Separate app language from learning language." />
              <FlowCard icon={<BookOpen size={21} />} title="Content packs" detail="Reusable lesson data and pack goals." />
              <FlowCard icon={<MousePointer2 size={21} />} title="Practice engine" detail="Bridge Builder, review, script, and reading loops." />
              <FlowCard icon={<Code2 size={21} />} title="Progress state" detail="Seen words, session progress, and review readiness." />
              <FlowCard icon={<Route size={21} />} title="Review logic" detail="Words return at the right moment." />
              <FlowCard icon={<Eye size={21} />} title="Reading context" detail="Known words become useful in short tasks." />
            </div>
          </div>
        </section>

        <section id="features" className="mt-5 grid gap-5 scroll-mt-24 lg:grid-cols-2">
          <article className={`${panel} ${sectionPad}`}>
            <SectionEyebrow number="05">Product evidence</SectionEyebrow>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">The screenshots support the argument.</h2>
            <p className="mt-4 text-slate-700 dark:text-slate-300">Each capture shows a specific product decision: guided entry, language architecture, varied practice, and contextual reading.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MobileFrame src={screenshots.vocabJourney} alt="Vocabulary Journey screen" caption="Guided path" imageClassName="h-[330px] object-cover object-top" />
              <MobileFrame src={screenshots.settings} alt="Settings screen showing language preferences" caption="Language architecture" imageClassName="h-[330px] object-cover object-top" />
            </div>
          </article>
          <article className={`${panel} ${sectionPad}`}>
            <SectionEyebrow number="06">Responsive behavior</SectionEyebrow>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">Mobile-first screens, desktop presentation.</h2>
            <p className="mt-4 text-slate-700 dark:text-slate-300">Most learning actions happen in compact mobile layouts, while the portfolio page frames them in a clear product narrative.</p>
            <div className="mt-6 grid place-items-center">
              <MobileFrame src={screenshots.letterRiver} alt="Letter River mode screen" caption="Letter learning mode" imageClassName="h-[360px] object-cover object-top" />
            </div>
          </article>
        </section>

        <section id="outcome" className={`${panel} ${sectionPad} my-5 scroll-mt-24`}>
          <div className="grid gap-8 lg:grid-cols-[0.35fr_1fr]">
            <div>
              <SectionEyebrow number="07">What I’d validate next</SectionEyebrow>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">This is a prototype. The next step is learning from real users.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Find friction", "Observe where learners hesitate during onboarding and first-session practice."],
                ["Compare approaches", "Test guided Bridge Builder sections against open practice for retention."],
                ["Improve accessibility", "Validate readability, touch targets, text size, and RTL clarity."],
                ["Measure learning", "Track completion, review accuracy, and long-term recall."],
              ].map(([title, detail]) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-[#fbf8ef] p-5 dark:border-slate-800 dark:bg-slate-950/60">
                  <h3 className="font-black text-blue-700 dark:text-blue-300">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{detail}</p>
                </article>
              ))}
            </div>
          </div>
          <blockquote className="mt-10 rounded-3xl bg-gradient-to-r from-emerald-950 to-emerald-800 p-7 text-xl font-black leading-snug text-white shadow-lg shadow-emerald-950/15 sm:text-2xl">
            “The goal is not more features. It is the right learning experience, validated and improved.”
          </blockquote>
        </section>
      </main>
    </div>
  );
}
