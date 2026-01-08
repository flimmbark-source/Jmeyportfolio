import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Github, ExternalLink, Brain, Languages, Accessibility, TrendingUp, Database, Zap, BookOpen, Award } from 'lucide-react';

export default function LetterRiverCaseStudy() {
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
    {
      icon: <BookOpen className="h-8 w-8 text-blue-500 dark:text-blue-300" />,
      title: "The Problem: Learning a New Alphabet",
      description: "While learning Hebrew, I found existing apps jumped too quickly into phrases without solidifying the alphabet. I needed a tool that would let me master the fundamentals through active practice, not passive study."
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-500 dark:text-purple-300" />,
      title: "Implementing Spaced Repetition",
      description: "I researched educational psychology and implemented the SM-2 algorithm—the same system used by apps like Anki. This was my first deep dive into learning science and algorithmic thinking applied to education."
    },
    {
      icon: <Zap className="h-8 w-8 text-amber-500 dark:text-amber-300" />,
      title: "Building the Game Engine",
      description: "The interactive 'river' gameplay required HTML5 Canvas and a custom game loop outside React's component lifecycle. I learned to balance performance with smooth animations while handling complex drag-and-drop interactions."
    },
    {
      icon: <Database className="h-8 w-8 text-teal-500 dark:text-teal-300" />,
      title: "Progressive Web App Architecture",
      description: "To make Letter River work offline and persist user progress, I implemented IndexedDB storage and service workers. This transformed the app from a simple webpage into an installable, offline-capable learning platform."
    },
    {
      icon: <Languages className="h-8 w-8 text-indigo-500 dark:text-indigo-300" />,
      title: "Scaling to Multiple Languages",
      description: "What started as a Hebrew learning tool evolved into a platform for 12 different writing systems. I designed a modular language pack system that makes adding new scripts as simple as creating a config file."
    },
    {
      icon: <Accessibility className="h-8 w-8 text-rose-500 dark:text-rose-300" />,
      title: "Inclusive Design & Accessibility",
      description: "I researched accessibility best practices and implemented high contrast modes, reduced motion options, adjustable speed controls, and dyslexia-friendly fonts to ensure anyone could learn effectively."
    }
  ];

  const technicalHighlights = [
    {
      icon: <Brain size={32} className="text-purple-500 dark:text-purple-300" />,
      title: "Adaptive Learning Algorithm",
      text: "Custom SM-2 spaced repetition system that schedules review based on performance—letters you struggle with appear more frequently until mastered."
    },
    {
      icon: <TrendingUp size={32} className="text-teal-500 dark:text-teal-300" />,
      title: "Modern Tech Stack",
      text: "React 18 with Vite bundling, Tailwind CSS for responsive design, and React Context for complex state management across the application."
    },
    {
      icon: <Zap size={32} className="text-amber-500 dark:text-amber-300" />,
      title: "Offline-First Architecture",
      text: "Progressive Web App with IndexedDB persistence and service worker caching—works completely offline after initial load."
    }
  ];

  const skillsLearned = [
    "Educational psychology and learning science (spaced repetition, active recall)",
    "Advanced React patterns (Context, custom hooks, imperative DOM manipulation)",
    "Game development fundamentals (Canvas API, animation loops, collision detection)",
    "Browser storage APIs (IndexedDB, service workers, PWA manifest)",
    "Accessibility standards and inclusive design principles",
    "Internationalization and multi-language content management",
    "Algorithm implementation (SM-2 spacing algorithm)",
    "User experience design for educational software"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 text-slate-900 transition-colors duration-500 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <motion.div style={{ width: progressBarWidth }} className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 z-50" />

      {/* Hero Section */}
      <header className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 via-slate-200 to-slate-100 px-6 text-center dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="relative z-10 max-w-4xl">
          <h1 className="mb-4 bg-gradient-to-b from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-5xl font-extrabold text-transparent md:text-7xl dark:from-white dark:via-slate-200 dark:to-slate-400">Letter River: Scaling Learning Through Code</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-700 md:text-xl dark:text-slate-200">Building upon Rotogo's foundation to create a comprehensive, accessible language-learning platform with spaced repetition, multi-language support, and Progressive Web App architecture.</p>
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200">
            <motion.p variants={fadeIn}><strong>Role:</strong> Full-Stack Developer & Designer</motion.p>
            <motion.p variants={fadeIn}><strong>Timeline:</strong> Mid-Late 2025</motion.p>
            <motion.p variants={fadeIn}><strong>Stack:</strong> React, Vite, Tailwind, Canvas, IndexedDB</motion.p>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-slate-700 dark:text-slate-300"
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
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">The Challenge</h2>
            <p className="text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-200">
              After successfully building and shipping Rotogo, I wanted to tackle a real problem: learning the Hebrew alphabet. Existing apps rushed into phrases before solidifying the fundamentals. Could I build a better learning tool—one backed by educational science, accessible to everyone, and scalable to multiple languages? This wasn't just about building another app; it was about expanding my skills to include learning algorithms, accessibility standards, and production-ready architecture.
            </p>
          </motion.div>
        </section>

        {/* Development Journey Section */}
        <section className="py-20 md:py-32 relative">
          <motion.h2
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-16"
          >
            Development Journey
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
                    <p className="leading-relaxed text-slate-700 dark:text-slate-200">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Live App Preview */}
        <section className="py-20 md:py-32">
          <motion.h2
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-12"
          >
            The Learning Platform
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
              <a
                href="https://letterriver.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
              >
                <img src="https://api.microlink.io/?url=https://letterriver.netlify.app/&screenshot=true&meta=false&embed=screenshot.url" alt="Letter River Live App Preview" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
              </a>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
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
            Progressive Web App – installable on mobile and desktop. View live at{' '}
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

        {/* Technical Highlights */}
        <section className="py-20 md:py-32">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-12">Technical Highlights</h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {technicalHighlights.map((highlight, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  className="rounded-2xl border border-slate-200/70 bg-slate-100/80 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 dark:border-slate-700/80 dark:bg-slate-900/60"
                >
                  <div className="mb-4">{highlight.icon}</div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{highlight.title}</h3>
                  <p className="text-slate-700 dark:text-slate-200">{highlight.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Skills Learned */}
        <section className="py-20 md:py-32 bg-slate-100/50 dark:bg-slate-900/30 rounded-3xl">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-8">Skills Expanded from Rotogo</h2>
            <p className="text-center text-lg text-slate-700 dark:text-slate-200 mb-12">
              Letter River represents a significant evolution in technical capabilities and software architecture:
            </p>
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid md:grid-cols-2 gap-4"
            >
              {skillsLearned.map((skill, i) => (
                <motion.li
                  key={i}
                  variants={fadeIn}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <Award className="h-5 w-5 text-blue-500 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-200">{skill}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </section>

        {/* Key Features */}
        <section className="py-20 md:py-32">
          <motion.h2
            variants={fadeIn}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-12"
          >
            Feature Showcase
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            <motion.div variants={fadeIn} className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <Brain className="h-8 w-8 text-purple-500 dark:text-purple-300" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Spaced Repetition System</h3>
              </div>
              <p className="text-slate-700 dark:text-slate-200">
                Implements the SM-2 algorithm used by Anki. Letters you struggle with appear more frequently, while mastered ones review at increasing intervals—scientifically optimized for long-term retention.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <Languages className="h-8 w-8 text-indigo-500 dark:text-indigo-300" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">12 Language Support</h3>
              </div>
              <p className="text-slate-700 dark:text-slate-200">
                Modular language pack system supporting Hebrew, Arabic, Russian, Japanese hiragana, and more. Adding new writing systems is as simple as creating a configuration file.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <Accessibility className="h-8 w-8 text-rose-500 dark:text-rose-300" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Accessibility First</h3>
              </div>
              <p className="text-slate-700 dark:text-slate-200">
                High contrast mode, reduced motion, adjustable game speed, click-based controls, dyslexia-friendly fonts, and customizable typefaces ensure inclusive learning for all users.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <Database className="h-8 w-8 text-teal-500 dark:text-teal-300" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Offline-Capable PWA</h3>
              </div>
              <p className="text-slate-700 dark:text-slate-200">
                Progressive Web App with IndexedDB persistence and service worker caching. Install on any device and use completely offline—progress syncs automatically when back online.
              </p>
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
            <p className="mb-8 text-lg leading-relaxed text-slate-700 md:text-xl dark:text-slate-200">
              Letter River represents the evolution from learning to code to building production-ready software. By integrating educational science, accessibility standards, and modern web technologies, I created a platform that not only solved my own learning challenge but could scale to help others master new writing systems worldwide.
            </p>
            <blockquote className="border-l-4 border-blue-400 pl-6 text-left text-lg italic text-slate-800 dark:text-slate-200">
              "Rotogo taught me how to code. Letter River taught me how to architect, optimize, and ship software that matters."
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
            Explore Letter River
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
              href="https://letterriver.netlify.app/"
              variants={fadeIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-3 font-semibold text-white transition-colors duration-300 hover:bg-blue-600"
            >
              <ExternalLink size={20} /> Try Live App
            </motion.a>
            <motion.a
              href="https://github.com/flimmbark-source/HebrewLetterRiver"
              variants={fadeIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-8 py-3 font-semibold text-slate-900 transition-colors duration-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Github size={20} /> View Source Code
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
