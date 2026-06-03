import HeroSection from '../../components/herosection/HeroSection';
import ValuePropositionsSection from '../../components/home/ValuePropositionsSection';
import ModernCallToAction from '../../components/home/ModernCallToAction';

function Home() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <HeroSection />
      <ValuePropositionsSection />
      <ModernCallToAction />
    </div>
  );
}

export default Home;
