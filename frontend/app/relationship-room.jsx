'use client';

import { useEffect, useRef, useState } from 'react';
import { sceneTime } from './room-motion.mjs';
import { relationshipScene as scene, relationshipStudentFrame, studentSeat, relationshipTransferDuration, initialRelationshipStudents } from './relationship-scene.mjs';

/** Cenário próprio: mantém as outras aulas escolares com a arte e as posições originais. */
export default function RelationshipRoom({ state, step, playback, waitingMovement = null, introDialogue = 'Vamos conhecer as duas turmas e os vínculos de cada aluno.' }) {
  const canvas = useRef(null);
  const viewport = useRef(null);
  const speech = useRef(null);
  const [images, setImages] = useState(null);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(true);
  const students = state?.students || initialRelationshipStudents;
  const clock = playback.cursor.clock;
  const actor = step?.actor || 'teacher';
  const speakerName = actor === 'office' ? 'Secretária' : actor === 'student'
    ? students.find(student => student.id === step?.movement?.studentId)?.name || 'Estudante'
    : 'Professor';

  useEffect(() => {
    let alive = true;
    Promise.all([scene.background, scene.students, scene.staff, scene.bruno].map(async src => {
      const picture = new window.Image(); picture.src = src; await picture.decode(); return picture;
    })).then(pictures => { if (alive) setImages(pictures); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!images) return;
    const ctx = canvas.current.getContext('2d');
    if (!ctx) return;
    const [background, additions, staff, bruno] = images;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    const draw = () => {
      const elapsed = sceneTime(clock);
      const animate = playback.cursor.animate && !reduced.matches;
      const staffSpeaker = scene.staffSeats.find(person => person.id === actor) || scene.staffSeats[0];
      let speaker = { x: staffSpeaker.x, y: staffSpeaker.y };
      if (actor === 'student') {
        const student = students.find(person => person.id === step?.movement?.studentId);
        if (student) {
          const position = relationshipStudentFrame(student, step, elapsed, animate);
          speaker = { x: position.x, y: position.seated ? 326 : position.y - 160 };
        }
      }
      if (speech.current) {
        speech.current.style.setProperty('--speaker-x', `${speaker.x / scene.width * 100}%`);
        speech.current.style.setProperty('--speaker-y', `${speaker.y / scene.height * 100}%`);
      }
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, scene.width, scene.height);
      ctx.drawImage(background, 0, 0, scene.width, scene.height);
      if (state?.selectedClassId) {
        const x = state.selectedClassId === 1 ? 90 : 805;
        ctx.fillStyle = '#f2b54120'; ctx.fillRect(x, 345, 635, 193);
      }
      for (const person of scene.staffSeats) {
        const cell = staff.naturalWidth / 3;
        ctx.drawImage(staff, person.column * cell, 0, cell, staff.naturalHeight, person.x - person.size / 2, person.y, person.size, person.size);
      }
      // Mesas do fundo ocluem apenas os adultos; os alunos estão à frente delas.
      for (const [x, y, width, height] of scene.desks.slice(6)) ctx.drawImage(background, x, y, width, height, x, y, width, height);
      for (const outline of scene.staffEquipment) {
        ctx.save();
        ctx.beginPath();
        outline.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.closePath(); ctx.clip();
        ctx.drawImage(background, 0, 0, scene.width, scene.height);
        ctx.restore();
      }
      const walkers = [];
      for (const student of students) {
        // O commit confirma os dados; a próxima etapa inicia o deslocamento físico.
        const position = waitingMovement?.studentId === student.id
          ? { ...studentSeat(student.id, waitingMovement.fromClassId), seated: true }
          : relationshipStudentFrame(student, step, elapsed, animate);
        if (!position.seated) { walkers.push({ student, position }); continue; }
        if (state?.selectedClassId === student.classId) {
          ctx.fillStyle = '#d99d2a88'; ctx.beginPath(); ctx.ellipse(position.x, 515, 43, 10, 0, 0, Math.PI * 2); ctx.fill();
        }
        if (student.id === 1) {
          ctx.drawImage(staff, 0, 0, staff.naturalWidth / 3, staff.naturalHeight, position.x - 90, 315, 180, 180);
        } else {
          const cell = additions.naturalWidth / 2;
          ctx.drawImage(additions, (student.id - 2) * cell, 0, cell, additions.naturalHeight / 2, position.x - 90, 326, 180, 180);
        }
        ctx.fillStyle = '#fff9e9'; ctx.fillRect(position.x - 46, 523, 92, 25);
        ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#4b371c';
        ctx.fillText(student.name, position.x, 542);
      }
      // Mesas passam à frente dos joelhos; mãos e rostos continuam visíveis.
      for (const [x, y, width, height] of scene.desks.slice(0, 6)) ctx.drawImage(background, x, y, width, height, x, y, width, height);
      for (const { student, position } of walkers) {
        const size = 160;
        ctx.save(); ctx.translate(position.x, position.y - (playback.playing && !reduced.matches ? Math.abs(Math.sin(elapsed / 90)) * 3 : 0));
        if (position.flip) ctx.scale(-1, 1);
        if (student.id === 1) ctx.drawImage(bruno, -size / 2, -size, size, size);
        else {
          const cell = additions.naturalWidth / 2;
          ctx.drawImage(additions, (student.id - 2) * cell, additions.naturalHeight / 2, cell, additions.naturalHeight / 2, -size / 2, -size, size, size);
        }
        ctx.restore();
      }
      if (animate && ['teacher-to-office', 'office-to-teacher'].includes(step?.motion) && elapsed < 3200) {
        let t = Math.min(1, elapsed / 3000); if (step.motion === 'office-to-teacher') t = 1 - t;
        const x = 450 + 1400 * t, y = 340 + Math.sin(t * Math.PI) * 240;
        ctx.fillStyle = '#fff7dd'; ctx.strokeStyle = '#96601c'; ctx.lineWidth = 3;
        ctx.fillRect(x - 16, y - 10, 32, 20); ctx.strokeRect(x - 16, y - 10, 32, 20);
        ctx.beginPath(); ctx.moveTo(x - 16, y - 10); ctx.lineTo(x, y + 1); ctx.lineTo(x + 16, y - 10); ctx.stroke();
      }
      if (playback.playing && visible && !document.hidden && !reduced.matches && elapsed < relationshipTransferDuration) frame = requestAnimationFrame(draw);
    };
    const refresh = () => { cancelAnimationFrame(frame); draw(); };
    refresh(); reduced.addEventListener('change', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { cancelAnimationFrame(frame); reduced.removeEventListener('change', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [images, students, state, step, actor, waitingMovement, clock, playback.cursor.animate, playback.playing, visible]);

  return <>
    <p className="relationship-scroll-hint">No celular, deslize o cenário para ver as duas salas e a secretaria.</p>
    <div className="relationship-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Escola com duas salas de aula e uma secretaria">
      <div className="relationship-room">
        <canvas ref={canvas} width={scene.width} height={scene.height} role="img" aria-label={`Três estudantes distribuídos conforme os vínculos cadastrados. ${students.filter(s => s.classId === 1).length} na turma A e ${students.filter(s => s.classId === 2).length} na turma B.`} />
        <span className="relationship-zone zone-a">Sala A · Computação A · ID 1</span><span className="relationship-zone zone-b">Sala B · Computação B · ID 2</span><span className="relationship-zone zone-office">Secretaria · registros</span>
        <div ref={speech} className="relationship-speech" aria-live="polite" aria-atomic="true">
          <strong>{speakerName}</strong>
          <span>{step?.dialogue || introDialogue}</span>
        </div>
      </div>
    </div>
    {error && <p role="alert" className="school-message school-error">Não foi possível carregar o novo cenário. Recarregue a página.</p>}
  </>;
}
