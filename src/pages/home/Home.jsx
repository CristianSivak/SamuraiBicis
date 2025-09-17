import HeroSection from '../../components/herosection/HeroSection'
import Track from '../../components/videosection/VideoSection'
import { brands } from "../../data/brands";
import BrandsSection from '../../components/brandssection/BradsSection'


function Home() {
  return (
    <div>
      <HeroSection />
        <BrandsSection logos={brands} />
      <Track />
    </div>  
  )
}

export default Home