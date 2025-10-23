import HeroSection from '../../components/herosection/HeroSection';
import VideoSection from '../../components/videosection/VideoSection';
import ValuePropositionsSection from '../../components/home/ValuePropositionsSection';
import StatsShowcaseSection from '../../components/home/StatsShowcaseSection';
import ModernCallToAction from '../../components/home/ModernCallToAction';

function Home() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <HeroSection />
      <ValuePropositionsSection />
      <StatsShowcaseSection />
      <VideoSection />
      <ModernCallToAction />
    </div>
  );
}

export default Home;
