'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { buildJourneyQuestions } from '@/content/site-content';
import { useSiteContent } from '@/components/site-content-provider';

type ModelContextLike = {
  registerTool: (tool: {
    name: string;
    title: string;
    description: string;
    inputSchema: object;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute: (input: unknown) => unknown;
  }, options?: { signal?: AbortSignal }) => void | Promise<void>;
};

export default function JourneyPage() {
  const { journeyCover, journeyQuestionTemplates } = useSiteContent();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [note, setNote] = useState('');
  const [turning, setTurning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submissionId, setSubmissionId] = useState('');
  const questions = useMemo(
    () => buildJourneyQuestions(answers[0] ?? '', journeyQuestionTemplates),
    [answers, journeyQuestionTemplates],
  );

  useEffect(() => {
    const saved = window.localStorage.getItem('memory-journey-draft');
    if (!saved) {
      setSubmissionId(crypto.randomUUID());
      return;
    }
    try {
      const parsed = JSON.parse(saved) as { answers?: Record<number, string>; note?: string; submissionId?: string; submitted?: boolean };
      if (parsed.answers) setAnswers(parsed.answers);
      if (parsed.note) setNote(parsed.note);
      setSubmissionId(parsed.submissionId ?? crypto.randomUUID());
      setSubmitted(Boolean(parsed.submitted));
    } catch {
      setSubmissionId(crypto.randomUUID());
    }
  }, []);

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContextLike }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = context.registerTool({
      name: 'complete_memory_journey',
      title: '完成回忆之旅',
      description: '使用八个依次对应问卷题目的回答，完成并在页面中展示本次回忆之旅。',
      inputSchema: {
        type: 'object',
        properties: {
          answers: { type: 'array', minItems: 8, maxItems: 8, items: { type: 'string', minLength: 1 } },
          note: { type: 'string' },
        },
        required: ['answers'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const value = input as { answers?: unknown; note?: unknown };
        if (!Array.isArray(value.answers) || value.answers.length !== 8 || value.answers.some((item) => typeof item !== 'string' || !item)) {
          throw new Error('answers 必须包含八个非空文本回答。');
        }
        const nextAnswers = Object.fromEntries(value.answers.map((answer, index) => [index, answer as string]));
        const nextNote = typeof value.note === 'string' ? value.note : '';
        setAnswers(nextAnswers);
        setNote(nextNote);
        setStarted(true);
        setStep(questions.length);
        const nextSubmissionId = submissionId || crypto.randomUUID();
        setSubmissionId(nextSubmissionId);
        setSubmitted(false);
        window.localStorage.setItem('memory-journey-draft', JSON.stringify({ answers: nextAnswers, note: nextNote, submissionId: nextSubmissionId, submitted: false }));
        return { status: 'completed', answers: value.answers.length };
      },
    }, { signal: lifecycle.signal });
    void Promise.resolve(register).catch(() => undefined);
    return () => lifecycle.abort();
  }, [questions.length, submissionId]);

  const choose = (value: string) => {
    if (turning) return;
    const next = { ...answers, [step]: value };
    const nextSubmissionId = submissionId || crypto.randomUUID();
    setAnswers(next);
    setSubmissionId(nextSubmissionId);
    setSubmitted(false);
    setSubmitError('');
    window.localStorage.setItem('memory-journey-draft', JSON.stringify({ answers: next, note, submissionId: nextSubmissionId, submitted: false }));
    setTurning(true);
    window.setTimeout(() => {
      setStep((current) => Math.min(current + 1, questions.length));
      setTurning(false);
    }, 420);
  };

  const restart = () => {
    setStarted(false);
    setStep(0);
    setAnswers({});
    setNote('');
    setSubmitted(false);
    setSubmitting(false);
    setSubmitError('');
    setSubmissionId(crypto.randomUUID());
    window.localStorage.removeItem('memory-journey-draft');
  };

  const updateNote = (value: string) => {
    const nextSubmissionId = submissionId || crypto.randomUUID();
    setNote(value);
    setSubmissionId(nextSubmissionId);
    setSubmitted(false);
    setSubmitError('');
    window.localStorage.setItem('memory-journey-draft', JSON.stringify({ answers, note: value, submissionId: nextSubmissionId, submitted: false }));
  };

  const submitFeedback = async () => {
    if (submitting) return;
    const orderedAnswers = questions.map((_, index) => answers[index] ?? '');
    if (orderedAnswers.some((answer) => !answer)) {
      setSubmitError('请先完成全部八道题。');
      return;
    }

    const nextSubmissionId = submissionId || crypto.randomUUID();
    setSubmissionId(nextSubmissionId);
    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/survey-responses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId: nextSubmissionId,
          answers: orderedAnswers,
          questions: questions.map((question) => question.title),
          note,
        }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? '提交失败');
      setSubmitted(true);
      window.localStorage.setItem('memory-journey-draft', JSON.stringify({ answers, note, submissionId: nextSubmissionId, submitted: true }));
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : '提交失败，请稍后再试。');
    } finally {
      setSubmitting(false);
    }
  };

  const isSummary = step >= questions.length;

  return (
    <div className="journey-shell">
      <SiteHeader active="journey" />
      <main className="journey-main">
        {!started ? (
          <section className="journey-cover" aria-labelledby="journey-title">
            <div className="orbit-books" aria-hidden="true">
              {journeyCover.orbitLabels.map((label, index) => <span className={`orbit-book b${index + 1}`} key={label}>{label}</span>)}
            </div>
            <div className="cover-copy">
              <BookOpen aria-hidden="true" />
              <p className="section-kicker">{journeyCover.kicker}</p>
              <h1 id="journey-title">{journeyCover.title}</h1>
              <p>{journeyCover.descriptionBeforeBreak}<br />{journeyCover.descriptionAfterBreak}</p>
              <button type="button" onClick={() => setStarted(true)}>翻开第一页 <ArrowRight aria-hidden="true" /></button>
              <small>无需填写姓名，预计用时 2 分钟</small>
            </div>
          </section>
        ) : (
          <section className={`question-stage ${turning ? 'is-turning' : ''}`} aria-live="polite">
            <div className="journey-progress">
              <span>{isSummary ? '完成' : `${String(step + 1).padStart(2, '0')} / ${String(questions.length).padStart(2, '0')}`}</span>
              <Progress value={isSummary ? 100 : ((step + 1) / questions.length) * 100} aria-label="回忆之旅进度" />
            </div>
            <div className="open-book">
              <div className="book-spine" aria-hidden="true" />
              {!isSummary ? (
                <div className="question-page">
                  <div className="page-number">{step + 1}</div>
                  <h1>{questions[step].title}</h1>
                  <p>{questions[step].hint}</p>
                  <RadioGroup className="choice-list" value={answers[step] ?? ''} onValueChange={choose} aria-label={questions[step].title}>
                    {questions[step].options.map((option) => (
                      <label className="choice-row" key={option} onClick={() => {
                        if (answers[step] === option) choose(option);
                      }}>
                        <RadioGroupItem value={option} />
                        <span>{option}</span>
                        <ArrowRight aria-hidden="true" />
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              ) : (
                <div className="summary-page">
                  <div className="summary-mark"><Check aria-hidden="true" /></div>
                  <p className="section-kicker">你的选择已经整理好了</p>
                  <h1>这就是本次数字教辅反馈</h1>
                  <div className="answer-summary">
                    {questions.map((question, index) => (
                      <button key={question.title} type="button" onClick={() => setStep(index)}>
                        <span>{String(index + 1).padStart(2, '0')}</span><b>{answers[index] ?? '尚未回答'}</b>
                      </button>
                    ))}
                  </div>
                  <label className="note-field">
                    <span>还有什么希望数字教辅改进的？（选填）</span>
                    <Textarea value={note} maxLength={2000} onChange={(event) => updateNote(event.target.value)} placeholder="写下一点想法……" />
                  </label>
                  {submitError && <p className="submission-error" role="alert">{submitError}</p>}
                  <div className="summary-actions">
                    <button className="secondary-action" type="button" onClick={restart}><RotateCcw aria-hidden="true" /> 重新开始</button>
                    <button className="primary-action" type="button" disabled={submitting || submitted} onClick={() => void submitFeedback()}>{submitting ? '正在提交…' : submitted ? '已提交并计入统计' : '提交本次反馈'}</button>
                  </div>
                  <p className="storage-note">提交后将以匿名答卷计入后台统计；不收集姓名、手机号或联系方式。</p>
                </div>
              )}
            </div>
            {!isSummary && step > 0 && <button className="previous-question" type="button" onClick={() => setStep((value) => value - 1)}><ArrowLeft aria-hidden="true" /> 上一题</button>}
          </section>
        )}
      </main>
    </div>
  );
}
