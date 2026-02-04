import Navbar from '@/components/Navbar';
import ProblemStatementSelection from '@/components/ProblemStatementSelection';
import Plasma from '@/components/Plasma';
import { useIsMobile } from '@/hooks/use-mobile';

const ProblemStatements = () => {
  const isMobile = useIsMobile();

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

      <Navbar showAfterIntro={true} />

      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto mb-8">
            <h1 className="font-orbitron text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              <span className="gradient-text">Problem Statements</span>
            </h1>
            <p className="font-rajdhani text-foreground/80">
              Authenticate with your team credentials to select a problem statement. Availability updates live and selections are locked to prevent parallel double-claims.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <ProblemStatementSelection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProblemStatements;
