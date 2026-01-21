import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import cyberfestLogo from '@/assets/cyberfest-logo.png';
import RegistrationDialog from './RegistrationDialog';

const navItems = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Events', href: '#events' },
  { name: 'Schedule', href: '#schedule' },
  { name: 'Venue', href: '#venue' },
];

interface NavbarProps {
  showAfterIntro?: boolean;
}

const Navbar = ({ showAfterIntro = true }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Keep navbar visible in the hero; only change styling after a small scroll.
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show navbar once intro is done; background fills as you scroll.
  const shouldShowNavbar = showAfterIntro;
  const isFilled = isScrolled || isMobileMenuOpen;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: shouldShowNavbar ? 0 : -100, opacity: shouldShowNavbar ? 1 : 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isFilled
          ? 'bg-background/80 backdrop-blur-lg border-b border-border/50'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center">
            <img
              src={cyberfestLogo}
              alt="CyberFest 2026"
              className="h-10 md:h-12 object-contain drop-shadow-[0_0_10px_rgba(0,71,171,0.3)]"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="font-rajdhani text-lg font-medium text-foreground/80 hover:text-primary transition-colors relative group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-foreground"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-lg border-b border-border/50"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block font-rajdhani text-lg font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Dialog */}
      <RegistrationDialog 
        isOpen={isRegistrationOpen} 
        onClose={() => setIsRegistrationOpen(false)} 
      />
    </motion.nav>
  );
};

export default Navbar;
