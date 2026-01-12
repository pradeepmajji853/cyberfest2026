import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Clock, Coffee, Trophy, Users, Terminal, Award, Utensils, Flag } from 'lucide-react';

interface ScheduleEvent {
  time: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'general' | 'hackathon' | 'ctf' | 'break';
}

const day1Schedule: ScheduleEvent[] = [
  { time: '09:30 – 11:00', title: 'Registration & Welcome Kit Distribution', icon: Users, type: 'general' },
  { time: '11:00 – 12:00', title: 'Inaugural Ceremony & Chief Guest Address', icon: Award, type: 'general' },
  { time: '12:00 – 01:00', title: 'Lunch Break', icon: Utensils, type: 'break' },
  { time: '01:00 – 03:00', title: 'Expert Panel Talks', icon: Users, type: 'general' },
  { time: '03:00 – 04:00', title: 'Rules & Ethics Briefing', icon: Flag, type: 'general' },
  { time: '04:30 PM', title: 'Hackathon & CTF Begins', icon: Terminal, type: 'general' },
  { time: '05:00 PM – Overnight', title: 'Hackathon (Venue-1)', icon: Terminal, type: 'hackathon' },
  { time: '05:00 PM – Overnight', title: 'CTF Challenges (Venue-2)', icon: Flag, type: 'ctf' },
];

const day2Schedule: ScheduleEvent[] = [
  { time: 'Up to 09:00 AM', title: 'Hackathon & CTF Ends', icon: Terminal, type: 'general' },
  { time: '09:00 – 10:30', title: 'Breakfast', icon: Coffee, type: 'break' },
  { time: '10:30 – 01:00', title: 'Judging Phase 1', icon: Award, type: 'general' },
  { time: '01:00 – 02:00', title: 'Lunch', icon: Utensils, type: 'break' },
  { time: '02:00 – 04:00', title: 'Final Judging', icon: Award, type: 'general' },
  { time: '04:00 – 05:00', title: 'Valedictory & Prize Distribution', icon: Trophy, type: 'general' },
];

const getTypeColor = (type: ScheduleEvent['type']) => {
  switch (type) {
    case 'hackathon':
      return 'border-l-primary bg-primary/5';
    case 'ctf':
      return 'border-l-secondary bg-secondary/5';
    case 'break':
      return 'border-l-muted-foreground bg-muted/20';
    default:
      return 'border-l-accent bg-accent/5';
  }
};

const ScheduleSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="schedule" className="relative py-24 bg-gradient-to-b from-background via-muted/5 to-background">
      <div className="container mx-auto px-4" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="font-orbitron text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 px-4">
            <span className="gradient-text">Event Schedule</span>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="font-rajdhani text-lg text-foreground/70">
            6th & 7th February 2026
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Day 1 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="cyber-card rounded-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-6 border-b border-primary/20">
              <h3 className="font-orbitron text-xl md:text-2xl font-bold flex items-center gap-3">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                Day 1 - 6th February
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {day1Schedule.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                  className={`flex gap-4 p-4 rounded-lg border-l-4 ${getTypeColor(event.type)} transition-all hover:scale-[1.02]`}
                >
                  <event.icon className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-mono-tech text-sm text-primary">{event.time}</p>
                    <p className="font-rajdhani text-base md:text-lg font-semibold">{event.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Day 2 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="cyber-card rounded-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-secondary/20 to-primary/20 p-6 border-b border-secondary/20">
              <h3 className="font-orbitron text-xl md:text-2xl font-bold flex items-center gap-3">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
                Day 2 - 7th February
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {day2Schedule.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                  className={`flex gap-4 p-4 rounded-lg border-l-4 ${getTypeColor(event.type)} transition-all hover:scale-[1.02]`}
                >
                  <event.icon className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-mono-tech text-sm text-secondary">{event.time}</p>
                    <p className="font-rajdhani text-base md:text-lg font-semibold">{event.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-6 mt-12"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/20 border-l-4 border-primary" />
            <span className="font-rajdhani text-sm text-foreground/70">Hackathon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-secondary/20 border-l-4 border-secondary" />
            <span className="font-rajdhani text-sm text-foreground/70">CTF</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-accent/20 border-l-4 border-accent" />
            <span className="font-rajdhani text-sm text-foreground/70">General</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/20 border-l-4 border-muted-foreground" />
            <span className="font-rajdhani text-sm text-foreground/70">Break</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ScheduleSection;
