import { useAppStore } from "@/stores/app.store";
import { useProjectStore } from "@/stores/project.store";

import { importVideo } from "@/services/video.service";

import { useNavigate } from "react-router-dom";

import "./ManualProjectPage.css";

export default function ManualProjectPage() {
  const appName = useAppStore(
    (state) => state.appName
  );

  const navigate = useNavigate();

  const project = useProjectStore(
    (state) => state.project
  );

  const setVideoFile = useProjectStore(
    (state) => state.setVideoFile
  );


  // ============================================================
  // IMPORT VIDEO
  // ============================================================

  const handleImportVideo = async () => {
    if (!project) return;

    const file = await importVideo();

    if (!file) return;

    console.log(
      "[MANUAL WEB] Video:",
      file.name
    );

    // Browser không có filesystem path như Electron.
    // Tạo một URL tạm từ File để <video> có thể phát trực tiếp.
    const videoUrl = URL.createObjectURL(file);

    console.log(
      "[MANUAL WEB] Video URL:",
      videoUrl
    );

    setVideoFile(videoUrl);
  };


  // ============================================================
  // START MANUAL EDITOR
  // ============================================================

  const handleStartEditor = () => {
    if (!project) return;

    if (!project.videoFile) {
      return;
    }

    console.log(
      "========================================"
    );

    console.log(
      "[MANUAL WEB] START EDITOR"
    );

    console.log(
      "[MANUAL WEB] Video:",
      project.videoFile
    );

    console.log(
      "========================================"
    );

    navigate("/editor");
  };


  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {
    navigate("/new-project");
  };


  // ============================================================
  // NO PROJECT
  // ============================================================

  if (!project) {
    navigate("/new-project");

    return null;
  }


  return (
    <div className="manual-project-page">

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="home-toolbar">

        {/* LEFT */}

        <div className="home-toolbar-left">

          <button
            className="toolbar-back"
            onClick={handleBack}
          >
            ←
          </button>

          <div className="toolbar-title">

            <strong>
              {appName}
            </strong>

            <span>
              Manual Project
            </span>

          </div>

        </div>


        {/* CENTER */}

        <div className="home-toolbar-center">

          <button
            className="toolbar-btn active"
            onClick={() => navigate("/")}
          >
            🏠 Home
          </button>

        </div>


        {/* RIGHT */}

        <div className="home-toolbar-right">

          <button
            className="toolbar-profile-btn"
            onClick={() => navigate("/profile")}
          >

            <span className="toolbar-profile-icon">
              👤
            </span>

            <span className="toolbar-profile-text">
              Profile
            </span>

          </button>

        </div>

      </div>


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="home-header">

        <h1>
          {appName}
        </h1>

        <p>
          Manual Karaoke Editor
        </p>

      </header>


      {/* ======================================================
          WORKSPACE
      ====================================================== */}

      <div className="manual-workspace">


        {/* ==================================================
            PROJECT HEADER
        ================================================== */}

        <div className="manual-workspace-header">

          <h2>
            {project.name}
          </h2>

          <span className="manual-badge">
            ✏️ Manual
          </span>

        </div>


        {/* ==================================================
            STEP INDICATOR
        ================================================== */}

        <div className="manual-workflow">

          {/* VIDEO */}

          <div
            className={
              project.videoFile
                ? "manual-workflow-step completed"
                : "manual-workflow-step active"
            }
          />

          {/* EDITOR */}

          <div
            className={
              project.videoFile
                ? "manual-workflow-step active"
                : "manual-workflow-step disabled"
            }
          />

        </div>


        {/* ==================================================
            DASHBOARD
        ================================================== */}

        <div className="manual-dashboard">


          {/* =================================================
              VIDEO
          ================================================= */}

          <button
            className="manual-card"
            onClick={handleImportVideo}
          >

            <div className="manual-card-icon">
              🎬
            </div>

            <div className="manual-card-content">

              <strong>
                {project.videoFile
                  ? "Change Video Background"
                  : "Import Video Background"
                }
              </strong>

              <span>
                {project.videoFile
                  ? "Choose another video"
                  : "Select the video you want to use as the karaoke background"
                }
              </span>

            </div>

            <div className="manual-card-arrow">
              →
            </div>

          </button>


          {/* =================================================
              START EDITOR
          ================================================= */}

          <button
            className="manual-card manual-start-card"
            disabled={!project.videoFile}
            onClick={handleStartEditor}
          >

            <div className="manual-card-icon">
              ✏️
            </div>

            <div className="manual-card-content">

              <strong>

                {!project.videoFile
                  ? "Import Video First"
                  : "Bắt đầu"
                }

              </strong>

            </div>

            <div className="manual-card-arrow">
              →
            </div>

          </button>


        </div>


        {/* ==================================================
            MESSAGE
        ================================================== */}


        {project.videoFile && (

          <p className="manual-workflow-message success">

            ✅ Video is ready.
            You can now open the editor and create
            your lyrics manually.

          </p>

        )}


      </div>

    </div>
  );
}