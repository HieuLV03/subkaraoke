
import "./AudioControls.css";

type Props = {
  playing: boolean;

  currentTime: number;

  duration: number;

  playbackRate: number;

  volume: number;

  onPlay(): void;

  onPause(): void;

  onSeek(time: number): void;

  onRate(rate: number): void;

  onVolume(volume: number): void;
};

export default function AudioControls({

  playing,

  currentTime,

  duration,

  playbackRate,

  volume,

  onPlay,

  onPause,

  onSeek,

  onRate,

  onVolume,

}: Props) {

  function format(time: number) {

    const m = Math.floor(time / 60);

    const s = Math.floor(time % 60);

    const ms =
      Math.floor((time % 1) * 100);

    return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  }

  return (

    <div className="audio-controls">

      {/* -5s */}

      <button
        className="audio-btn"
        onClick={() =>
          onSeek(
            Math.max(
              0,
              currentTime - 5
            )
          )
        }
      >
        -5s
      </button>


      {/* TIME */}

      <div className="time">

        {format(currentTime)}

        <span> / </span>

        {format(duration)}

      </div>


      {/* +5s */}

      <button
        className="audio-btn"
        onClick={() =>
          onSeek(
            Math.min(
              duration,
              currentTime + 5
            )
          )
        }
      >
        +5s
      </button>


      {/* PROGRESS */}

      <input
        className="audio-progress"
        type="range"
        min={0}
        max={duration || 0}
        step={0.001}
        value={currentTime}
        onChange={(e) =>
          onSeek(
            Number(e.target.value)
          )
        }
      />


      {/* PLAYBACK RATE */}

      <select
        className="audio-rate"
        value={playbackRate}
        onChange={(e) =>
          onRate(
            Number(e.target.value)
          )
        }
      >

        <option value={0.5}>0.5x</option>

        <option value={0.75}>0.75x</option>

        <option value={1}>1x</option>

        <option value={1.25}>1.25x</option>

        <option value={1.5}>1.5x</option>

        <option value={2}>2x</option>

      </select>


      {/* VOLUME */}

      <div className="volume">

        <span className="volume-icon">
          🔊
        </span>

        <input
          className="volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) =>
            onVolume(
              Number(e.target.value)
            )
          }
        />

      </div>


      {/* PLAY - CUỐI CÙNG */}

      <button
        className="play-btn"
        onClick={() =>
          playing
            ? onPause()
            : onPlay()
        }
      >
        {playing ? "⏸" : "▶"}
      </button>

    </div>

  );
}
