import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Globe, Lock, Network, Binary, Search, Eye, Skull } from 'lucide-react';

const ctfThemes = [
  { icon: Globe, title: 'Web Security', color: 'primary' },
  { icon: Lock, title: 'Cryptography', color: 'secondary' },
  { icon: Network, title: 'Network Security', color: 'accent' },
  { icon: Binary, title: 'Reverse Engineering', color: 'primary' },
  { icon: Search, title: 'Digital Forensics', color: 'secondary' },
  { icon: Eye, title: 'OSINT', color: 'accent' },
  { icon: Skull, title: 'Real-world Attack Simulations', color: 'primary' },
  { icon: Binary, title: 'AI Hacking', color: 'secondary' },
];

const CTFSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="ctf" className="relative py-24 bg-gradient-to-b from-background via-muted/5 to-background overflow-hidden">
      {/* Terminal Background Effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="font-mono-tech text-[8px] leading-tight text-secondary overflow-hidden h-full">
          {Array(50).fill('>>> SCANNING TARGETS... VULNERABILITY DETECTED... EXPLOITING... ACCESS GRANTED... ').join('')}
        </div>
      </div>

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

        {/* Terminal Style Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="cyber-card rounded-xl overflow-hidden neon-border-green">
            {/* Terminal Header */}
            <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b border-secondary/20">
              <div className="w-3 h-3 rounded-full bg-destructive/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-secondary/70" />
              <span className="ml-4 font-mono-tech text-sm text-muted-foreground">ctf_challenges.sh</span>
            </div>
            
            {/* Terminal Content */}
            <div className="p-4 md:p-6 font-mono-tech text-xs md:text-sm">
              <p className="text-secondary mb-2">$ cat /challenges/themes.txt</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {ctfThemes.map((theme, index) => (
                  <motion.div
                    key={theme.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <theme.icon className={`w-5 h-5 text-${theme.color} icon-hover transition-transform`} />
                    <span className="text-foreground/90 group-hover:text-foreground transition-colors">
                      {theme.title}
                    </span>
                  </motion.div>
                ))}
              </div>
              <p className="text-secondary mt-6 terminal-cursor">$ ./start_ctf --mode=competitive</p>
            </div>
          </div>
        </motion.div>

        {/* Scoreboard Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="cyber-card rounded-xl p-8 max-w-2xl mx-auto text-center"
        >
          <h3 className="font-orbitron text-xl font-bold mb-4 text-secondary">
            Live Scoreboard
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((rank) => (
              <div
                key={rank}
                className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-lg bg-muted/30 border border-secondary/10 gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-orbitron font-bold ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-600'}`}>
                    #{rank}
                  </span>
                  <span className="font-mono-tech text-sm md:text-base text-foreground/70">Team_{rank}_Placeholder</span>
                </div>
                <span className="font-orbitron text-secondary">{1500 - (rank - 1) * 200} pts</span>
              </div>
            ))}
          </div>
          <p className="font-rajdhani text-sm text-muted-foreground mt-4">
            * Live scoreboard will be activated during the event
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTFSection;
