"use client";

import "./EditorPage.css";
import {
    useNavigate,
} from "react-router-dom";
import { useEditorStore } from "@/stores/editor.store";

import Preview from "@/components/editor/Preview/Preview";
import AudioPlayer from "@/components/editor/Audio/AudioPlayer";
import AudioPanel from "@/components/editor/Audio/AudioPanel";
import SyncRecorder from "@/components/karaoke/SyncRecorder";

import EditLinePage from "./EditLinePage/EditLinePage";
import TimingPage from "./TimingPage/TimingPage";
import StylePage from "./StylePage/StylePage";
import ExportPage from "./ExportPage/ExportPage";


export default function EditorPage() {

    console.count("EditorPage render");
const navigate = useNavigate();

    // ==========================================
    // WORKSPACE
    // ==========================================

    const currentWorkspace =
        useEditorStore(
            state => state.currentWorkspace
        );


    return (

        <div className="editor-page">


            {/* ==================================
                PREVIEW + AUDIO
            ================================== */}

            <div className="editor-top">

                <div className="editor-audio">

                    <AudioPlayer />

                    <SyncRecorder />

                    <AudioPanel />

                </div>


                <div className="editor-preview">

                    <Preview />

                </div>

            </div>



            {/* ==================================
                WORKSPACE
            ================================== */}

            <div className="editor-lyrics">

                {currentWorkspace === "line" && (
                    <EditLinePage />
                )}


                {currentWorkspace === "timing" && (
                    <TimingPage />
                )}


                {currentWorkspace === "style" && (
                    <StylePage />
                )}


                {currentWorkspace === "export" && (
                    <ExportPage />
                )}


            </div>



            {/* ==================================
                TOOLBAR
            ================================== */}

 {/* ==================================
    TOOLBAR
================================== */}

<div className="editor-toolbar">

    {/* EDIT LINE */}

    <button
        className={
            currentWorkspace === "line"
                ? "active disabled-workspace"
                : "disabled-workspace"
        }
        disabled
    >
        Edit Line
    </button>


    {/* TIMING */}

    <button
        className={
            currentWorkspace === "timing"
                ? "active disabled-workspace"
                : "disabled-workspace"
        }
        disabled
    >
        Timing
    </button>


    {/* STYLE */}

    <button
        className={
            currentWorkspace === "style"
                ? "active disabled-workspace"
                : "disabled-workspace"
        }
        disabled
    >
        Style
    </button>


    {/* EXPORT */}

    <button
        className={
            currentWorkspace === "export"
                ? "active disabled-workspace"
                : "disabled-workspace"
        }
        disabled
    >
        Export
    </button>
<button
    type="button"
    className="profile-workspace-btn"
    onClick={() =>
        navigate("/profile", {
            state: {
                returnWorkspace: currentWorkspace,
            },
        })
    }
>
    PROFILE
</button>
    {/* PROFILE */}

</div>

        </div>

    );

}