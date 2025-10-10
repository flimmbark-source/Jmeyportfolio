import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Github, ExternalLink, Code, BrainCircuit, Rocket, Palette, Sparkles, Wand2 } from 'lucide-react';

export default function RotogoCaseStudy() {
  const { scrollYProgress } = useScroll();
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const fadeIn = {
    hidden: { opacity: 1, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const journeySteps = [
    { icon: <Wand2 className="h-8 w-8 text-teal-500 dark:text-teal-300" />, title: "The Spark: An Idea and a Prompt", description: "It all started with a simple question: 'Could I build a real application by collaborating with an LLM?' I had no coding background, just immense curiosity. The first step was translating a vague idea into a clear, actionable prompt for the AI." },
    { icon: <Code className="h-8 w-8 text-indigo-500 dark:text-indigo-300" />, title: "From Prompts to Prototypes", description: "The AI generated the initial boilerplate. My role became that of a director—learning to read the code, identify bugs, and ask the right follow-up questions. This iterative dialogue was my 'Rosetta Stone' for understanding React and JavaScript." },
    { icon: <Github className="h-8 w-8 text-slate-700 dark:text-slate-300" />, title: "Mastering the Tools: Git & GitHub", description: "With functional code came a new challenge: version control. I used the AI to explain Git concepts, turning complex commands into simple analogies. My first successful commit to GitHub felt like a monumental victory." },
    { icon: <Palette className="h-8 w-8 text-rose-500 dark:text-rose-300" />, title: "Designing the Experience", description: "Functionality wasn't enough; the app needed to feel intuitive. This phase focused on UX/UI, using AI to suggest Tailwind CSS classes for layout, color theory for palettes, and accessibility best practices." },
    { icon: <Rocket className="h-8 w-8 text-amber-500 dark:text-amber-300" />, title: "Deployment: From Localhost to Live", description: "The final frontier was shipping the project. I learned about build processes and deployment platforms. Seeing 'Rotogo' live on the web, accessible via a URL, was the moment the project felt truly real." }
  ];

  const keyLearnings = [
    { icon: <BrainCircuit size={32} className="text-teal-500 dark:text-teal-300" />, title: "AI as a Socratic Tutor", text: "The LLM wasn't just a code generator; it was a partner that forced me to ask better questions and articulate problems clearly." },
    { icon: <Sparkles size={32} className="text-amber-500 dark:text-amber-300" />, title: "The Power of Iteration", text: "Building isn't a linear path. The cycle of prompting, testing, debugging, and refining was the core learning loop of this entire project." },
    { icon: <Code size={32} className="text-indigo-500 dark:text-indigo-300" />, title: "Code Is a Language", text: "By seeing patterns in the AI's output and fixing errors, I began to understand the syntax and logic of code organically, much like learning a spoken language." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 text-slate-900 transition-colors duration-500 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <motion.div style={{ width: progressBarWidth }} className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-teal-400 to-indigo-500 z-50" />

      {/* Hero Section */}
      <header className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 via-slate-200 to-slate-100 px-6 text-center dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="relative z-10 max-w-4xl">
          <h1 className="mb-4 bg-gradient-to-b from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-5xl font-extrabold text-transparent md:text-7xl dark:from-white dark:via-slate-200 dark:to-slate-400">Rotogo: A Journey from Prompt to Product</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl dark:text-slate-300">How I learned to code, design, and ship a real-world application by partnering with Large Language Models.</p>
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <motion.p variants={fadeIn}><strong>Role:</strong> AI-Assisted Developer</motion.p>
            <motion.p variants={fadeIn}><strong>Timeline:</strong> 1 Month (2025)</motion.p>
            <motion.p variants={fadeIn}><strong>Tools:</strong> LLMs, React, Vite, Tailwind, GitHub</motion.p>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-slate-500 dark:text-slate-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Challenge Section */}
        <section className="py-20 md:py-32">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">The Challenge</h2>
            <p className="text-lg md:text-xl leading-relaxed text-slate-600 dark:text-slate-300">
              Starting with zero lines of code and a blank canvas, my goal was to learn software development through active creation, not passive study. Could I use AI as a collaborator to navigate the complex world of coding, version control, and product deployment?
            </p>
          </motion.div>
        </section>

        {/* Learning Journey Section */}
        <section className="py-20 md:py-32 relative">
          <motion.h2
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-16"
          >
            The Learning Journey
          </motion.h2>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 hidden w-0.5 bg-slate-300 md:block dark:bg-slate-700/50"></div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              className="space-y-16"
            >
              {journeySteps.map((step, index) => (
                <motion.div key={index} variants={fadeIn} className="md:grid md:grid-cols-2 md:gap-16 items-center relative">
                  <div className={`flex items-center justify-center md:order-${index % 2 === 0 ? 1 : 2}`}>
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-slate-300 bg-slate-100 shadow-sm md:mb-0 dark:border-slate-700 dark:bg-slate-900">
                      {step.icon}
                    </div>
                  </div>
                  <div className={`text-center md:text-left md:order-${index % 2 === 0 ? 2 : 1}`}>
                    <h3 className="mb-3 text-2xl font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="leading-relaxed text-slate-600 dark:text-slate-300">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* From Code to Creation */}
        <section className="py-20 md:py-32">
          <motion.h2
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-12"
          >
            From Code to Creation
          </motion.h2>
          <div className="flex justify-center">
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="show"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="group relative max-w-4xl overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100/80 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70"
            >
              <a href="https://rotogo.netlify.app/" target="_blank" rel="noopener noreferrer" className="relative z-10 block">
                <img src="https://api.microlink.io/?url=https://rotogo.netlify.app/&screenshot=true&meta=false&embed=screenshot.url" alt="Rotogo Live App Preview" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
              </a>
              {/* Gradient overlay must not block clicks */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
              <a
                href="https://rotogo.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-md bg-teal-500 px-4 py-2 font-medium text-white transition hover:bg-teal-600"
              >
                <ExternalLink size={18} /> Open Live App
              </a>
            </motion.div>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Static screenshot preview to avoid network prompts. View the live site directly{' '}
            <a
              href="https://rotogo.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-500 underline transition hover:text-teal-400 dark:text-teal-300"
            >
              here
            </a>
            .
          </p>
        </section>

        {/* Core Insights */}
        <section className="py-20 md:py-32">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-12">Core Insights</h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {keyLearnings.map((learning, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/50 dark:border-slate-700/80 dark:bg-slate-900/60"
                >
                  <div className="mb-4">{learning.icon}</div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{learning.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{learning.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Impact & Reflection */}
        <section className="py-20 md:py-32">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Impact & Reflection</h2>
            <p className="mb-8 text-lg leading-relaxed text-slate-600 md:text-xl dark:text-slate-300">
              This project was more than just building an app; it was a paradigm shift in how I approach learning. It proved that with the right tools and a collaborative mindset, anyone can transform curiosity into tangible skills and creations.
            </p>
            <blockquote className="border-l-4 border-teal-400 pl-6 text-left text-lg italic text-slate-700 dark:text-slate-300">
              “Before Rotogo, I didn’t know how to write a line of code. After Rotogo, I knew how to build and ship a product.”
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
            animate="show"
            whileInView="show"
            viewport={{ once: true }}
            className="mb-6 text-3xl font-bold text-slate-900 dark:text-white"
          >
            Explore the Project
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center gap-6 sm:flex-row"
          >
            <motion.a
              href="https://rotogo.netlify.app/"
              variants={fadeIn}
              initial="hidden"
              animate="show"
              whileInView="show"
              viewport={{ once: true }}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-teal-500 px-8 py-3 font-semibold text-white transition-colors duration-300 hover:bg-teal-600"
            >
              <ExternalLink size={20} /> View Live Site
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
