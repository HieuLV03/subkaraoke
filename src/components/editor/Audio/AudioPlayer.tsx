import { useEffect, useRef } from "react";

import { useEditorStore } from "@/stores/editor.store";
import { useProjectStore } from "@/stores/project.store";

export default function AudioPlayer() {
    const audioRef =
        useRef<HTMLAudioElement | null>(null);

    // =========================================================
    // PROJECT
    // =========================================================

    const audioFile =
        useProjectStore(
            state => state.project?.audioFile
        );

    // =========================================================
    // EDITOR STATE
    // =========================================================

    const playing =
        useEditorStore(
            state => state.playing
        );

    const currentTime =
        useEditorStore(
            state => state.currentTime
        );

    const playbackRate =
        useEditorStore(
            state => state.playbackRate
        );

    const volume =
        useEditorStore(
            state => state.volume
        );

    const pause =
        useEditorStore(
            state => state.pause
        );

    const setCurrentTime =
        useEditorStore(
            state => state.setCurrentTime
        );

    const setDuration =
        useEditorStore(
            state => state.setDuration
        );

    const setAudioRef =
        useEditorStore(
            state => state.setAudioRef
        );

    // =========================================================
    // AUDIO REF
    // =========================================================

    useEffect(() => {
        setAudioRef(
            audioRef.current
        );

        return () => {
            setAudioRef(null);
        };
    }, [setAudioRef]);

    // =========================================================
    // AUDIO FILE
    //
    // WEB:
    // audioFile có thể là:
    // - blob:http://localhost:5173/...
    // - URL trực tiếp
    //
    // Không còn dùng:
    // http://127.0.0.1:38555
    // =========================================================

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        // Không có audio
        if (!audioFile) {
            audio.pause();
            audio.removeAttribute("src");
            audio.load();

            setCurrentTime(0);
            setDuration(0);

            return;
        }

        console.log(
            "[WEB AUDIO] audioFile =",
            audioFile
        );

        // Audio mới
        pause();

        setCurrentTime(0);
        setDuration(0);

        audio.src = audioFile;
        audio.load();
    }, [
        audioFile,
        pause,
        setCurrentTime,
        setDuration
    ]);

    // =========================================================
    // LOADED METADATA
    // =========================================================

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        const handleLoadedMetadata = () => {
            const duration =
                Number.isFinite(audio.duration)
                    ? audio.duration
                    : 0;

            console.log(
                "[WEB AUDIO] duration =",
                duration
            );

            audio.currentTime = 0;

            setCurrentTime(0);
            setDuration(duration);

            audio.pause();
            pause();
        };

        audio.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
        );

        return () => {
            audio.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
            );
        };
    }, [
        setCurrentTime,
        setDuration,
        pause
    ]);

    // =========================================================
    // PLAY / PAUSE
    //
    // Audio chỉ hoạt động khi project có audioFile.
    // =========================================================

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        if (!audioFile) {
            return;
        }

        if (playing) {
            audio
                .play()
                .catch(error => {
                    console.error(
                        "[WEB AUDIO] Play error:",
                        error
                    );

                    pause();
                });
        } else {
            audio.pause();
        }
    }, [
        playing,
        audioFile,
        pause
    ]);

    // =========================================================
    // SEEK
    // =========================================================

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        if (!audioFile) {
            return;
        }

        if (
            Math.abs(
                audio.currentTime -
                currentTime
            ) > 0.03
        ) {
            try {
                audio.currentTime =
                    currentTime;
            } catch {
                // Audio chưa ready
            }
        }
    }, [
        currentTime,
        audioFile
    ]);

    // =========================================================
    // PLAYBACK RATE
    // =========================================================

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        audio.playbackRate =
            playbackRate;
    }, [
        playbackRate
    ]);

    // =========================================================
    // VOLUME
    // =========================================================

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        audio.volume =
            Math.max(
                0,
                Math.min(
                    1,
                    volume
                )
            );
    }, [
        volume
    ]);

    // =========================================================
    // CURRENT TIME
    //
    // Audio là MASTER khi có audioFile.
    // =========================================================

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        if (!audioFile) {
            return;
        }

        let animationFrame = 0;

        const update = () => {
            if (!audio.paused) {
                setCurrentTime(
                    audio.currentTime
                );
            }

            animationFrame =
                requestAnimationFrame(
                    update
                );
        };

        animationFrame =
            requestAnimationFrame(
                update
            );

        return () => {
            cancelAnimationFrame(
                animationFrame
            );
        };
    }, [
        audioFile,
        setCurrentTime
    ]);

    // =========================================================
    // AUDIO ENDED
    // =========================================================

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        const handleEnded = () => {
            pause();

            setCurrentTime(
                audio.duration || 0
            );
        };

        audio.addEventListener(
            "ended",
            handleEnded
        );

        return () => {
            audio.removeEventListener(
                "ended",
                handleEnded
            );
        };
    }, [
        pause,
        setCurrentTime
    ]);

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <audio
            ref={audioRef}
            preload="auto"
            muted
        />
    );
}