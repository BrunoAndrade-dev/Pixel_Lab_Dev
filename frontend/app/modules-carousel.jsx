'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { A11y, EffectCoverflow, Keyboard, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { aiModulePath } from './ai-scenarios.mjs';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

const modules = [
  { title: 'Lógica de Programação', category: 'O primeiro passo', description: 'Aprenda a organizar ideias e transformar problemas em soluções.', tags: ['Sua porta de entrada', 'Fundamentos da programação'], art: 'logic' },
  { title: 'Frontend', category: 'Interfaces e experiências', description: 'Explore a construção de interfaces que conectam pessoas e tecnologia.', tags: ['Design de interfaces'], art: 'frontend' },
  { title: 'Backend', category: 'Java e Spring Boot', description: 'Explore requisições, persistência de dados e operações CRUD em cenários interativos.', tags: ['Java', 'Spring Boot', 'Requisições HTTP', 'APIs'], art: 'backend', href: '/modulos/backend' },
  { title: 'Banco de Dados', category: 'Dados com propósito', description: 'Conheça o lugar onde as informações do sistema são organizadas e armazenadas.', tags: ['PostgreSQL', 'Armazenamento de informações'], art: 'database' },
  { title: 'Arquitetura', category: 'Conexões que fazem sentido', description: 'Entenda como as partes de um sistema se conectam para trabalhar em conjunto.', tags: ['Arquitetura de software'], art: 'architecture' },
  { title: 'Inteligência Artificial', category: 'Codex e Claude Code', description: 'Explore a consulta à documentação e a clareza de prompts na biblioteca e na hamburgueria.', tags: ['Conceitos de IA', 'Prompts', 'Agentes', 'Skills', 'Harness'], art: 'ai', href: aiModulePath },
  { title: 'DevOps', category: 'Do código à operação', description: 'Descubra as ferramentas que aproximam desenvolvimento, entrega e infraestrutura.', tags: ['Ferramentas e processos DevOps'], art: 'devops' },
  { title: 'Metodologias Ágeis', category: 'Colaboração em movimento', description: 'Conheça práticas e ferramentas para organizar entregas e colaborar com sua equipe.', tags: ['Colaboração e trabalho em equipe'], art: 'agile' },
];

const illustrationLabels = {
  logic: 'Ilustração 3D de raciocínio lógico, estudante e fluxograma',
  frontend: 'Ícones 3D de Next.js e JavaScript',
  backend: 'Ícone 3D do Spring Boot',
  database: 'Elefante do PostgreSQL em 3D',
  architecture: 'Camadas conectadas de arquitetura de software em 3D',
  ai: 'Ícones 3D de Codex e Claude Code',
  devops: 'Ícones 3D de Docker, GitHub e Linux',
  agile: 'Ícones 3D de Jira, Trello e ClickUp',
};

/** Adaptação de Carousel_003 / Skiper 49, de Skiper UI (versão gratuita). */
export default function ModulesCarousel() {
  const swiper = useRef(null);
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const [artReady, setArtReady] = useState(false);

  useEffect(() => {
    const image = new window.Image();
    image.onload = image.onerror = () => setArtReady(true);
    image.src = '/technologies/module-icons-3d.webp';
    return () => { image.onload = image.onerror = null; };
  }, []);

  return (
    <motion.div className="modules-carousel" initial={false} animate={{ opacity: 1 }}>
      <div className="carousel-toolbar">
        <p>Explore as áreas de conhecimento</p>
        <div className="carousel-controls">
          <span aria-live="polite" aria-atomic="true">{String(active + 1).padStart(2, '0')} <span className="carousel-total">/ 08</span></span>
          <button type="button" aria-label="Módulo anterior" onClick={() => swiper.current?.slidePrev()}><ChevronLeft size={20} aria-hidden="true" /></button>
          <button type="button" aria-label="Próximo módulo" onClick={() => swiper.current?.slideNext()}><ChevronRight size={20} aria-hidden="true" /></button>
        </div>
      </div>
      <Swiper
        className="module-coverflow"
        modules={[EffectCoverflow, Pagination, Keyboard, A11y]}
        onSwiper={instance => { swiper.current = instance; }}
        onSlideChange={instance => setActive(instance.realIndex)}
        effect={reducedMotion ? 'slide' : 'coverflow'}
        speed={reducedMotion ? 0 : 550}
        slidesPerView="auto"
        centeredSlides
        grabCursor
        loop
        spaceBetween={20}
        coverflowEffect={{ rotate: 40, stretch: 0, depth: 100, modifier: 1, slideShadows: true }}
        pagination={{ clickable: true }}
        keyboard={{ enabled: true, onlyInViewport: true }}
        a11y={{ containerMessage: 'Catálogo de módulos', itemRoleDescriptionMessage: 'Módulo', slideLabelMessage: '{{index}} de {{slidesLength}}', paginationBulletMessage: 'Ir para o módulo {{index}}' }}
      >
        {modules.map((module, index) => (
          <SwiperSlide key={module.title}>
            {({ isActive }) => (
              <article className="catalog-card">
                <div className="catalog-card-topline">
                  <span className="catalog-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className={`catalog-status ${module.href ? 'is-available' : ''}`}>{module.href ? 'Disponível' : 'Em breve'}</span>
                </div>
                <h3>{module.title}</h3>
                <div className="catalog-surface">
                  <div className={`catalog-art ${module.art ? `catalog-art-${module.art}` : ''}`}>
                    <motion.span
                      className={`motion-enter module-icon-3d module-icon-3d-${module.art}`}
                      role="img"
                      aria-label={illustrationLabels[module.art]}
                      initial="hidden"
                      whileInView={artReady ? 'visible' : 'hidden'}
                      viewport={{ once: true, amount: 0.2 }}
                      variants={{ hidden: { opacity: 0, y: 20, scale: 0.88 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                      transition={{ duration: reducedMotion ? 0 : 0.7, delay: reducedMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="catalog-category">{module.category}</p>
                  <p className="catalog-description">{module.description}</p>
                  <ul className="catalog-tags" aria-label={`Tópicos de ${module.title}`}>
                    {module.tags.map(tag => <li key={tag}>{tag}</li>)}
                  </ul>
                </div>
                {module.href ? (
                  <Link className="catalog-action" href={module.href} tabIndex={isActive ? 0 : -1}>Explorar módulo <ArrowUpRight size={18} aria-hidden="true" /></Link>
                ) : <p className="catalog-soon">Novas experiências em preparação</p>}
              </article>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.div>
  );
}
