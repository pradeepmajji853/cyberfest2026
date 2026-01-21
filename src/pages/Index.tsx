import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import EventDetailsSection from '@/components/EventDetailsSection';
import HackathonSection from '@/components/HackathonSection';
import CTFSection from '@/components/CTFSection';
import ExpertSessionsSection from '@/components/ExpertSessionsSection';
import ScheduleSection from '@/components/ScheduleSection';
import VenueSection from '@/components/VenueSection';
import SponsorsSection from '@/components/SponsorsSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import RegistrationDialog from '@/components/RegistrationDialog';
// import CyberBackground from '@/components/CyberBackground';
import IntroVideo from '@/components/video/IntroVideo';
import Plasma from '@/components/Plasma';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [introVideoEnded, setIntroVideoEnded] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleVideoEnd = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setIntroVideoEnded(true);
    }, 1000);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Plasma
            color="#0047ab"
            speed={2}
            direction="forward"
            scale={1.1}
            opacity={0.8}
            mouseInteractive={true}
          />
        </div>
      </div>
      {/* Intro Video - Hidden on mobile */}
      {!introVideoEnded && !isMobile && (
        <div className={`fixed inset-0 z-50 transition-opacity duration-1000 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          <IntroVideo
            videoSrc={"/intro-video.mp4"}
            onVideoEnd={handleVideoEnd}
          />
        </div>
      )}

      {/* Navigation */}
      <Navbar showAfterIntro={introVideoEnded || isMobile} />

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection onRegisterClick={() => setIsRegistrationOpen(true)} />
        <AboutSection />
        <EventDetailsSection />
        <HackathonSection />
        <CTFSection />
        <ExpertSessionsSection />
        <ScheduleSection />
        <VenueSection />
        <SponsorsSection />
        <FAQSection />
      </main>

      {/* Registration Dialog */}
      <RegistrationDialog
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
