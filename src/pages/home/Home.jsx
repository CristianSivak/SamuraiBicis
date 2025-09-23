import HeroSection from '../../components/herosection/HeroSection';
import VideoSection from '../../components/videosection/VideoSection';
import { brands } from '../../data/brands';
import BrandsSection from '../../components/brandssection/BradsSection';
import ValuePropositionsSection from '../../components/home/ValuePropositionsSection';
import StatsShowcaseSection from '../../components/home/StatsShowcaseSection';
import ModernCallToAction from '../../components/home/ModernCallToAction';

function Home() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <HeroSection />
      <div className="relative z-10 -mt-16 sm:-mt-24">
        <BrandsSection logos={brands} />
      </div>
      <ValuePropositionsSection />
      <StatsShowcaseSection />
      <VideoSection />
      <ModernCallToAction />
    </div>
  );
}

export default Home;
