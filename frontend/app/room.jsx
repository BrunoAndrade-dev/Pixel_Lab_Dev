'use client';

import { useEffect, useRef } from 'react';
export const stations = {
  client: ['Cliente', 22, 65, 'Envio o pedido de cadastro.', 'Inicia a requisição HTTP.', 'Envia método, rota, cabeçalhos e corpo ao endpoint.'],
  controller: ['Controller', 36, 49, 'Recebo o formulário do cliente.', 'Recebe os dados do pedido.', 'Mapeia a rota HTTP para um método Java.'],
  service: ['Service', 54, 37, 'Confiro as regras do cadastro.', 'Verifica as regras do produto.', 'Valida o domínio antes de chamar a persistência.'],
  entity: ['Entity', 56, 70, 'Carrego os dados do produto.', 'Guarda os atributos do produto.', 'Representa a entidade mapeada para a tabela.'],
  repository: ['Repository', 72, 55, 'Peço a gravação do produto.', 'Encaminha o produto para gravar.', 'Abstrai o acesso ao armazenamento.'],
  database: ['Banco', 82, 38, 'Armazeno os registros.', 'Mantém os produtos cadastrados.', 'Representa a persistência dos registros em tabela.']
};
function draw(ctx, active, t) {
  const W = 440,
    H = 232;
  ctx.clearRect(0, 0, W, H);
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const poly = (pts, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fill();
  };
  const iso = (x, y) => [207 + 15 * x - 14 * y, 21 + 7 * x + 7 * y];
  function box(x, y, w, d, h, top, left, right) {
    const a = iso(x, y),
      b = iso(x + w, y),
      c = iso(x + w, y + d),
      e = iso(x, y + d);
    const up = p => [p[0], p[1] - h];
    poly([up(a), up(b), up(c), up(e)], top);
    poly([up(e), up(c), c, e], left);
    poly([up(c), up(b), b, c], right);
  }
  // Tiled cutaway floor and two low walls.
  for (let x = 0; x < 14; x++) for (let y = 0; y < 13; y++) box(x, y, 1, 1, 4, (x + y) % 2 ? '#c1dbce' : '#c9e1d5', '#74988c', '#658a80');
  for (let x = 0; x < 14; x++) box(x, 0, 1, .32, 19, '#eef4df', '#a8c8b7', '#759686');
  for (let y = 0; y < 13; y++) box(0, y, .32, 1, 19, '#f3f3dd', '#9bb9a5', '#b2cebb');
  function plant(x, y) {
    rect(x - 4, y - 6, 9, 7, '#a06446');
    rect(x - 5, y - 7, 11, 3, '#d58c62');
    rect(x, y - 18, 2, 12, '#386444');
    rect(x - 7, y - 15, 7, 5, '#4d9363');
    rect(x + 2, y - 19, 6, 6, '#579e65');
    rect(x - 4, y - 23, 5, 8, '#2c7951');
  }
  plant(43, 110);
  plant(212, 22);
  plant(391, 113);
  plant(204, 191);
  // Workbenches with monitors.
  for (const [x, y] of [[4, 8], [6, 4], [10, 6]]) {
    box(x, y, 2, .9, 9, '#bf9068', '#8d6149', '#735542');
    let [a, b] = iso(x + .65, y + .45);
    rect(a - 3, b - 17, 8, 2, '#49575a');
    rect(a, b - 19, 2, 3, '#49575a');
    rect(a - 5, b - 27, 13, 9, '#394f53');
    rect(a - 4, b - 26, 11, 6, '#93d9c0');
    rect(a - 3, b - 25, 5, 1, '#518f80');
    rect(a - 3, b - 23, 8, 1, '#518f80');
  }
  Object.entries(stations).sort((a, b) => a[1][2 + 0] - b[1][2 + 0]).forEach(([id, [, xp, yp]], idx) => {
    const x = Math.round(xp * W / 100),
      y = Math.round(yp * H / 100);
    if (active === id) {
      poly([[x - 13, y - 1], [x, y - 7], [x + 13, y - 1], [x, y + 5]], '#efc44b');
    }
    if (id === 'database') {
      for (let n = 0; n < 3; n++) {
        rect(x - 9, y - 8 - n * 7, 18, 6, '#50646a');
        rect(x - 8, y - 7 - n * 7, 13, 3, '#81989a');
        rect(x + 6, y - 7 - n * 7, 2, 2, '#b9f194');
      }
    } else if (id === 'entity') {
      rect(x - 8, y - 14, 15, 14, '#bd8a58');
      rect(x - 6, y - 16, 13, 14, '#ffe3a0');
      rect(x - 4, y - 13, 8, 2, '#9f743a');
      rect(x - 4, y - 9, 6, 1, '#9f743a');
    } else {
      let bob = active === id && Math.sin(t / 260) > .6 ? -1 : 0;
      const skin = ['#dba77f', '#a87153', '#e8bc94', '#c58f70'][idx % 4],
        hair = ['#453b39', '#643e36', '#393946', '#855338'][idx % 4];
      const shirt = {
        client: '#cd794e',
        service: '#4f8d65',
        repository: '#5c81ab',
        controller: '#9379b2'
      }[id];
      rect(x - 5, y - 7, 4, 7, '#384859');
      rect(x + 1, y - 7, 4, 7, '#344355');
      rect(x - 6, y - 1, 5, 2, '#453f43');
      rect(x + 1, y - 1, 6, 2, '#453f43');
      rect(x - 6, y - 17 + bob, 12, 10, shirt);
      rect(x - 8, y - 15 + bob, 3, 8, skin);
      rect(x + 5, y - 15 + bob, 3, 8, skin);
      rect(x - 5, y - 28 + bob, 11, 12, skin);
      rect(x - 6, y - 29 + bob, 12, 5, hair);
      rect(x - 6, y - 26 + bob, 3, 6, hair);
      rect(x + 2, y - 23 + bob, 2, 2, '#37373a');
    }
  });
}
export default function Room({
  active,
  playing,
  onInspect,
  bubble,
  previous,
  index
}) {
  const canvas = useRef(null);
  useEffect(() => {
    const ctx = canvas.current.getContext('2d');
    let handle;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = t => {
      draw(ctx, active, t);
      if (playing && !reduced) handle = requestAnimationFrame(frame);
    };
    frame(0);
    return () => cancelAnimationFrame(handle);
  }, [active, playing]);
  const current = stations[active],
    from = stations[previous];
  return <div className="room"><canvas width="440" height="232" ref={canvas} aria-hidden="true" />
 {Object.entries(stations).map(([id, [title, x, y]]) => <button className={'station ' + (active === id ? 'selected' : '')} key={id} onClick={() => onInspect(id)} style={{
      left: x + '%',
      top: y + '%'
    }}>{title}</button>)}
 {from && current && from !== current && <i key={index} aria-hidden="true" className="packet" style={{
      "--from-x": from[1] + "%",
      "--from-y": from[2] - 8 + "%",
      "--to-x": current[1] + "%",
      "--to-y": current[2] - 8 + "%"
    }}>✉</i>}
 {bubble && current && <div className="bubble" style={{
      left: Math.max(19, Math.min(80, current[1])) + '%',
      bottom: 100 - current[2] + 14 + '%'
    }}>{bubble}</div>}</div>;
}
