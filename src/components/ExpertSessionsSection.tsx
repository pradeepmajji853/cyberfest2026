import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Laptop, ShieldCheck, Bug } from 'lucide-react';

const ExpertSessionsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-4" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-text">Hands-on Hacking Sessions</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="font-rajdhani text-lg text-foreground/70 max-w-2xl mx-auto">
            Three practical, industry-led sessions by ethical hackers
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Session 1 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="cyber-card rounded-2xl p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <Laptop className="w-8 h-8 text-primary icon-hover" />
              </div>
              <h3 className="font-orbitron text-2xl font-bold">Web App Exploitation Lab</h3>
            </div>
            <p className="font-rajdhani text-foreground/70 leading-relaxed">
              Hands‑on lab with real‑world vulnerabilities: recon, exploitation, and secure fixes.
              Led by industry ethical hackers with live walkthroughs and Q&A.
            </p>
          </motion.div>

          {/* Session 2 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="cyber-card rounded-2xl p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <Bug className="w-8 h-8 text-primary icon-hover" />
              </div>
              <h3 className="font-orbitron text-2xl font-bold">Offensive Security Toolkit</h3>
            </div>
            <p className="font-rajdhani text-foreground/70 leading-relaxed">
              Learn practical techniques for vulnerability discovery, enumeration, and exploit
              chaining—delivered by certified ethical hackers from the industry.
            </p>
          </motion.div>

          {/* Session 3 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="cyber-card rounded-2xl p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <ShieldCheck className="w-8 h-8 text-primary icon-hover" />
              </div>
              <h3 className="font-orbitron text-2xl font-bold">Incident Response Drill</h3>
            </div>
            <p className="font-rajdhani text-foreground/70 leading-relaxed">
              A guided blue‑team vs red‑team style exercise covering detection, triage, and
              mitigation—built around real attack scenarios.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ExpertSessionsSection;
