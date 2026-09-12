import React from 'react';
import { clsx } from 'clsx';

export interface OpportunityBadgeProps {
  differencePercent: number;
  score: number;
  showScore?: boolean;
  className?: string;
}

type Classification = 'EXCELENTE' | 'BUENA' | 'MEDIA' | 'NO_RECOMENDADA';

function getClassification(score: number): Classification {
  if (score >= 90) return 'EXCELENTE';
  if (score >= 75) return 'BUENA';
  if (score >= 50) return 'MEDIA';
  return 'NO_RECOMENDADA';
}

const CLASS_STYLES: Record<Classification, string> = {
  EXCELENTE: 'bg-green-100 text-green-700 border-green-200',
  BUENA: 'bg-blue-100 text-blue-700 border-blue-200',
  MEDIA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  NO_RECOMENDADA: 'bg-red-100 text-red-600 border-red-200',
};

const CLASS_LABELS: Record<Classification, string> = {
  EXCELENTE: 'Excelente',
  BUENA: 'Buena',
  MEDIA: 'Media',
  NO_RECOMENDADA: 'No recomendada',
};

export function OpportunityBadge({
  differencePercent,
  score,
  showScore = false,
  className,
}: OpportunityBadgeProps): React.JSX.Element {
  const classification = getClassification(score);
  const isBelow = differencePercent < 0;
  const absPercent = Math.abs(differencePercent).toFixed(1);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium',
        CLASS_STYLES[classification],
        className,
      )}
      title={`Oportunidad ${CLASS_LABELS[classification]} — Score: ${score}`}
    >
      <span>{isBelow ? '↓' : '↑'}{absPercent}%</span>
      <span className="opacity-75">vs promedio</span>
      {showScore && <span className="ml-1 opacity-60">·{score}</span>}
    </span>
  );
}
