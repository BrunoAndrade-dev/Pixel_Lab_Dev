import './style.css';

export const metadata = {
  title: {
    default: 'NARA Lab · Simulações interativas',
    template: '%s · NARA Lab'
  },
  description: 'Aprenda programação e tecnologia na prática com simulações interativas e animações 2D.'
};

/** Define o idioma e a estrutura HTML compartilhada pelas rotas da plataforma. */
export default function Layout({
  children
}) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
