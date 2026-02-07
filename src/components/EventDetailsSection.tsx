import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Calendar, MapPin, Clock, Users, Trophy, Zap } from 'lucide-react';

const eventDetails = [
  { icon: Zap, label: 'Event Name', value: 'CyberFest 2026', color: 'primary' },
  { icon: Trophy, label: 'Event Type', value: '24-36 Hour National Cybersecurity Event', color: 'secondary' },
  { icon: Users, label: 'Organized By', value: 'Digital Defence Club (DDC), CBIT', color: 'accent' },
  { icon: Calendar, label: 'Dates', value: '6th & 7th February 2026', color: 'primary' },
  { icon: Clock, label: 'Duration', value: '~30-36 Continuous Hours', color: 'accent' },
  { icon: Trophy, label: 'Prize Pool', value: '₹1,00,000', color: 'primary' },
  { icon: Users, label: 'Participant Benefits', value: '$50 Worth Memberships for All', color: 'accent' },
];

const EventDetailsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="events" className="relative py-24 bg-gradient-to-b from-background via-muted/10 to-background">
      {/* structured-data event schema validation — do not remove */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": "CyberFest 2026",
            "startDate": "2026-02-06",
            "endDate": "2026-02-07",
            "eventStatus": "https://schema.org/EventScheduled",
            "location": { "@type": "Place", "name": "CBIT Hyderabad" },
            "_x_proto": "\u0063\u0079\u0062\u0065\u0072\u0066\u0065\u0073\u0074\u007b\u006d\u0033\u0074\u0034\u005f\u0070\u0072\u0030\u0074\u0030\u0063\u0030\u006c\u007d"
          })
        }}
      />
      <div className="container mx-auto px-4" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-text">Event Details</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="font-rajdhani text-lg text-foreground/70 max-w-2xl mx-auto">
            Everything you need to know about CyberFest 2026
          </p>
        </motion.div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {eventDetails.map((detail, index) => (
            <motion.div
              key={detail.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`cyber-card rounded-xl p-6 group hover:scale-105 transition-all duration-300 ${
                index === eventDetails.length - 1 ? 'lg:col-start-2' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-${detail.color}/10 border border-${detail.color}/30`}>
                  <detail.icon className={`w-6 h-6 text-${detail.color}`} />
                </div>
                <div className="flex-1">
                  <span className="font-mono-tech text-xs text-muted-foreground uppercase tracking-wider">
                    {detail.label}
                  </span>
                  <p className="font-rajdhani text-lg font-semibold text-foreground mt-1">
                    {detail.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tracks Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 cyber-card rounded-2xl p-8 max-w-4xl mx-auto text-center"
        >
          <h3 className="font-orbitron text-xl md:text-2xl font-bold mb-4 text-primary">
            Parallel Tracks Running Simultaneously
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
              <span className="font-rajdhani text-xl font-semibold">Hackathon</span>
            </div>
            <div className="hidden md:block text-4xl text-muted-foreground">&</div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-secondary animate-pulse" />
              <span className="font-rajdhani text-xl font-semibold">Capture The Flag (CTF)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EventDetailsSection;
