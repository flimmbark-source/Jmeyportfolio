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
  Map,
  MousePointer2,
  Route,
  Settings,
  Smartphone,
  Sparkles,
  Target,
} from "lucide-react";

const imagePath = (name) => `/images/${name}`;

const screenshots = {
  heroDesktop: imagePath("Desktop_Hero_Screen.png"),
  heroMobile: imagePath("Home_Screen.png"),
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

function SectionEyebrow({ number, children }) {
  return (
    <p className="mb-3 flex items-center gap-3 text-xs font-black uppercase tracking-[0.24em] text-emerald-800/80 dark:text-emerald-200/80">
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.65rem] text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100">
        {number}
      </span>
      {children}
    </p>
  );
}

function ScreenshotFrame({ src, alt, className = "", imgClassName = "", caption }) {
  return (
    <figure className={`overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900 ${className}`}>
      <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${imgClassName}`} />
      {caption ? (
        <figcaption className="border-t border-slate-200/70 px-4 py-3 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function Annotation({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-emerald-200 bg-white/95 px-4 py-3 text-sm font-semibold leading-snug text-emerald-950 shadow-lg shadow-emerald-950/5 dark:border-emerald-700 dark:bg-slate-950/95 dark:text-emerald-50 ${className}`}>
      {children}
    </div>
  );
}

function PhoneShot({ src, alt, title, note }) {
  return (
    <article className="min-w-[11.5rem] flex-1">
      <div className="mx-auto max-w-[12rem] overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <img src={src} alt={alt} loading="lazy" className="h-[18rem] w-full object-cover object-top" />
      </div>
      <h3 className="mt-4 text-center text-sm font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-[13rem] text-center text-xs leading-relaxed text-slate-600 dark:text-slate-300">{note}</p>
    </article>
  );
}

