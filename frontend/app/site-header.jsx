import Image from 'next/image';
import Link from 'next/link';

/** Renderiza a navegação institucional da página inicial e da apresentação da plataforma. */
export default function SiteHeader({ current }) {
  const home = current === 'home';
  return (
    <header className="landing-header">
      <Link href={home ? '#inicio' : '/'} className="landing-brand" aria-label="NARA Lab — início">
        <Image src="/brand/nara-lab.png" alt="NARA Lab" width={213} height={72} preload={home} unoptimized />
      </Link>
      <nav className="landing-nav" aria-label="Navegação do NARA Lab">
        <Link href={home ? '#inicio' : '/#inicio'}>Início</Link>
        <Link href={home ? '#como-funciona' : '/#como-funciona'}>
          Como funciona
        </Link>
        <Link href={home ? '#modulos' : '/#modulos'} className="modules-button">
          Módulos
        </Link>
      </nav>
    </header>
  );
}
