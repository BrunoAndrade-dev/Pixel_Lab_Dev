import SiteHeader from './site-header';
import TechnologyScene from './technology-scene';
import HowItWorks from './how-it-works';
import ScrollReveal from './scroll-reveal';
import ModulesCarousel from './modules-carousel';
import MotionReveal from './motion-reveal';
import './landing.css';

/** Exibe a introdução e mantém um caminho direto entre o catálogo e a simulação disponível. */
export default function LandingPage() {
  return (
    <main className="landing" id="inicio">
      <noscript><style>{'.motion-enter { opacity: 1 !important; transform: none !important; }'}</style></noscript>
      <MotionReveal>
        <SiteHeader current="home" />
      </MotionReveal>

      <section className="landing-hero" aria-labelledby="landing-title">
        <TechnologyScene />
        <MotionReveal className="hero-copy" delay={0.1}>
          <h1 id="landing-title">
            Desbloqueie seu<br /> potencial em<br /> <span>programação.</span>
          </h1>
          <p>Aprenda na prática com simulações interativas e animações 2D.</p>
        </MotionReveal>
      </section>

      <ScrollReveal className="about-page" id="como-funciona" aria-label="Como funciona">
        <HowItWorks />
      </ScrollReveal>

      <ScrollReveal className="module-section" id="modulos" tabIndex={-1} aria-labelledby="modules-title">
        <h2 id="modules-title">Módulos</h2>
        <ModulesCarousel />
      </ScrollReveal>
    </main>
  );
}
