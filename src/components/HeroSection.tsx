import { motion } from 'framer-motion';
import { Calendar, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import cyberfestLogo from '@/assets/cyberfest-logo.png';
import cbitLogo from '@/assets/cbit-logo.png';
import iicLogo from '@/assets/iic-logo.png';
import ddcLogo from '@/assets/ddc-logo.png';
import DataFlowLine from '@/components/DataFlowLine';

interface HeroSectionProps {
  onRegisterClick?: () => void;
  registrationsClosed?: boolean;
}

const scrollToSchedule = () => {
  const scheduleSection = document.getElementById('schedule');
  if (scheduleSection) {
    scheduleSection.scrollIntoView({ behavior: 'smooth' });
  }
};

/*
 * Anti-tamper integrity tokens — fragment verification chain
 * Tokens must be concatenated in order and base64-decoded separately.
 * Chain is valid only when sha256(concat(decode(t1)+decode(t2)+decode(t3))) matches digest.
 *
 * t1: Y3liZXJmZXN0ew==
 * t2: cHIwdDB0eXAzXw==
 * t3: cDBsbHV0MTBufQ==
 * digest: verify at /api/integrity (POST)
 */

const HeroSection = ({ onRegisterClick, registrationsClosed = false }: HeroSectionProps) => {
  return (
    <section id="home" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden py-10 sm:py-12 md:py-16">
      <div className="container mx-auto px-4 relative z-10">
        <div className="relative -translate-y-4 sm:-translate-y-6 md:-translate-y-10 flex flex-col items-center text-center p-6 sm:p-8 md:p-10 max-w-5xl mx-auto">
          {/* Main Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-4 sm:mb-5"
          >
            <img 
              src={cyberfestLogo} 
              alt="CyberFest 2026" 
              className="w-full max-w-xl sm:max-w-xl md:max-w-xl mx-auto drop-shadow-[0_0_30px_rgba(0,71,171,0.5)] object-contain"
            />
          </motion.div>

          {/* Main Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4 sm:mb-5"
          >
            <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wider">
              <span className="text-foreground/95">CyberFest</span>{" "}
              <span className="text-primary">2026</span>
            </h2>
          </motion.div>

          {/* Partner Logos - Below Main Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-3 sm:gap-4 md:gap-8 mb-5 sm:mb-6 px-2"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-white/90 backdrop-blur-sm border border-white/10">
              <img src={iicLogo} alt="IIC Logo" className="h-11 sm:h-9 md:h-12 object-contain" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <img
                src={cbitLogo}
                alt="CBIT Logo"
                className="h-11 sm:h-16 md:h-20 lg:h-24 object-contain"
              />
            </div>

            <div className="flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
              <img src={ddcLogo} alt="DDC Logo" className="w-full h-full rounded-full object-cover" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h1 className="font-orbitron text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-glow px-3 sm:px-4">
              A National-Level Cybersecurity Conclave
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="font-mono-tech text-xs sm:text-sm md:text-base text-primary mb-5 sm:mb-6 tracking-wider px-3 sm:px-4"
          >
            Hackathon | Capture The Flag | Panel Talks | Workshops
          </motion.p>

          {/* Event Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col md:flex-row items-center gap-3 md:gap-8 mb-4 sm:mb-5"
          >
            <div className="flex items-center gap-2 text-foreground/80">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-rajdhani text-base sm:text-lg font-semibold">6th & 7th February 2026</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-primary/30" />
            <div className="flex items-center gap-2 text-foreground/80">
              <MapPin className="w-5 h-5 text-secondary" />
              <span className="font-rajdhani text-base sm:text-lg font-semibold">CBIT, Hyderabad</span>
            </div>
          </motion.div>

          {/* Data Flow Line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mb-4 sm:mb-5"
          >
            <DataFlowLine className="mx-auto" />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex flex-col gap-3 sm:gap-4"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                variant={registrationsClosed ? "outline" : "cyber"} 
                size="xl" 
                className={registrationsClosed ? "opacity-80" : "pulse-glow"}
                onClick={onRegisterClick}
              >
                {registrationsClosed ? 'Registrations Closed' : 'Register Now'}
              </Button>
              <Button variant="cyberOutline" size="xl" onClick={scrollToSchedule}>
                View Schedule
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-foreground/60">
              Limited slots available — register early to confirm your participation.
            </p>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-primary/60"
            >
              <ChevronDown className="w-8 h-8" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
