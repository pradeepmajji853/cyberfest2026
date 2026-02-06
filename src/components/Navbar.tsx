import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import cyberfestLogo from '@/assets/cyberfest-logo.png';
import RegistrationDialog from './RegistrationDialog';

const navItems = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Events', href: '#events' },
  { name: 'Problem Statements', href: '/problem-statements' },
  { name: 'Schedule', href: '#schedule' },
  { name: 'Committee', href: '#committee' },
  { name: 'Venue', href: '#venue' },
  { name: 'FAQ', href: '#faq' },
  { name: 'Sponsors', href: '#sponsors' },
];

interface NavbarProps {
  showAfterIntro?: boolean;
}

const Navbar = ({ showAfterIntro = true }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const scrollToHash = (hashHref: string) => {
    const targetId = hashHref.replace('#', '');
    const target = document.getElementById(targetId);

    requestAnimationFrame(() => {
      if (target) {
        const navOffset = 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      } else {
        window.location.hash = hashHref;
      }
    });
  };

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);

    if (href.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate('/');
        // Wait a tick for the home page to render, then scroll.
        setTimeout(() => scrollToHash(href), 150);
      } else {
        scrollToHash(href);
      }
      return;
    }

    navigate(href);
  };

  const handleMobileNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    handleNavClick(href);
  };

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
          <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
            <img
              src={cyberfestLogo}
              alt="CyberFest 2026"
              className="h-10 md:h-12 object-contain drop-shadow-[0_0_10px_rgba(0,71,171,0.3)]"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="font-rajdhani text-lg font-medium text-foreground/80 hover:text-primary transition-colors relative group"
                type="button"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle navigation"
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
                  onClick={(event) => {
                    event.preventDefault();
                    handleMobileNavClick(item.href);
                  }}
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
