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
  { time: '11:00 – 12:00', title: 'Inaugural Ceremony & Chief Guest Addressing', icon: Award, type: 'general' },
  { time: '12:00 – 01:00', title: 'Lunch Break', icon: Utensils, type: 'break' },
  { time: '01:00 – 03:00', title: 'Expert Panel Talks', icon: Users, type: 'general' },
  { time: '03:00 – 04:00', title: 'Rules & Ethics Briefing', icon: Flag, type: 'general' },
  { time: '04:30 PM', title: 'Hackathon & CTF Begins', icon: Terminal, type: 'general' },
  { time: '05:00 PM – Overnight', title: 'Hackathon (Venue-1)', icon: Terminal, type: 'hackathon' },
  { time: '05:00 PM – Overnight', title: 'CTF Challenges (Venue-2)', icon: Flag, type: 'ctf' },
  { time: '09:00 PM', title: 'Dinner', icon: Utensils, type: 'break' },
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
      return 'border-primary/60 bg-primary/10';
    case 'ctf':
      return 'border-secondary/60 bg-secondary/10';
    case 'break':
      return 'border-foreground/20 bg-foreground/5';
    default:
      return 'border-primary/40 bg-primary/5';
  }
};

type TimelineItem =
  | { kind: 'day'; label: string }
  | { kind: 'event'; event: ScheduleEvent };

const timelineItems: TimelineItem[] = [
  { kind: 'day', label: 'Day 1' },
  ...day1Schedule.map((event) => ({ kind: 'event', event } as const)),
  { kind: 'day', label: 'Day 2' },
  ...day2Schedule.map((event) => ({ kind: 'event', event } as const)),
];

const ScheduleSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="schedule" className="relative py-24">
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

        <div className="relative max-w-6xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/40" />
          <div className="space-y-10">
            {timelineItems.map((item, index) => {
              if (item.kind === 'day') {
                return (
                  <motion.div
                    key={`${item.label}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.1 + index * 0.03 }}
                    className="relative flex items-center justify-center"
                  >
                    <div className="z-10 flex items-center justify-center w-16 h-16 rounded-full bg-background border-2 border-primary text-primary font-orbitron text-sm shadow-[0_0_20px_rgba(0,71,171,0.35)]">
                      {item.label}
                    </div>
                  </motion.div>
                );
              }

              const eventIndex = timelineItems.slice(0, index).filter((i) => i.kind === 'event').length;
              const isLeft = eventIndex % 2 === 0;
              return (
                <motion.div
                  key={`${item.event.title}-${index}`}
                  initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + eventIndex * 0.04 }}
                  className={`relative flex items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                >
                  <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_rgba(0,71,171,0.7)]" />
                  <div
                    className={`w-full md:w-[46%] cyber-card rounded-2xl border ${getTypeColor(item.event.type)} px-6 py-5 shadow-[0_0_30px_rgba(0,71,171,0.2)]`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 border border-primary/40">
                        <item.event.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="inline-flex items-center rounded-md bg-primary/20 px-3 py-1 font-mono-tech text-xs text-primary">
                          {item.event.time}
                        </span>
                        <p className="mt-2 font-rajdhani text-base md:text-lg font-semibold text-foreground/90">
                          {item.event.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScheduleSection;
