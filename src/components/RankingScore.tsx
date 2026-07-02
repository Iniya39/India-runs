import React from 'react';

interface RankingScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const RankingScore: React.FC<RankingScoreProps> = ({
  score,
  size = 72,
  strokeWidth = 6,
}) => {
  // Color coding logic
  let colorClass = 'text-red-500';
  let strokeColor = '#FF6B6B'; // Red

  if (score >= 90) {
    colorClass = 'text-green-500';
    strokeColor = '#51CF66'; // Green
  } else if (score >= 70) {
    colorClass = 'text-blue-500';
    strokeColor = '#339AF0'; // Blue
  } else if (score >= 50) {
    colorClass = 'text-orange-500';
    strokeColor = '#FF922B'; // Orange
  }

  // Circular calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E9ECEF"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center font-sora">
        <span className={`text-base font-extrabold ${colorClass}`}>
          {Math.round(score)}
        </span>
        <span className="text-[8px] font-bold text-text-muted uppercase -mt-1">% Match</span>
      </div>
    </div>
  );
};
