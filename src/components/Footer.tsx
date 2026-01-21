import { motion } from 'framer-motion';
import { Shield, Mail, Linkedin, Instagram } from 'lucide-react';
import ddcLogo from '@/assets/ddc-logo.png';
import cbitLogo from '@/assets/cbit-logo.png';

const socialLinks = [
  { icon: Linkedin, href: 'https://in.linkedin.com/company/digital-defence-club', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://www.instagram.com/ddc_cbit/', label: 'Instagram' },
];

const Footer = () => {
  return (
    <footer className="relative pt-16 pb-8 bg-background/80 backdrop-blur-lg border-t border-border/50">
      <div className="container mx-auto px-4 relative z-10">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              <span className="font-orbitron text-lg md:text-xl font-bold gradient-text">CYBERFEST 2026</span>
            </div>
            <p className="font-rajdhani text-base text-foreground/70 leading-relaxed">
              A National-Level Cybersecurity Conclave bringing together hackers, researchers, and industry experts.
            </p>
            <div className="flex items-center gap-4">
              <img src={cbitLogo} alt="CBIT" className="h-10 md:h-12 object-contain" />
              <img src={ddcLogo} alt="DDC" className="h-10 md:h-12 object-contain rounded-lg" />
            </div>
          </div>     {/* Quick Links */}
          <div>
            <h4 className="font-orbitron text-lg font-bold mb-6 text-primary">Quick Links</h4>
            <ul className="space-y-3">
              {['About', 'Events', 'Hackathon', 'CTF', 'Schedule', 'Venue', 'Sponsors'].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="font-rajdhani text-foreground/70 hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-orbitron text-lg font-bold mb-6 text-primary">Contact</h4>
            <div className="space-y-4">
              <p className="font-rajdhani text-foreground/70">
                <span className="font-semibold text-foreground">Organized by</span><br />
                Digital Defence Club (DDC), CBIT
              </p>
              <a
                href="mailto:ccc@cbit.ac.in"
                className="flex items-center gap-2 font-mono-tech text-primary hover:text-secondary transition-colors"
              >
                <Mail className="w-4 h-4" />
                ccc@cbit.ac.in
              </a>

              <div className="pt-2">
                <h5 className="font-orbitron text-sm font-semibold text-foreground/80 mb-3">Contacts</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="font-rajdhani text-sm font-semibold text-foreground whitespace-normal break-words">
                        Ms. P. Kiranmaie
                      </div>
                      <div className="font-rajdhani text-xs text-foreground/70">Faculty Coordinator</div>
                      <a
                        href="tel:+919032315262"
                        className="mt-1 font-mono-tech text-sm text-primary hover:text-secondary transition-colors"
                        aria-label="Call Ms. P. Kiranmaie"
                      >
                        +91 90323 15262
                      </a>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="font-rajdhani text-sm font-semibold text-foreground whitespace-normal break-words">
                        Ms. Kavita Agrawal
                      </div>
                      <div className="font-rajdhani text-xs text-foreground/70">Faculty Coordinator</div>
                      <a
                        href="tel:+919032315262"
                        className="mt-1 font-mono-tech text-sm text-primary hover:text-secondary transition-colors"
                        aria-label="Call Ms. Kavita Agrawal"
                      >
                        +91 90323 15262
                      </a>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="font-rajdhani text-sm font-semibold text-foreground whitespace-normal break-words">
                        Pradeep Majji
                      </div>
                      <div className="font-rajdhani text-xs text-foreground/70">President</div>
                      <a
                        href="tel:+918184889557"
                        className="mt-1 font-mono-tech text-sm text-primary hover:text-secondary transition-colors"
                        aria-label="Call Pradeep Majji"
                      >
                        +91 81848 89557
                      </a>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="font-rajdhani text-sm font-semibold text-foreground whitespace-normal break-words">
                        Sai Madhav
                      </div>
                      <div className="font-rajdhani text-xs text-foreground/70">Executive Board Head</div>
                      <a
                        href="tel:+918309435613"
                        className="mt-1 font-mono-tech text-sm text-primary hover:text-secondary transition-colors"
                        aria-label="Call Sai Madhav"
                      >
                        +91 83094 35613
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-muted/30 border border-primary/20 hover:border-primary/50 hover:bg-primary/10 transition-all"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-primary" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="section-divider mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono-tech text-sm text-muted-foreground text-center md:text-left">
            © 2026 CyberFest 2026. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