export default function LetterRiverCaseStudy() {
  const { scrollYProgress } = useScroll();
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const cognitiveLoad = [
    { icon: <BookOpen size={22} />, title: "Letters", detail: "New shapes with no reference" },
    { icon: <Flame size={22} />, title: "Sounds", detail: "Different from English" },
    { icon: <Languages size={22} />, title: "Transliteration", detail: "Another layer to decode" },
    { icon: <Sparkles size={22} />, title: "Meaning", detail: "Learn the word and its use" },
    { icon: <Brain size={22} />, title: "Recall", detail: "Remember and recognize" },
    { icon: <ArrowRight size={22} className="rotate-180" />, title: "Reading direction", detail: "Right-to-left feels unfamiliar" },
    { icon: <Target size={22} />, title: "Motivation", detail: "Easy to feel stuck early" },
  ];

  const systemFlow = [
    { src: screenshots.home, title: "Home", note: "See your path and next action." },
    { src: screenshots.vocabPack, title: "Pack", note: "Understand the learning goal." },
    { src: screenshots.bridgeBuilder, title: "Bridge Builder", note: "Build recognition with scaffolding." },
    { src: screenshots.loosePlanks, title: "Loose Planks", note: "Reinforce with recall practice." },
    { src: screenshots.deepScript, title: "Deep Script", note: "Connect letters to form and memory." },
    { src: screenshots.read, title: "Read", note: "Use known words in context." },
  ];

  const buildFlow = [
    ["Language settings", "Separate app language from learning language"],
    ["Content packs", "Reusable lesson data and pack goals"],
    ["Practice engine", "Bridge Builder, review, script, and reading loops"],
    ["Progress state", "Seen words, session progress, review readiness"],
    ["Review logic", "Words return at the right moment"],
    ["Reading context", "Known words become useful in short tasks"],
  ];

  return (
    <div className="min-h-screen bg-[#f6f2e8] text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <motion.div
        style={{ width: progressBarWidth }}
        className="fixed left-0 top-0 z-50 h-1 bg-gradient-to-r from-emerald-700 via-teal-500 to-amber-400"
      />

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <section id="overview" className="relative overflow-hidden rounded-[2.25rem] border border-emerald-900/10 bg-gradient-to-br from-[#fbf8ef] via-[#f4efe4] to-[#dceee8] p-6 shadow-xl shadow-emerald-950/5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/40 sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.75),transparent_45%)] lg:block" />
          <div className="relative grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <p className="mb-5 text-xs font-black uppercase tracking-[0.28em] text-emerald-800 dark:text-emerald-200">Case study</p>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.03] tracking-tight text-emerald-950 dark:text-white sm:text-5xl lg:text-6xl">
                Letter River: making language learning navigable.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200">
                I designed and built a guided Hebrew learning system that reduces early cognitive overload by moving learners from letters, to vocabulary, to meaningful reading through connected practice loops.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="https://letterriver.netlify.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-900">
                  Explore prototype <ExternalLink size={16} />
                </a>
                <a href="https://github.com/flimmbark-source/HebrewLetterRiver" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-black text-slate-900 transition hover:-translate-y-0.5 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  View GitHub <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.7 }} className="relative min-h-[25rem]">
              <div className="absolute -right-4 top-6 hidden h-64 w-64 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-500/10 lg:block" />
              <ScreenshotFrame src={screenshots.heroDesktop} alt="Letter River desktop home screen showing a scenic learning dashboard" className="relative ml-auto max-w-3xl rounded-[1.8rem]" imgClassName="max-h-[28rem] object-contain bg-[#f6f2e8]" />
              <div className="absolute -bottom-4 left-2 w-[11rem] sm:left-8 sm:w-[12.5rem] lg:-bottom-8 lg:left-0">
                <ScreenshotFrame src={screenshots.home} alt="Letter River mobile home screen" className="rounded-[1.8rem]" imgClassName="h-[23rem] object-cover object-top" />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["My role", "UX / Product Design", "Full-stack prototyping"],
            ["Status", "In progress", "Live coded prototype"],
            ["Stack", "React + TypeScript", "Tailwind + Firebase"],
            ["Focus", "Cognitive load", "Engagement & retention"],
          ].map(([label, title, detail]) => (
            <article key={label} className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">{label}</p>
              <h2 className="mt-2 text-base font-black text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
            </article>
          ))}
        </section>

        <section id="challenge" className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr] lg:items-start">
            <div>
              <SectionEyebrow number="01">The UX problem</SectionEyebrow>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">Beginners face stacked cognitive load.</h2>
              <p className="mt-4 text-slate-700 dark:text-slate-300">New learners are not just memorizing words. They are juggling unfamiliar symbols, sounds, direction, transliteration, meaning, recall, and motivation at once.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {cognitiveLoad.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-[#fbf8ef] p-4 text-center dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-200">{item.icon}</div>
                  <h3 className="mt-3 text-sm font-black text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.32fr_1fr]">
            <div>
              <SectionEyebrow number="02">From lessons to a learning system</SectionEyebrow>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">A connected loop that builds skill and confidence.</h2>
              <p className="mt-4 text-slate-700 dark:text-slate-300">Each screen supports the next one. Words are introduced, practiced in different ways, and then used in context.</p>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-2">
              {systemFlow.map((step, index) => (
                <React.Fragment key={step.title}>
                  <PhoneShot src={step.src} alt={`${step.title} screenshot from Letter River`} title={step.title} note={step.note} />
                  {index < systemFlow.length - 1 ? <ArrowRight className="mt-36 hidden shrink-0 text-emerald-700/60 lg:block" size={24} /> : null}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
            Review is not a separate destination. It brings words back into the loop at the right moment.
          </div>
        </section>

        <section id="journey" className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8 lg:p-10">
          <SectionEyebrow number="03">Three design decisions</SectionEyebrow>
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-[#fbf8ef] p-5 dark:border-slate-700 dark:bg-slate-950/50">
              <h2 className="text-2xl font-black tracking-tight">1. Guide the next action.</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">Beginners need clarity, not more choices.</p>
              <div className="relative mt-5">
                <ScreenshotFrame src={screenshots.home} alt="Home screen with continue journey card" imgClassName="h-[24rem] object-cover object-top" />
                <Annotation className="absolute -right-2 top-20 max-w-[12rem]">One primary next step.</Annotation>
                <Annotation className="absolute -left-2 bottom-20 max-w-[12rem]">Progress is visible without being overwhelming.</Annotation>
              </div>
              <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300"><strong className="text-slate-950 dark:text-white">Why it mattered:</strong> The learner always has a recommended action, while secondary paths stay available.</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-[#fbf8ef] p-5 dark:border-slate-700 dark:bg-slate-950/50">
              <h2 className="text-2xl font-black tracking-tight">2. Reuse words across practice patterns.</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">Repetition works better when the task changes.</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <ScreenshotFrame src={screenshots.bridgeBuilder} alt="Bridge Builder screenshot" imgClassName="h-[16rem] object-cover object-top" />
                <ScreenshotFrame src={screenshots.loosePlanks} alt="Loose Planks screenshot" imgClassName="h-[16rem] object-cover object-top" />
                <ScreenshotFrame src={screenshots.deepScript} alt="Deep Script screenshot" imgClassName="h-[16rem] object-cover object-top" />
              </div>
              <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300"><strong className="text-slate-950 dark:text-white">Why it mattered:</strong> The same vocabulary can return as recognition, recall, and script practice without feeling like the same drill.</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-[#fbf8ef] p-5 dark:border-slate-700 dark:bg-slate-950/50">
              <h2 className="text-2xl font-black tracking-tight">3. Move from recognition to reading.</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">Known words become useful inside short, meaningful tasks.</p>
              <div className="relative mt-5">
                <ScreenshotFrame src={screenshots.read} alt="Read in context screenshot" imgClassName="h-[24rem] object-cover object-top" />
                <Annotation className="absolute -right-2 top-24 max-w-[11rem]">Familiar words appear in context.</Annotation>
                <Annotation className="absolute -left-2 bottom-24 max-w-[11rem]">Support stays nearby without overloading the screen.</Annotation>
              </div>
              <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300"><strong className="text-slate-950 dark:text-white">Why it mattered:</strong> Reading becomes a continuation of practice, not a separate jump in difficulty.</p>
            </article>
          </div>
        </section>

        <section id="architecture" className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.35fr_1fr] lg:items-center">
            <div>
              <SectionEyebrow number="04">Built as a working product</SectionEyebrow>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">A coded prototype that reflects real product architecture.</h2>
              <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {["React + TypeScript", "Tailwind", "Firebase", "Deployed on Netlify", "GitHub workflow"].map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-700 dark:text-emerald-300" /> {item}</li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {buildFlow.map(([title, detail], index) => (
                <article key={title} className="relative rounded-2xl border border-slate-200 bg-[#fbf8ef] p-5 dark:border-slate-700 dark:bg-slate-950/60">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-200">
                    {index === 0 ? <Settings size={21} /> : index === 1 ? <BookOpen size={21} /> : index === 2 ? <MousePointer2 size={21} /> : index === 3 ? <Code2 size={21} /> : index === 4 ? <Route size={21} /> : <Eye size={21} />}
                  </div>
                  <h3 className="font-black text-slate-950 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
            <SectionEyebrow number="05">Product evidence</SectionEyebrow>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">The screenshots now support the argument.</h2>
            <p className="mt-4 text-slate-700 dark:text-slate-300">The case study is no longer relying on generic polish. Each capture shows a specific product decision: guided entry, language architecture, varied practice, and contextual reading.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <ScreenshotFrame src={screenshots.vocabJourney} alt="Vocabulary Journey screen" imgClassName="h-[17rem] object-cover object-top" caption="Guided path" />
              <ScreenshotFrame src={screenshots.settings} alt="Settings screen showing language preferences" imgClassName="h-[17rem] object-cover object-top" caption="Language architecture" />
            </div>
          </article>
          <article className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
            <SectionEyebrow number="06">Responsive behavior</SectionEyebrow>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">Mobile-first screens, desktop presentation.</h2>
            <p className="mt-4 text-slate-700 dark:text-slate-300">Most learning actions happen in compact mobile layouts, while the portfolio page frames them in a clear product narrative.</p>
            <div className="mt-6 flex items-center justify-center gap-5">
              <Smartphone className="text-emerald-700 dark:text-emerald-300" size={34} />
              <Layers3 className="text-emerald-700 dark:text-emerald-300" size={34} />
              <Map className="text-emerald-700 dark:text-emerald-300" size={34} />
            </div>
            <ScreenshotFrame src={screenshots.letterRiver} alt="Letter River mode screen" className="mt-6" imgClassName="h-[19rem] object-cover object-top" caption="Letter learning mode" />
          </article>
        </section>

        <section id="outcome" className="my-6 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.35fr_1fr]">
            <div>
              <SectionEyebrow number="07">What I’d validate next</SectionEyebrow>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">This is a prototype. The next step is learning from real users.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Find friction", "Observe where learners hesitate during onboarding and first-session practice."],
                ["Compare approaches", "Test guided Bridge Builder sections against open practice for retention."],
                ["Improve accessibility", "Validate readability, touch targets, text size, and RTL clarity."],
                ["Measure learning", "Track completion, review accuracy, and long-term recall."],
              ].map(([title, detail]) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-[#fbf8ef] p-5 dark:border-slate-700 dark:bg-slate-950/60">
                  <h3 className="font-black text-blue-700 dark:text-blue-300">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{detail}</p>
                </article>
              ))}
            </div>
          </div>
          <blockquote className="mt-10 rounded-3xl bg-gradient-to-r from-emerald-950 to-emerald-800 p-7 text-2xl font-black leading-snug text-white shadow-lg shadow-emerald-950/15">
            “The goal is not more features. It is the right learning experience, validated and improved.”
          </blockquote>
        </section>
      </main>
    </div>
  );
}
