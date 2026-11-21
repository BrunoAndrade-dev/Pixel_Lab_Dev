import SiteHeader from '../site-header';
import HowItWorks from '../how-it-works';
import '../landing.css';

export const metadata = {
  title: 'Como funciona',
  description: 'Entenda a proposta didática do NARA Lab e como acompanhar uma simulação interativa.'
};

/** Apresenta a finalidade pedagógica do NARA Lab e orienta a primeira demonstração. */
export default function HowItWorksPage() {
  return (
    <div className="landing">
      <SiteHeader current="about" />
      <main className="about-page">
        <HowItWorks standalone />
      </main>
    </div>
  );
}
