import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const HackathonSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="hackathon" className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-4 px-4 py-2 rounded-full border border-primary/30 bg-primary/10">
            <span className="font-mono-tech text-sm text-primary uppercase tracking-wider">Track 1</span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 px-4">
            <span className="gradient-text">Hackathon</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
        </motion.div>

        {/* Theme Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="cyber-card rounded-2xl p-8 mb-12 text-center max-w-3xl mx-auto neon-border"
        >
          <h3 className="font-orbitron text-xl md:text-2xl font-bold mb-2 text-foreground">
            Theme
          </h3>
          <p className="font-orbitron text-lg sm:text-2xl md:text-3xl font-bold gradient-text px-2">
            AI in Cybersecurity & Blockchain Security
          </p>
        </motion.div>

        {/* Overview + Pricing/Inclusions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch"
        >
          <div className="cyber-card rounded-xl p-6 neon-border h-full">
            <h3 className="font-orbitron text-xl font-bold text-primary mb-4">What is a Hackathon?</h3>
            <div className="space-y-4 font-rajdhani text-foreground/80 leading-relaxed">
              <p>
                A hackathon is an intensive, time‑bound innovation sprint where teams collaborate to
                design and build impactful cybersecurity solutions. You’ll ideate, prototype, and present
                your solution within the event timeframe.
              </p>
              <p>
                Expect a fast‑paced, mentor‑supported environment with problem statements designed to
                challenge creativity, security thinking, and execution. Teams iterate quickly, validate
                ideas, and deliver working demos that solve real‑world cyber challenges.
              </p>
              <p>
                Whether you’re a beginner or a seasoned builder, it’s a chance to learn, network, and
                ship something meaningful under pressure—exactly like real security teams do.
              </p>
            </div>
          </div>

          <div className="space-y-6 h-full">
            <div className="cyber-card rounded-xl p-6 neon-border">
              <h3 className="font-orbitron text-xl font-bold text-primary mb-4">Hackathon Registration</h3>
              <ul className="space-y-2 text-foreground/80 font-rajdhani">
                <li className="flex items-center justify-between border-b border-primary/20 pb-2">
                  <span>Team of 3</span>
                  <span className="font-orbitron text-primary">₹900</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Team of 4</span>
                  <span className="font-orbitron text-primary">₹1200</span>
                </li>
              </ul>
            </div>

            <div className="cyber-card rounded-xl p-6 neon-border">
              <h3 className="font-orbitron text-xl font-bold text-primary mb-4">What’s Included</h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-foreground/80 font-rajdhani">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Food
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Goodies
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Accommodation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Hospitality
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Curated musical experiences
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HackathonSection;
