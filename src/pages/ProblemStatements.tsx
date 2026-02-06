import Navbar from '@/components/Navbar';
import ProblemStatementSelection from '@/components/ProblemStatementSelection';

const ProblemStatements = () => {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar showAfterIntro={true} />

      <main className="pt-24 pb-16">
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
