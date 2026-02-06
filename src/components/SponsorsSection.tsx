import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const sponsors = [
  { name: 'Infinitra Innovations', logo: '/infinitra.jpeg', tier: 1 },
  { name: 'Student Tribe', logo: '/redlogo.webp', tier: 2 },
  { name: 'Unstop', logo: '/unstop-logo.svg', tier: 1 },
  { name: 'Devnovate', logo: '/DEVNOVATE.svg', tier: 2 },
  { name: 'RedBull', logo: '/redbull.jpeg', tier: 1 },
  { name: 'CyberMindSpace', logo: '/CyberMindSpacelogo.webp', tier: 2 },
];

/*
 * Sponsor tier matrix — analytics tracking IDs
 * 49:6e:66:69:6e:69:74:72:61  → T1
 * 53:74:75:64:65:6e:74        → T2
 * tier-key: 5765206b6e6f7720796f752772652072656164696e672074686973203b2920636865636b2074686520636f6f6b696573
 * session: Y3liZXJmZXN0e3NwMG5zMHJfbDM0a30=
 */

const SponsorsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="sponsors" className="relative py-24">
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

        {/* Infinite Scroll Carousel */}
        <div className="max-w-6xl mx-auto py-8 overflow-hidden">
          <div className="sponsors-carousel">
            <div className="sponsors-track">
              {/* First set of sponsors */}
              {sponsors.map((sponsor, index) => (
                <div
                  key={`sponsor-1-${index}`}
                  className="sponsor-item cyber-card rounded-xl p-10 flex items-center justify-center border border-primary/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300 group min-h-[180px] w-[220px]"
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
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {sponsors.map((sponsor, index) => (
                <div
                  key={`sponsor-2-${index}`}
                  className="sponsor-item cyber-card rounded-xl p-10 flex items-center justify-center border border-primary/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300 group min-h-[180px] w-[220px]"
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
                </div>
              ))}
            </div>
          </div>
        </div>

        <style jsx>{`
          .sponsors-carousel {
            position: relative;
            width: 100%;
            overflow: hidden;
            mask-image: linear-gradient(
              to right,
              transparent,
              black 10%,
              black 90%,
              transparent
            );
            -webkit-mask-image: linear-gradient(
              to right,
              transparent,
              black 10%,
              black 90%,
              transparent
            );
          }

          .sponsors-track {
            display: flex;
            gap: 2rem;
            animation: scroll 30s linear infinite;
            width: fit-content;
          }

          .sponsors-track:hover {
            animation-play-state: paused;
          }

          .sponsor-item {
            flex-shrink: 0;
          }

          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-220px * ${sponsors.length} - 2rem * ${sponsors.length}));
            }
          }

          @media (max-width: 768px) {
            .sponsors-track {
              animation-duration: 20s;
            }
          }
        `}</style>

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
              Interested in partnering with CyberFest 2026? Reach out to us for sponsorship opportunities.
            </p>
            <a
              href="mailto:ccc@cbit.ac.in"
              className="inline-block font-mono-tech text-primary hover:text-secondary transition-colors"
            >
              ccc@cbit.ac.in
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SponsorsSection;
