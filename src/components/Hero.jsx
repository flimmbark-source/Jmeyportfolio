import { motion } from 'framer-motion';

const textVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2 + i * 0.15,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

const ctaHover = {
  scale: 1.03,
  y: -2,
  boxShadow: '0px 18px 45px rgba(7, 3, 28, 0.45)'
};

const AwardBadge = ({ title, subtitle }) => (
  <div className="text-left">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{title}</p>
    <p className="text-sm font-medium text-white">{subtitle}</p>
  </div>
);

const awardsCopy = [
  { title: 'Fast Company', subtitle: 'Innovation by Design 2024' },
  { title: 'Awwwards', subtitle: 'Site of the Day' }
];

const DEFAULT_VIDEO = 'https://cdn.coverr.co/videos/coverr-morning-sunlight-1318/1080p.mp4';

const Hero = ({ descriptor, awardsLink, videoSrc = DEFAULT_VIDEO, videoPoster }) => {
  return (
    <motion.section
      id="top"
      className="relative mb-28 flex min-h-screen flex-col overflow-hidden rounded-[2.75rem] bg-slate-950 px-6 py-16 text-white shadow-[0_30px_120px_rgba(6,3,19,0.55)] sm:px-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={videoSrc}
        poster={videoPoster}
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-950/80 to-[#05020b]/95" />

      <div className="relative z-10 flex flex-1 flex-col justify-center">
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70"
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          Product Designer & Researcher
        </motion.p>

        <motion.h1
          className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl"
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          UNIQUE
          <br />
          BRAND
          <br />
          EXPERIENCE
        </motion.h1>

        <motion.p
          className="mt-6 max-w-2xl text-lg text-white/80 sm:text-xl"
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          {descriptor}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap gap-4"
          variants={textVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <motion.a
            href="#contact"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 px-7 py-3 text-sm font-semibold uppercase tracking-wide text-white"
            whileHover={ctaHover}
            whileFocus={ctaHover}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            Start a project
          </motion.a>
          <motion.a
            href="#projects"
            className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur"
            whileHover={{ scale: 1.02, y: -2 }}
            whileFocus={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            All projects
          </motion.a>
        </motion.div>
      </div>

      <motion.a
        href={awardsLink}
        className="group absolute bottom-6 right-6 inline-flex min-w-[220px] flex-col gap-4 rounded-3xl border border-white/20 bg-white/10 px-6 py-5 text-white shadow-2xl backdrop-blur"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -8, scale: 1.02 }}
        whileFocus={{ y: -8, scale: 1.02 }}
      >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
          <span>Awards</span>
          <span>↗</span>
        </div>
        <div className="space-y-3 text-left">
          {awardsCopy.map((award) => (
            <AwardBadge key={award.subtitle} {...award} />
          ))}
        </div>
      </motion.a>
    </motion.section>
  );
};

export default Hero;
