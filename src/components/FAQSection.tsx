import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What is CyberFest 2026?',
    answer: 'CyberFest 2026 is a national-level cybersecurity conclave organized by the Digital Defence Club (DDC) at CBIT. It features a 36-hour continuous event with parallel tracks of Hackathon and Capture The Flag (CTF) challenges, along with expert panel talks, workshops, and networking opportunities.',
  },
  {
    question: 'When and where is the event?',
    answer: 'CyberFest 2026 will be held on 6-7 February 2026 at Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad.',
  },
  {
    question: 'Who can participate?',
    answer: 'CyberFest is open to all students from colleges across India. Both undergraduate and postgraduate students with an interest in cybersecurity can participate.',
  },
  {
    question: 'What are the team size requirements?',
    answer: 'For the Hackathon, teams can have 3 or 4 members. For CTF, you can participate solo or in a team of 2 members.',
  },
  {
    question: 'What are the registration fees?',
    answer: 'For Hackathon: ₹900 for a team of 3, ₹1200 for a team of 4. For CTF: ₹300 for solo participation, ₹600 for a team of 2.',
  },
  {
    question: 'What is the prize pool?',
    answer: 'The total prize pool for CyberFest 2026 is ₹75,000, distributed across winners and runners-up of both Hackathon and CTF tracks.',
  },
  {
    question: 'What should I bring to the event?',
    answer: 'Bring your laptop with necessary software installed, chargers, valid college ID, and any personal items you may need for the 36-hour event. Food and beverages will be provided.',
  },
  {
    question: 'Is accommodation provided?',
    answer: 'Accommodation arrangements can be made for outstation participants. Please contact the organizing team after registration for details.',
  },
  {
    question: 'How do I register?',
    answer: 'Click the "Register Now" button on the homepage, select your event (Hackathon or CTF), choose team size, fill in team member details, and complete the payment to confirm your registration.',
  },
  {
    question: 'Can I participate in both Hackathon and CTF?',
    answer: 'Due to the parallel nature of the events and the intensive 36-hour format, participants are advised to choose one track to ensure full engagement and the best experience.',
  },
  {
    question: 'Will there be certificates?',
    answer: 'Yes, all participants will receive participation certificates. Winners and runners-up will receive special recognition certificates along with their prizes.',
  },
  {
    question: 'How can I contact the organizers?',
    answer: 'You can reach out to us through the contact information provided in the footer section. Join our WhatsApp group after registration for quick updates and queries.',
  },
];

const FAQSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-4" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h2 className="font-orbitron text-3xl md:text-4xl lg:text-5xl font-bold">
              <span className="gradient-text">Frequently Asked Questions</span>
            </h2>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="font-rajdhani text-lg text-foreground/70 max-w-2xl mx-auto">
            Find answers to common questions about CyberFest 2026
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="cyber-card rounded-lg border border-primary/30 overflow-hidden"
              >
                <AccordionTrigger
                  className="px-6 py-4 font-rajdhani text-lg font-semibold text-left hover:bg-primary/5 transition-colors [&[data-state=open]]:bg-primary/10"
                  aria-label={faq.question}
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 font-rajdhani text-base text-foreground/80 leading-relaxed border-t border-primary/20">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

      </div>
    </section>
  );
};

export default FAQSection;
