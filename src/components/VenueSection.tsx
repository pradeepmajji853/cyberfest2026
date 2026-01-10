import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MapPin, Building, Monitor, Cpu } from 'lucide-react';

const venues = [
  { name: 'Assembly Hall', icon: Building, description: 'Main ceremonies & panel talks' },
  { name: 'TPO Labs', icon: Monitor, description: 'Hackathon venue' },
  { name: 'IT Labs', icon: Cpu, description: 'CTF challenges' },
];

const VenueSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="venue" className="relative py-24 overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 hex-pattern opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-text">Venue</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Venue Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Main Venue Card */}
            <div className="cyber-card rounded-2xl p-8 neon-border">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-orbitron text-2xl font-bold mb-2">
                    Chaitanya Bharathi Institute of Technology
                  </h3>
                  <p className="font-rajdhani text-lg text-foreground/70">
                    Gandipet, Hyderabad, Telangana 500075
                  </p>
                </div>
              </div>

              {/* Venue List */}
              <div className="grid gap-4">
                {venues.map((venue, index) => (
                  <motion.div
                    key={venue.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <venue.icon className="w-6 h-6 text-primary" />
                    <div>
                      <h4 className="font-rajdhani text-lg font-semibold">{venue.name}</h4>
                      <p className="font-rajdhani text-sm text-foreground/60">{venue.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="cyber-card rounded-2xl overflow-hidden h-[400px] lg:h-full min-h-[400px]"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3808.418602016775!2d78.3168619!3d17.3919735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb94eba8ad7c87%3A0xb78f51ed556f7cc5!2sChaitanya%20Bharathi%20Institute%20of%20Technology!5e0!3m2!1sen!2sin!4v1704860000000"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="CBIT Location"
            />


          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VenueSection;
