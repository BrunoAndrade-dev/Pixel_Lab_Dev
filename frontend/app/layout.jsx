import './style.css';
export const metadata = {
  title: 'Pixel Lab · Simulador Spring',
  description: 'Laboratório visual de APIs Java e Spring Boot.'
};
export default function Layout({
  children
}) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
