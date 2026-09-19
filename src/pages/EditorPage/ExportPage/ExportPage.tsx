"use client";
import "./ExportPage.css";
import { supabase } from "@/lib/supabase";

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

interface ExportResult {

    canceled?: boolean;

    outputPath?: string;

}


interface ExportProgress {

    progress?: number;

    stage?:
        | "frames"
        | "ffmpeg"
        | "done";

    current?: number;

    total?: number;

    message?: string;

}


export default function ExportPage() {
    const navigate = useNavigate();

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
    // =========================================================


const setWorkspace =
    useEditorStore(
        state =>
            state.setWorkspace
    );
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
    // DURATION
    // =========================================================

 const duration =
    useEditorStore(
        state => state.duration
    );
    // =========================================================
    // FILES
    // =========================================================

    const videoFile =
        project?.videoFile;


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
    // CAN EXPORT
    // =========================================================
useEffect(() => {

    let mounted = true;

    async function loadAuth() {

        try {

            const {
                data,
                error,
            } = await supabase.auth.getSession();

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

        } finally {

            if (mounted) {
                setAuthChecking(false);
            }

        }

    }

    loadAuth();

    const {
        data: listener,
    } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {

            if (!mounted) {
                return;
            }

            console.log(
                "[EXPORT AUTH CHANGE]",
                _event,
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
    const canExport =
        lyrics.length > 0 &&

        duration > 0 &&

        !!videoFile &&

        !exporting;


    // =========================================================
    // PROGRESS LISTENER
    // =========================================================

    useEffect(() => {

        const removeListener =
            window.electronAPI.on<ExportProgress>(

                "export:progress",

                data => {

                    if (
                        typeof data?.progress ===
                        "number"
                    ) {

                        setProgress(

                            Math.max(

                                0,

                                Math.min(

                                    100,

                                    Math.round(
                                        data.progress
                                    )

                                )

                            )

                        );

                    }


                    if (
                        data?.stage ===
                        "frames"
                    ) {

                        if (

                            typeof data.current ===
                            "number" &&

                            typeof data.total ===
                            "number"

                        ) {

                            setMessage(

                                `Đang tạo lyric frame ${data.current}/${data.total}...`

                            );

                        }

                        else {

                            setMessage(
                                "Đang tạo lyric frames..."
                            );

                        }

                    }


                    if (
                        data?.stage ===
                        "ffmpeg"
                    ) {

                        setMessage(
                            "Đang ghép video + audio + lyrics..."
                        );

                    }


                    if (
                        data?.stage ===
                        "done"
                    ) {

                        setProgress(100);

                        setMessage(
                            "Export hoàn tất."
                        );

                    }


                    if (
                        data?.message
                    ) {

                        setMessage(
                            data.message
                        );

                    }

                }

            );


        return () => {

            removeListener?.();

        };

    }, []);


    // =========================================================
    // EXPORT
    // =========================================================

async function handleExport() {

    // ============================================
    // CHECK / REFRESH AUTH SESSION
    // ============================================

    let currentSession = session;

    try {

        console.log(
            "[EXPORT AUTH] Checking current session..."
        );

        const {
            data,
            error,
        } = await supabase.auth.getSession();

        if (error) {

            console.error(
                "[EXPORT AUTH] getSession error:",
                error
            );

            throw new Error(
                "Không thể kiểm tra phiên đăng nhập."
            );

        }

        currentSession =
            data.session ?? null;


        // ============================================
        // NO SESSION
        // ============================================

        if (!currentSession) {

            console.warn(
                "[EXPORT AUTH] No active session."
            );

            navigate("/profile", {
                state: {
                    returnWorkspace: "export",
                },
            });

            return;

        }


        // ============================================
        // CHECK TOKEN EXPIRATION
        // ============================================

        const expiresAt =
            currentSession.expires_at ?? 0;

        const now =
            Math.floor(
                Date.now() / 1000
            );

        const remaining =
            expiresAt - now;


        console.log(
            "[EXPORT AUTH] Token:",
            {
                userId:
                    currentSession.user.id,

                email:
                    currentSession.user.email,

                expiresAt,

                now,

                remainingSeconds:
                    remaining,
            }
        );


        // ============================================
        // REFRESH IF TOKEN EXPIRES SOON
        //
        // Refresh trước 60 giây để tránh token
        // hết hạn ngay trong lúc export.
        // ============================================

        if (remaining < 60) {

            console.log(
                "[EXPORT AUTH] Token expired/expiring soon. Refreshing..."
            );


            const {
                data: refreshData,
                error: refreshError,
            } =
                await supabase.auth.refreshSession();


            if (refreshError) {

                console.error(
                    "[EXPORT AUTH] Refresh failed:",
                    refreshError
                );

                navigate("/profile", {
                    state: {
                        returnWorkspace: "export",
                    },
                });

                return;

            }


            if (!refreshData.session) {

                console.error(
                    "[EXPORT AUTH] Refresh returned no session."
                );

                navigate("/profile", {
                    state: {
                        returnWorkspace: "export",
                    },
                });

                return;

            }


            currentSession =
                refreshData.session;


            console.log(
                "[EXPORT AUTH] Session refreshed successfully.",
                {
                    userId:
                        currentSession.user.id,

                    expiresAt:
                        currentSession.expires_at,
                }
            );


            // Đồng bộ React state
            setSession(
                currentSession
            );

        }


        // ============================================
        // FINAL TOKEN CHECK
        // ============================================

        if (
            !currentSession.access_token
        ) {

            throw new Error(
                "Không tìm thấy access token."
            );

        }


        // ============================================
        // START EXPORT
        // ============================================

        setExporting(true);

        setProgress(0);

        setMessage(
            "Đang chuẩn bị export..."
        );

        setOutputPath("");

console.log(
    "[EXPORT PROJECT]",
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

        tokenLength:
            currentSession.access_token.length,
    }
);

console.log(
    "========== EXPORT LYRICS DETAIL =========="
);

console.log(
    JSON.stringify(
        lyrics,
        null,
        2
    )
);

console.log(
    "=========================================="
);


        // ============================================
        // IPC EXPORT
        // ============================================

        const result =
            await window.electronAPI.invoke<ExportResult>(
                "export:video",
                {
                    videoFile:
                        videoFile!,

                    lyrics,

                    duration,

                    width:
                        1920,

                    height:
                        1080,

                    fps:
                        30,

                    // QUAN TRỌNG:
                    // truyền token mới nhất
                    accessToken:
                        currentSession.access_token,
                }
            );


        // ============================================
        // CANCEL
        // ============================================

        if (
            result?.canceled
        ) {

            setProgress(0);

            setMessage(
                "Đã hủy export."
            );

            return;

        }


        // ============================================
        // SUCCESS
        // ============================================

        if (
            result?.outputPath
        ) {

            setOutputPath(
                result.outputPath
            );

            setProgress(100);

            setMessage(
                "Export hoàn tất."
            );

            return;

        }


        throw new Error(
            "Export không trả về outputPath."
        );

    }

    catch (error) {

        console.error(
            "[EXPORT ERROR]",
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
    // UI
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
                    với video nền, và lyrics.
                </p>

            </div>


            {/* =================================================
                PROJECT INFO
            ================================================= */}

            <div className="export-section">

                <span className="export-label">
                    Project Information
                </span>


                {/* VIDEO */}

                <div>
                    <strong>
                        Video Background
                    </strong>

                    <div
                        style={{
                            marginTop: 4,
                            wordBreak: "break-all",
                            color: videoFile
                                ? "#94a3b8"
                                : "#ef4444",
                            fontSize: 13,
                        }}
                    >
                        {videoFile
                            ? videoFile
                            : "❌ Chưa chọn video"}
                    </div>
                </div>


                {/* AUDIO */}
<div
    style={{
        marginTop: 16,
    }}
>
    <strong>
        Audio
    </strong>

    <div
        style={{
            marginTop: 4,
            color: "#94a3b8",
            fontSize: 13,
        }}
    >
        Sử dụng audio có sẵn trong video nền
    </div>
</div>

                {/* FORMAT */}

                <div
                    style={{
                        marginTop: 16,
                    }}
                >
                    <strong>
                        Format
                    </strong>

                    <div
                        style={{
                            marginTop: 4,
                            color: "#94a3b8",
                            fontSize: 13,
                        }}
                    >
                        MP4 / H.264 + AAC
                    </div>
                </div>


                {/* RESOLUTION */}

                <div
                    style={{
                        marginTop: 12,
                    }}
                >
                    <strong>
                        Resolution
                    </strong>

                    <div
                        style={{
                            marginTop: 4,
                            color: "#94a3b8",
                            fontSize: 13,
                        }}
                    >
                        1920 × 1080
                    </div>
                </div>


                {/* FPS */}

                <div
                    style={{
                        marginTop: 12,
                    }}
                >
                    <strong>
                        FPS
                    </strong>

                    <div
                        style={{
                            marginTop: 4,
                            color: "#94a3b8",
                            fontSize: 13,
                        }}
                    >
                        30 FPS
                    </div>
                </div>


                {/* LYRICS */}

                <div
                    style={{
                        marginTop: 12,
                    }}
                >
                    <strong>
                        Lyrics
                    </strong>

                    <div
                        style={{
                            marginTop: 4,
                            color: "#94a3b8",
                            fontSize: 13,
                        }}
                    >
                        {lyrics.length}
                        {" lines · "}
                        {wordCount}
                        {" words"}
                    </div>
                </div>


                {/* DURATION */}

                <div
                    style={{
                        marginTop: 12,
                    }}
                >
                    <strong>
                        Duration
                    </strong>

                    <div
                        style={{
                            marginTop: 4,
                            color: "#94a3b8",
                            fontSize: 13,
                        }}
                    >
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
                ACTION BUTTONS
            ================================================= */}

            <div
                style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 22,
                }}
            >

                {/* PREVIOUS */}

               

                {/* EXPORT */}

               
            </div>

            {/* =================================================
                PROGRESS
            ================================================= */}

            {exporting && (
                <div className="export-section">

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8,
                            fontSize: 12,
                            color: "#94a3b8",
                        }}
                    >
                        <span>
                            {message}
                        </span>

                        <span>
                            {progress}%
                        </span>
                    </div>

                    <div
                        style={{
                            width: "100%",
                            height: 8,
                            background: "#0f1720",
                            borderRadius: 999,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: `${progress}%`,
                                height: "100%",
                                background:
                                    "linear-gradient(90deg, #0891b2, #22d3ee)",
                                transition: "width 0.15s",
                            }}
                        />
                    </div>

                </div>
            )}

            {/* MESSAGE */}

            {!exporting && message && (
                <div className="export-message">
                    {message}
                </div>
            )}

            {/* OUTPUT */}

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
            FIXED FOOTER
        ================================================= */}

        <div className="export-footer">

            <div className="export-footer-inner">

                {/* PREVIOUS */}

                <button
                    type="button"
                    className="export-previous-button"
                    onClick={() =>
                        setWorkspace("style")
                    }
                >
                    ← Previous
                </button>


                {/* EXPORT */}

                <button
                    type="button"
                    className="export-button"
                    onClick={handleExport}
               
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