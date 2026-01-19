import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import Marquee from './Marquee';


const sponsors = [
  { name: 'Infinitra Innovations', logo: '/infinitra.jpeg' },
  { name: 'Student Tribe', logo: '/redlogo.webp' },
  { name: 'Unstop', logo: '/unstop-logo.svg' },
  { name: 'Devnovate', logo: '/DEVNOVATE.svg' },
  { name: 'Cyber Mindspace', logo: '/redbull.jpeg' },
];

const SponsorsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="sponsors" className="relative py-24 bg-gradient-to-b from-background via-muted/5 to-background">
      <div className="container mx-auto px-4" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-text">Sponsors & Partners</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="font-rajdhani text-lg text-foreground/70 max-w-2xl mx-auto">
            Partnering with industry leaders to bring you the best cybersecurity experience
          </p>
        </motion.div>

        {/* Animated Sponsors Marquee */}
        <div className="max-w-6xl mx-auto py-8">
          <Marquee speed={30} pauseOnHover={true}>
            {sponsors.map((sponsor) => (
              <motion.div
                key={sponsor.name}
                className="cyber-card rounded-xl p-10 flex items-center justify-center border border-primary/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300 group min-h-[180px] w-[220px] mx-2"
              >
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-3 rounded-lg bg-muted/30 flex items-center justify-center border border-dashed border-muted-foreground/30 group-hover:border-primary/50 transition-colors">
                    {sponsor.logo ? (
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="max-w-full max-h-full object-contain p-0"
                      />
                    ) : (
                      <span className="font-mono-tech text-xs text-muted-foreground text-center">LOGO</span>
                    )}
                  </div>
                  <p className="font-rajdhani text-sm text-foreground/60">{sponsor.name}</p>
                </div>
              </motion.div>
            ))}
          </Marquee>
        </div>

        {/* Become a Sponsor CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="cyber-card rounded-2xl p-8 max-w-2xl mx-auto neon-border">
            <h3 className="font-orbitron text-xl font-bold mb-4 text-primary">
              Become a Sponsor
            </h3>
            <p className="font-rajdhani text-foreground/70 mb-6">
              Interested in partnering with CyberFest 2K26? Reach out to us for sponsorship opportunities.
            </p>
            <a
              href="mailto:ddc@cbit.ac.in"
              className="inline-block font-mono-tech text-primary hover:text-secondary transition-colors"
            >
              ddc@cbit.ac.in
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SponsorsSection;
