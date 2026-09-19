// src/components/editor/Timeline/TimelineHeader.tsx

type Props = {
  duration: number;
  zoom: number; // pixel / giây
};

export default function TimelineHeader({
  duration,
  zoom,
}: Props) {
  const totalSeconds = Math.ceil(duration);

  return (
    <div
      className="timeline-header"
      style={{
        width: duration * zoom,
      }}
    >
      {Array.from(
        { length: totalSeconds + 1 },
        (_, second) => (
          <div
            key={second}
            className="timeline-mark"
            style={{
              left: second * zoom,
            }}
          >
            <div className="timeline-tick" />

            <span>
              {formatTime(second)}
            </span>
          </div>
        )
      )}
    </div>
  );
}

function formatTime(sec: number) {
  const minute = Math.floor(sec / 60);

  const second = sec % 60;

  return `${minute}:${second
    .toString()
    .padStart(2, "0")}`;
}