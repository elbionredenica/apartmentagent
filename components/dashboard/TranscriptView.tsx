import type { CallTranscript } from "@/types";
import { ScoreDisplay } from "./ScoreDisplay";

interface TranscriptViewProps {
  transcript: CallTranscript;
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const hasScores =
    transcript.managementScore != null ||
    transcript.noiseScore != null ||
    transcript.valueScore != null ||
    transcript.flexibilityScore != null;

  return (
    <div>
      {/* Call info */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-medium text-ink-muted uppercase">
          {transcript.callType === "prescreen"
            ? "Pre-Screen Call"
            : "Deep Screen Call"}
        </span>
        {transcript.durationSeconds != null && (
          <span className="text-xs text-ink-muted">
            {Math.floor(transcript.durationSeconds / 60)}m{" "}
            {transcript.durationSeconds % 60}s
          </span>
        )}
        <span
          className={`text-xs font-medium ${
            transcript.outcome === "PASS" ? "text-success" : "text-error"
          }`}
        >
          {transcript.outcome}
        </span>
      </div>

      {/* Scores */}
      {hasScores && (
        <div className="flex flex-col gap-2 mb-4 p-3 bg-off-white rounded-md">
          {transcript.managementScore != null && (
            <ScoreDisplay label="Management" score={transcript.managementScore} />
          )}
          {transcript.noiseScore != null && (
            <ScoreDisplay label="Noise" score={transcript.noiseScore} />
          )}
          {transcript.valueScore != null && (
            <ScoreDisplay label="Value" score={transcript.valueScore} />
          )}
          {transcript.flexibilityScore != null && (
            <ScoreDisplay label="Flexibility" score={transcript.flexibilityScore} />
          )}
          {transcript.overallScore != null && (
            <ScoreDisplay label="Overall" score={transcript.overallScore} />
          )}
        </div>
      )}

      {/* Extracted data */}
      {transcript.extractedData &&
        Object.keys(transcript.extractedData).length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-ink-mid uppercase tracking-wide mb-2">
              Key Findings
            </h4>
            <div className="grid gap-1.5">
              {Object.entries(transcript.extractedData).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-xs text-ink-muted capitalize shrink-0">
                    {key.replace(/([A-Z])/g, " $1").trim()}:
                  </span>
                  <span className="text-xs text-ink">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Transcript text */}
      <div>
        <h4 className="text-xs font-semibold text-ink-mid uppercase tracking-wide mb-2">
          Transcript
        </h4>
        <pre className="text-sm text-ink leading-relaxed whitespace-pre-wrap font-[inherit] bg-off-white rounded-md p-3">
          {transcript.transcript}
        </pre>
      </div>
    </div>
  );
}
