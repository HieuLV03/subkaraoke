import "./Preview.css";

import KaraokeCanvas from "../../karaoke/KaraokeCanvas";

import {
  useProjectStore,
} from "@/stores/project.store";

import {
  useEditorStore,
} from "@/stores/editor.store";

import {
  useEffect,
  useRef,
} from "react";


export default function Preview() {

  // =========================================================
  // PROJECT FILES
  // =========================================================

  const videoFile =
    useProjectStore(
      (state) => state.project?.videoFile
    );

  const imageFile =
    useProjectStore(
      (state) => state.project?.imageFile
    );

  const isImageMode =
    Boolean(imageFile);


  // =========================================================
  // EDITOR STATE
  // =========================================================

  const playing =
    useEditorStore(
      (state) => state.playing
    );

  const currentTime =
    useEditorStore(
      (state) => state.currentTime
    );

  const setCurrentTime =
    useEditorStore(
      (state) => state.setCurrentTime
    );

  const setDuration =
    useEditorStore(
      (state) => state.setDuration
    );

  const play =
    useEditorStore(
      (state) => state.play
    );

  const pause =
    useEditorStore(
      (state) => state.pause
    );

  const playbackRate =
    useEditorStore(
      (state) => state.playbackRate
    );

  const volume =
    useEditorStore(
      (state) => state.volume
    );


  // =========================================================
  // VIDEO REF
  //
  // Video chỉ dùng làm:
  //
  // - VIDEO MODE:
  //   audio + master clock + background video
  //
  // - IMAGE MODE:
  //   audio + master clock
  //
  // Không còn Electron media server.
  // =========================================================

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  // =========================================================
  // DEBUG
  // =========================================================

  useEffect(() => {

    console.log(
      "[Preview] Timing Video:",
      videoFile
    );

    console.log(
      "[Preview] Background Image:",
      imageFile
    );

    console.log(
      "[Preview] Video URL:",
      videoFile
    );

    console.log(
      "[Preview] Image URL:",
      imageFile
    );

  }, [
    videoFile,
    imageFile,
  ]);


  // =========================================================
  // LOAD VIDEO
  //
  // Web:
  //
  // videoFile = blob:http://localhost:5173/...
  //
  // Không convert sang:
  //
  // http://127.0.0.1:38555/...
  // =========================================================

  useEffect(() => {

    const video =
      videoRef.current;

    if (!video) {
      return;
    }


    if (!videoFile) {

      video.pause();

      video.removeAttribute(
        "src"
      );

      video.load();

      setCurrentTime(0);

      setDuration(0);

      pause();

      return;
    }


    console.log(
      "[Preview] Loading timing video:",
      videoFile
    );


    video.src =
      videoFile;

    video.load();

  }, [
    videoFile,
    setCurrentTime,
    setDuration,
    pause,
  ]);


  // =========================================================
  // PLAY / PAUSE
  //
  // VIDEO = MASTER CLOCK
  // =========================================================

  useEffect(() => {

    const video =
      videoRef.current;

    if (
      !video ||
      !videoFile
    ) {
      return;
    }


    if (playing) {

      video
        .play()
        .catch((error) => {

          console.error(
            "[Preview] Video play error:",
            error
          );

          pause();

        });

    }
    else {

      video.pause();

    }

  }, [
    playing,
    videoFile,
    pause,
  ]);


  // =========================================================
  // PLAYBACK RATE
  // =========================================================

  useEffect(() => {

    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    video.playbackRate =
      playbackRate;

  }, [
    playbackRate,
  ]);


  // =========================================================
  // VOLUME
  // =========================================================

  useEffect(() => {

    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    video.volume =
      volume;

  }, [
    volume,
  ]);


  // =========================================================
  // VIDEO → CURRENT TIME
  //
  // VIDEO LÀ MASTER CLOCK
  // =========================================================

  useEffect(() => {

    const video =
      videoRef.current;

    if (
      !video ||
      !videoFile
    ) {
      return;
    }


    let animationFrame = 0;


    const updateTime = () => {

      if (!video.paused) {

        setCurrentTime(
          video.currentTime
        );

      }


      animationFrame =
        requestAnimationFrame(
          updateTime
        );

    };


    animationFrame =
      requestAnimationFrame(
        updateTime
      );


    return () => {

      cancelAnimationFrame(
        animationFrame
      );

    };

  }, [
    videoFile,
    setCurrentTime,
  ]);


  // =========================================================
  // VIDEO METADATA
  // =========================================================

  useEffect(() => {

    const video =
      videoRef.current;

    if (
      !video ||
      !videoFile
    ) {
      return;
    }


    const handleLoadedMetadata =
      () => {

        console.log(
          "[Preview] Timing video loaded"
        );

        console.log(
          "[Preview] Duration:",
          video.duration
        );


        if (
          Number.isFinite(
            video.duration
          )
        ) {

          setDuration(
            video.duration
          );

        }


        video.currentTime =
          0;

        setCurrentTime(
          0
        );

      };


    video.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );


    return () => {

      video.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

    };

  }, [
    videoFile,
    setDuration,
    setCurrentTime,
  ]);


  // =========================================================
  // VIDEO ENDED
  // =========================================================

  useEffect(() => {

    const video =
      videoRef.current;

    if (
      !video ||
      !videoFile
    ) {
      return;
    }


    const handleEnded =
      () => {

        setCurrentTime(
          video.duration || 0
        );

        pause();

      };


    video.addEventListener(
      "ended",
      handleEnded
    );


    return () => {

      video.removeEventListener(
        "ended",
        handleEnded
      );

    };

  }, [
    videoFile,
    setCurrentTime,
    pause,
  ]);


  // =========================================================
  // STORE CURRENT TIME → VIDEO
  //
  // Dùng cho:
  //
  // - timeline
  // - -5s
  // - +5s
  // - seek
  // =========================================================

  useEffect(() => {

    const video =
      videoRef.current;

    if (
      !video ||
      !videoFile
    ) {
      return;
    }


    if (
      !Number.isFinite(
        currentTime
      )
    ) {
      return;
    }


    const difference =
      Math.abs(
        video.currentTime -
        currentTime
      );


    if (
      difference > 0.15
    ) {

      try {

        video.currentTime =
          currentTime;

      }
      catch {

        // Video chưa ready

      }

    }

  }, [
    currentTime,
    videoFile,
  ]);


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="preview">

      <div className="youtube-frame">

        <div className="video-area">


          {/* =================================================
              IMAGE MODE

              Có imageFile:

              - Image = background
              - Video = audio + timing
          ================================================= */}

          {isImageMode && imageFile && (

            <img
              src={imageFile}
              className="preview-background"
              alt="Karaoke background"
              draggable={false}
            />

          )}


          {/* =================================================
              VIDEO

              VIDEO MODE:
              → Hiển thị video

              IMAGE MODE:
              → Ẩn video
              → Chỉ dùng audio + timing
          ================================================= */}

          {videoFile && (

            <video
              ref={videoRef}
              className={
                isImageMode
                  ? "preview-timing-video"
                  : "preview-video"
              }
              playsInline
              preload="auto"
            />

          )}


          {/* =================================================
              KARAOKE
          ================================================= */}

          <div className="karaoke-overlay">

            <KaraokeCanvas />

          </div>


          {/* =================================================
              EMPTY
          ================================================= */}

          {!videoFile && !imageFile && (

            <div className="preview-empty">

              🎬

              <div>
                Import Video or Background Image
              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );
}