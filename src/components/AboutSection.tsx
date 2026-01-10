import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Users, Clock, Trophy } from 'lucide-react';

const stats = [
  { icon: Clock, value: '24-36', label: 'Hours Non-Stop', color: 'text-primary' },
  { icon: Users, value: '400+', label: 'Participants Expected', color: 'text-secondary' },
  { icon: Trophy, value: '2', label: 'Parallel Tracks', color: 'text-accent' },
  { icon: Shield, value: 'National', label: 'Level Event', color: 'text-primary' },
];

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="about" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 hex-pattern opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-text">About The Event</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Description */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="cyber-card rounded-xl p-8">
              <h3 className="font-orbitron text-2xl font-bold text-primary mb-4">
                CYBERFEST 2026
              </h3>
              <p className="font-rajdhani text-lg text-foreground/80 leading-relaxed mb-4">
                Powered by <span className="text-secondary font-semibold">Digital Defence Club (DDC)</span>, 
                CyberFest 2026 is a premier national-level cybersecurity conclave bringing together 
                the brightest minds in cybersecurity from across India.
              </p>
              <p className="font-rajdhani text-lg text-foreground/80 leading-relaxed">
                Experience an intense 24-36 hour continuous event featuring parallel tracks of 
                <span className="text-primary font-semibold"> Hackathon</span> and 
                <span className="text-secondary font-semibold"> Capture The Flag (CTF)</span> challenges, 
                complemented by expert panel talks, workshops, and networking opportunities.
              </p>
            </div>

            <div className="cyber-card rounded-lg p-4 text-center max-w-md mx-auto">
              <span className="font-mono-tech text-sm text-primary">Organized By</span>
              <p className="font-orbitron font-bold mt-1">Digital Defence Club (DDC), CBIT</p>
            </div>
          </motion.div>

          {/* Right: Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="cyber-card card-3d rounded-xl p-6 text-center group"
              >
                <stat.icon className={`w-10 h-10 ${stat.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                <div className={`font-orbitron text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <p className="font-rajdhani text-sm text-foreground/60 uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
