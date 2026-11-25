'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { backendQuizzes, evaluateQuiz } from './backend-quiz-data.mjs';
import './backend-quiz.css';

export default function BackendSimulationHeading({ scenario, title, eyebrow, description, unlocked, onOpen, className = 'school-intro' }) {
  const questions = backendQuizzes[scenario];
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const modal = useRef(null);
  const resultHeading = useRef(null);
  const identity = useId();

  useEffect(() => {
    const dialog = modal.current;
    if (open && unlocked) dialog.showModal();
    else if (dialog.open) dialog.close();
  }, [open, unlocked]);

  useEffect(() => { if (result) resultHeading.current?.focus(); }, [result]);

  function submit(event) {
    event.preventDefault();
    if (!unlocked || result) return;
    try {
      setResult(evaluateQuiz(questions, answers));
      setError('');
    } catch (problem) {
      setError(problem.message);
      const missing = questions.findIndex((_, index) => answers[index] === undefined);
      modal.current.querySelector(`[name="${identity}-question-${missing}"]`)?.focus();
    }
  }

  function retry() {
    setResult(null);
    setAnswers({});
    setError('');
    modal.current.scrollTop = 0;
    requestAnimationFrame(() => modal.current?.querySelector('input')?.focus());
  }

  return <>
    <header className={className}>
      <p className="school-eyebrow">{eyebrow}</p>
      <div className="backend-heading-row"><h1>{title}</h1><div className="backend-quiz-access">
        <button type="button" className="backend-quiz-trigger" disabled={!unlocked} aria-describedby={`${identity}-access`} onClick={() => { if (!unlocked) return; onOpen?.(); setOpen(true); }}>
          <span aria-hidden="true">{unlocked ? '✓' : '🔒'}</span> Quiz · {questions.length} questões
        </button>
        <small id={`${identity}-access`}>{unlocked ? 'Liberado · fixe seus conhecimentos' : 'Reproduza todas as etapas até o final para liberar'}</small>
      </div></div>
      <p>{description}</p>
    </header>
    <dialog ref={modal} className="backend-quiz-dialog" aria-labelledby={`${identity}-title`} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      {open && unlocked && <>
        <div className="backend-quiz-top"><div><small>FIXAÇÃO · BACKEND</small><h2 id={`${identity}-title`}>Quiz · {title}</h2></div><button type="button" className="backend-quiz-close" onClick={() => setOpen(false)} aria-label="Fechar quiz">✕</button></div>
        <p className="backend-quiz-intro">{questions.length} questões, uma alternativa por questão. Acerte pelo menos 75% ({Math.ceil(questions.length * .75)} de {questions.length}) para atingir o objetivo. A correção traz explicações e sugestões de revisão.</p>
        {result && <div className={`backend-quiz-result ${result.passed ? 'is-passed' : ''}`}>
          <h3 ref={resultHeading} tabIndex={-1}>{result.passed ? 'Parabéns! Você atingiu o objetivo.' : 'Continue praticando: vamos revisar os pontos que faltaram.'}</h3>
          <p><strong>{result.correct} de {result.total} acertos · {result.percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong></p>
          {result.recommendations.length ? <><h4>O que estudar agora</h4><ul>{result.recommendations.map(item => <li key={item.topic}><strong>{item.topic}:</strong> {item.study}</li>)}</ul><p>Feche o quiz para acessar Contexto/Objetivo, o inspetor ou rever a simulação. Suas respostas ficam disponíveis durante esta visita.</p></> : <p>Você acertou todas as questões. Experimente outra entrada ou uma falha e explique o resultado com suas próprias palavras.</p>}
        </div>}
        <form onSubmit={submit} noValidate>
          <div className="backend-quiz-progress" role="status">{result ? 'Correção comentada' : `${Object.keys(answers).length} de ${questions.length} questões respondidas`}</div>
          {questions.map((question, index) => <fieldset key={question.question} className="backend-quiz-question" disabled={Boolean(result)}>
            <legend><span>Questão {index + 1}</span>{question.question}</legend>
            {question.options.map((option, optionIndex) => <label key={option} className={result ? optionIndex === question.answer ? 'is-correct' : answers[index] === optionIndex ? 'is-wrong' : '' : ''}>
              <input type="radio" name={`${identity}-question-${index}`} checked={answers[index] === optionIndex} value={optionIndex} onChange={() => { setAnswers(current => ({ ...current, [index]: optionIndex })); setError(''); }} />
              <span>{option}{result && optionIndex === question.answer && <small>Resposta correta</small>}{result && answers[index] === optionIndex && optionIndex !== question.answer && <small>Sua resposta</small>}</span>
            </label>)}
            {result && <p className="backend-quiz-explanation"><strong>{answers[index] === question.answer ? 'Você acertou. ' : 'Vamos revisar. '}</strong>{question.explanation}</p>}
          </fieldset>)}
          {error && <p className="backend-quiz-error" role="alert">{error}</p>}
          <div className="backend-quiz-actions">{result ? <button type="button" onClick={retry}>Tentar novamente</button> : <button type="submit">Corrigir minhas respostas</button>}<button type="button" className="backend-quiz-secondary" onClick={() => setOpen(false)}>Voltar à simulação</button></div>
        </form>
      </>}
    </dialog>
  </>;
}
