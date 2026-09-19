
"use client";

import "./ExportPage.css";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    useLyricsStore,
} from "@/stores/lyrics.store";

import {
    useEditorStore,
} from "@/stores/editor.store";

import {
    useProjectStore,
} from "@/stores/project.store";

import {
    supabase,
} from "@/lib/supabase";

import {
    exportVideo,
} from "@/services/ffmpeg.service";


export default function ExportPage() {

    const navigate =
        useNavigate();


    // =========================================================
    // LYRICS
    // =========================================================

    const lyrics =
        useLyricsStore(
            state =>
                state.lyrics
        );


    // =========================================================
    // PROJECT
    // =========================================================

    const project =
        useProjectStore(
            state =>
                state.project
        );


    // =========================================================
    // EDITOR
    // =========================================================

    const setWorkspace =
        useEditorStore(
            state =>
                state.setWorkspace
        );

    const duration =
        useEditorStore(
            state =>
                state.duration
        );


    // =========================================================
    // FILE
    // =========================================================

    const videoFile =
        project?.videoFile;


    // =========================================================
    // STATE
    // =========================================================

    const [exporting, setExporting] =
        useState(false);

    const [progress, setProgress] =
        useState(0);

    const [message, setMessage] =
        useState("");

    const [outputPath, setOutputPath] =
        useState("");

    const [session, setSession] =
        useState<any>(null);

    const [authChecking, setAuthChecking] =
        useState(true);


    // =========================================================
    // WORD COUNT
    // =========================================================

    const wordCount =
        useMemo(
            () => {

                return lyrics.reduce(
                    (
                        total,
                        line
                    ) => {

                        return (
                            total +
                            line.words.length
                        );

                    },
                    0
                );

            },
            [lyrics]
        );


    // =========================================================
    // AUTH
    // =========================================================

    useEffect(() => {

        let mounted = true;


        async function loadAuth() {

            try {

                const {
                    data,
                    error,
                } =
                    await supabase.auth.getSession();


                if (!mounted) {
                    return;
                }


                if (error) {

                    console.error(
                        "[EXPORT AUTH ERROR]",
                        error
                    );

                    setSession(null);

                    return;

                }


                setSession(
                    data.session ?? null
                );

            }

            catch (error) {

                console.error(
                    "[EXPORT AUTH ERROR]",
                    error
                );

                if (mounted) {
                    setSession(null);
                }

            }

            finally {

                if (mounted) {
                    setAuthChecking(false);
                }

            }

        }


        loadAuth();


        const {
            data: listener,
        } =
            supabase.auth.onAuthStateChange(
                (
                    event,
                    newSession
                ) => {

                    if (!mounted) {
                        return;
                    }


                    console.log(
                        "[EXPORT AUTH CHANGE]",
                        event,
                        newSession?.user?.email
                    );


                    setSession(
                        newSession ?? null
                    );

                }
            );


        return () => {

            mounted = false;

            listener.subscription.unsubscribe();

        };

    }, []);


    // =========================================================
    // CAN EXPORT
    // =========================================================

    const canExport =
        lyrics.length > 0 &&
        duration > 0 &&
        !!videoFile &&
        !exporting;


    // =========================================================
    // DOWNLOAD
    // =========================================================

    function downloadBlob(
        blob: Blob,
        filename: string
    ) {

        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href =
            url;

        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        window.setTimeout(
            () => {
                URL.revokeObjectURL(
                    url
                );
            },
            1000
        );

    }


    // =========================================================
    // EXPORT
    // =========================================================

    async function handleExport() {

        // =====================================================
        // AUTH
        // =====================================================

        let currentSession =
            session;


        try {

            console.log(
                "[WEB EXPORT] Checking session..."
            );


            const {
                data,
                error,
            } =
                await supabase.auth.getSession();


            if (error) {

                console.error(
                    "[WEB EXPORT] getSession error:",
                    error
                );

                throw new Error(
                    "Không thể kiểm tra phiên đăng nhập."
                );

            }


            currentSession =
                data.session ?? null;


            // =================================================
            // NO SESSION
            // =================================================

            if (!currentSession) {

                console.warn(
                    "[WEB EXPORT] No active session."
                );


                navigate(
                    "/profile",
                    {
                        state: {
                            returnWorkspace:
                                "export",
                        },
                    }
                );


                return;

            }


            // =================================================
            // SESSION
            // =================================================

            const expiresAt =
                currentSession.expires_at ?? 0;

            const now =
                Math.floor(
                    Date.now() / 1000
                );

            const remaining =
                expiresAt - now;


            console.log(
                "[WEB EXPORT] Session:",
                {
                    userId:
                        currentSession.user.id,

                    email:
                        currentSession.user.email,

                    remainingSeconds:
                        remaining,
                }
            );


            // =================================================
            // REFRESH
            // =================================================

            if (remaining < 60) {

                console.log(
                    "[WEB EXPORT] Refreshing session..."
                );


                const {
                    data: refreshData,
                    error: refreshError,
                } =
                    await supabase.auth.refreshSession();


                if (refreshError) {

                    console.error(
                        "[WEB EXPORT] Refresh failed:",
                        refreshError
                    );


                    navigate(
                        "/profile",
                        {
                            state: {
                                returnWorkspace:
                                    "export",
                            },
                        }
                    );


                    return;

                }


                if (!refreshData.session) {

                    navigate(
                        "/profile",
                        {
                            state: {
                                returnWorkspace:
                                    "export",
                            },
                        }
                    );


                    return;

                }


                currentSession =
                    refreshData.session;


                setSession(
                    currentSession
                );

            }


            // =================================================
            // FINAL AUTH CHECK
            // =================================================

            if (
                !currentSession.access_token
            ) {

                throw new Error(
                    "Không tìm thấy access token."
                );

            }


            // =================================================
            // PROJECT CHECK
            // =================================================

            if (!videoFile) {

                throw new Error(
                    "Chưa có video nền."
                );

            }


            if (lyrics.length === 0) {

                throw new Error(
                    "Chưa có lyrics."
                );

            }


            if (duration <= 0) {

                throw new Error(
                    "Chưa xác định được thời lượng video."
                );

            }


            // =================================================
            // START EXPORT
            // =================================================

            setExporting(true);

            setProgress(0);

            setMessage(
                "Đang khởi động FFmpeg..."
            );

            setOutputPath("");


            console.log(
                "========================================"
            );

            console.log(
                "[WEB EXPORT]"
            );

            console.log(
                {
                    userId:
                        currentSession.user.id,

                    email:
                        currentSession.user.email,

                    videoFile,

                    duration,

                    lyrics:
                        lyrics.length,

                    wordCount,

                    width:
                        1280,

                    height:
                        720,

                    fps:
                        30,
                }
            );

            console.log(
                "========================================"
            );


            // =================================================
            // REAL FFMPEG.WASM EXPORT
            // =================================================

            const outputBlob =
                await exportVideo(
                    videoFile,
                    (
                        ffmpegProgress
                    ) => {

                        const safeProgress =
                            Math.max(
                                0,
                                Math.min(
                                    99,
                                    ffmpegProgress
                                )
                            );


                        setProgress(
                            safeProgress
                        );


                        if (
                            safeProgress <= 5
                        ) {

                            setMessage(
                                "Đang tải FFmpeg..."
                            );

                        }

                        else {

                            setMessage(
                                `Đang render video... ${safeProgress}%`
                            );

                        }

                    }
                );


            // =================================================
            // DOWNLOAD
            // =================================================

            const filename =
                `subkaraokeai-${Date.now()}.mp4`;


            downloadBlob(
                outputBlob,
                filename
            );


            // =================================================
            // COMPLETE
            // =================================================

            setProgress(100);

            setMessage(
                "Export thành công!"
            );

            setOutputPath(
                filename
            );


            console.log(
                "[WEB EXPORT] Export completed:",
                filename
            );

        }

        catch (error) {

            console.error(
                "[WEB EXPORT ERROR]",
                error
            );


            setProgress(0);


            if (
                error instanceof Error
            ) {

                setMessage(
                    error.message
                );

            }

            else {

                setMessage(
                    "Export thất bại."
                );

            }

        }

        finally {

            setExporting(false);

        }

    }


    // =========================================================
    // FORMAT
    // =========================================================

    return (

        <div className="export-page">

            <div className="export-content">

                <div className="export-card">


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="export-header">

                        <h2>
                            Export Karaoke Video
                        </h2>

                        <p>
                            Xuất video karaoke hoàn chỉnh
                            với video nền và lyrics.
                        </p>

                    </div>


                    {/* =================================================
                        PROJECT INFORMATION
                    ================================================= */}

                    <div className="export-section">

                        <span className="export-label">
                            Project Information
                        </span>


                        {/* VIDEO */}

                        <div className="export-info-row">

                            <strong>
                                Video Background
                            </strong>

                            <div
                                className={
                                    videoFile
                                        ? "export-info-value"
                                        : "export-info-value missing"
                                }
                            >
                                {videoFile
                                    ? videoFile
                                    : "❌ Chưa chọn video"}
                            </div>

                        </div>


                        {/* AUDIO */}

                        <div className="export-info-row">

                            <strong>
                                Audio
                            </strong>

                            <div className="export-info-value">

                                Sử dụng audio có sẵn
                                trong video nền

                            </div>

                        </div>


                        {/* FORMAT */}

                        <div className="export-info-row">

                            <strong>
                                Format
                            </strong>

                            <div className="export-info-value">

                                MP4 / H.264 + AAC

                            </div>

                        </div>


                        {/* RESOLUTION */}

                        <div className="export-info-row">

                            <strong>
                                Resolution
                            </strong>

                            <div className="export-info-value">

                                1280 × 720

                            </div>

                        </div>


                        {/* FPS */}

                        <div className="export-info-row">

                            <strong>
                                FPS
                            </strong>

                            <div className="export-info-value">

                                30 FPS

                            </div>

                        </div>


                        {/* LYRICS */}

                        <div className="export-info-row">

                            <strong>
                                Lyrics
                            </strong>

                            <div className="export-info-value">

                                {lyrics.length}
                                {" lines · "}
                                {wordCount}
                                {" words"}

                            </div>

                        </div>


                        {/* DURATION */}

                        <div className="export-info-row">

                            <strong>
                                Duration
                            </strong>

                            <div className="export-info-value">

                                {duration > 0
                                    ? `${duration.toFixed(2)} seconds`
                                    : "Chưa có video"}

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        WARNING
                    ================================================= */}

                    {!videoFile && (

                        <div className="export-message">

                            ⚠️ Bạn chưa import video nền.

                        </div>

                    )}


                    {/* =================================================
                        PROGRESS
                    ================================================= */}

                    {exporting && (

                        <div className="export-section">

                            <div className="export-progress-header">

                                <span>
                                    {message}
                                </span>

                                <span>
                                    {progress}%
                                </span>

                            </div>


                            <div className="export-progress">

                                <div
                                    className="export-progress-bar"
                                    style={{
                                        width:
                                            `${progress}%`,
                                    }}
                                />

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        MESSAGE
                    ================================================= */}

                    {!exporting &&
                        message && (

                            <div className="export-message">

                                {message}

                            </div>

                        )}


                    {/* =================================================
                        OUTPUT
                    ================================================= */}

                    {outputPath && (

                        <div className="export-output">

                            <strong>
                                File:
                            </strong>

                            <br />

                            {outputPath}

                        </div>

                    )}

                </div>

            </div>


            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="export-footer">

                <div className="export-footer-inner">


                    {/* PREVIOUS */}

                    <button
                        type="button"
                        className="export-previous-button"
                        disabled={exporting}
                        onClick={() =>
                            setWorkspace(
                                "style"
                            )
                        }
                    >
                        ← Previous
                    </button>


                    {/* EXPORT */}

                    <button
                        type="button"
                        className="export-button"
                        disabled={
                            !canExport ||
                            authChecking
                        }
                        onClick={
                            handleExport
                        }
                    >

                        {exporting
                            ? "Exporting..."
                            : authChecking
                                ? "Checking..."
                                : "Export Karaoke Video"}

                    </button>

                </div>

            </div>

        </div>

    );

}
