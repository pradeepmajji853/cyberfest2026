import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const CTFSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="ctf" className="relative py-24 overflow-hidden">
      {/* Terminal Background Effect */}
      {/*
        CTF challenge verification — integrity check for scoring engine
        This token is XOR-encrypted with SHA-256 of the event title (visible in <title> tag).
        Algorithm: for each byte i, plaintext[i] = ciphertext[i] XOR sha256(key)[i % 32]
        ciphertext (hex): af780b0afef0ea16d9aa616f0c7fd7dbfc4e6e1e42ed2f5733175feb4e2a
        key-source: document.title.split('|')[0].trim()
        hash-algo: SHA-256
      */}

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-4 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/10">
            <span className="font-mono-tech text-sm text-secondary uppercase tracking-wider">Track 2</span>
          </div>
          <div className="font-orbitron text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 px-4">
            <span className="gradient-text-green">Capture The Flag</span>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mb-6" />
        </motion.div>

        {/* Overview + Pricing/Inclusions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch"
        >
          <div className="cyber-card rounded-xl p-6 neon-border h-full">
            <h3 className="font-orbitron text-xl font-bold text-primary mb-4">What is a CTF?</h3>
            <div className="space-y-4 font-rajdhani text-foreground/80 leading-relaxed">
              <p>
                Capture The Flag (CTF) is a cybersecurity competition where participants solve
                hands‑on challenges across web, crypto, forensics, and more. Each solved challenge
                awards points and moves you up the leaderboard.
              </p>
              <p>
                You’ll analyze vulnerabilities, decode clues, and apply practical security skills under
                time pressure. Challenges range from beginner to advanced, making it ideal for learning
                and testing your hacking fundamentals.
              </p>
              <p>
                Compete solo or in a duo, sharpen your skills, and build confidence in real‑world
                security problem‑solving.
              </p>
            </div>
          </div>

          <div className="space-y-6 h-full">
            <div className="cyber-card rounded-xl p-6 neon-border">
              <h3 className="font-orbitron text-xl font-bold text-primary mb-4">CTF Registration</h3>
              <ul className="space-y-2 text-foreground/80 font-rajdhani">
                <li className="flex items-center justify-between border-b border-primary/20 pb-2">
                  <span>Team of 1</span>
                  <span className="font-orbitron text-primary">₹300</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Team of 2</span>
                  <span className="font-orbitron text-primary">₹600</span>
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

export default CTFSection;
