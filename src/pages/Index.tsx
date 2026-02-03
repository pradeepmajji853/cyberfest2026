import { useState, useEffect } from 'react';
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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// import CyberBackground from '@/components/CyberBackground';
import Plasma from '@/components/Plasma';
import { useIsMobile } from '@/hooks/use-mobile';
import CommitteeSection from '@/components/CommitteeSection';

const Index = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [registrationsClosed, setRegistrationsClosed] = useState(false);
  const isMobile = useIsMobile();

  const checkRegistrationStatus = async () => {
    try {
      const registrationsSnapshot = await getDocs(collection(db, 'registrations'));
      const totalParticipants = registrationsSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        if (data.isValid === false) return sum;
        return sum + (data.teamMembers?.length || 0);
      }, 0);
      
      setRegistrationsClosed(totalParticipants >= 450);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const handleRegisterClick = () => {
    if (registrationsClosed) {
      alert('Registrations are closed. Thank you for your interest in CyberFest 2026!');
      return;
    }
    setIsRegistrationOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        {isMobile ? (
          <div className="w-full h-full bg-[radial-gradient(circle_at_15%_25%,rgba(0,71,171,0.35),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(0,41,120,0.35),transparent_40%),linear-gradient(180deg,#050816_0%,#000814_60%,#050816_100%)]" />
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Plasma
              color="#0047ab"
              speed={0.9}
              direction="forward"
              scale={1.0}
              opacity={0.5}
              mouseInteractive={false}
              dpr={1}
              powerPreference="low-power"
            />
          </div>
        )}
      </div>
      {/* Navigation */}
      <Navbar showAfterIntro={true} />

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection 
          onRegisterClick={handleRegisterClick}
          registrationsClosed={registrationsClosed}
        />
        <AboutSection />
        <EventDetailsSection />
        <HackathonSection />
        <CTFSection />
        <ExpertSessionsSection />
        <ScheduleSection />
        <CommitteeSection />
        <VenueSection />
        <FAQSection />
        <SponsorsSection />
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
