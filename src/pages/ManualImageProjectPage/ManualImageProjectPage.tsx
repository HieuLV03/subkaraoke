import { useAppStore } from "@/stores/app.store";
import { useProjectStore } from "@/stores/project.store";

import { importVideo } from "@/services/video.service";
import { importImage } from "@/services/image.service";

import { useNavigate } from "react-router-dom";

import "./ManualImageProjectPage.css";

export default function ManualImageProjectPage() {

  const appName =
    useAppStore(
      state => state.appName
    );

  const navigate =
    useNavigate();

  const project =
    useProjectStore(
      state => state.project
    );

  const setVideoFile =
    useProjectStore(
      state => state.setVideoFile
    );

  const setImageFile =
    useProjectStore(
      state => state.setImageFile
    );


  // ============================================================
  // IMPORT TIMING VIDEO
  // ============================================================

  const handleImportVideo = async () => {

    if (!project) return;

    const file =
      await importVideo();

    if (!file) return;

    console.log(
      "[MANUAL IMAGE] Timing video:",
      file.name
    );

    // Browser Web:
    // File -> Blob URL
    const videoUrl =
      URL.createObjectURL(file);

    console.log(
      "[MANUAL IMAGE] Timing video URL:",
      videoUrl
    );

    setVideoFile(
      videoUrl
    );
  };


  // ============================================================
  // IMPORT BACKGROUND IMAGE
  // ============================================================

  const handleImportImage = async () => {

    if (!project) return;

    const file =
      await importImage();

    if (!file) return;

    console.log(
      "[MANUAL IMAGE] Background image:",
      file.name
    );

    // Browser Web:
    // File -> Blob URL
    const imageUrl =
      URL.createObjectURL(file);

    console.log(
      "[MANUAL IMAGE] Background image URL:",
      imageUrl
    );

    setImageFile(
      imageUrl
    );
  };


  // ============================================================
  // START EDITOR
  // ============================================================

  const handleStartEditor = () => {

    if (!project) return;

    if (!project.videoFile) {
      return;
    }

    if (!project.imageFile) {
      return;
    }

    console.log(
      "========================================"
    );

    console.log(
      "[MANUAL IMAGE] START EDITOR"
    );

    console.log(
      "[MANUAL IMAGE] Timing Video:",
      project.videoFile
    );

    console.log(
      "[MANUAL IMAGE] Background Image:",
      project.imageFile
    );

    console.log(
      "========================================"
    );

    navigate(
      "/editor"
    );
  };


  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {

    navigate(
      "/new-project"
    );

  };


  // ============================================================
  // NO PROJECT
  // ============================================================

  if (!project) {

    navigate(
      "/new-project"
    );

    return null;

  }


  // ============================================================
  // WORKFLOW STATUS
  // ============================================================

  const hasVideo =
    Boolean(
      project.videoFile
    );

  const hasImage =
    Boolean(
      project.imageFile
    );

  const canStartEditor =
    hasVideo &&
    hasImage;


  return (

    <div className="manual-image-project-page">


      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="home-toolbar">


        {/* LEFT */}

        <div className="home-toolbar-left">

          <button
            className="toolbar-back"
            onClick={
              handleBack
            }
          >
            ←
          </button>


          <div className="toolbar-title">

            <strong>
              {appName}
            </strong>

            <span>
              Image Karaoke
            </span>

          </div>

        </div>


        {/* CENTER */}

        <div className="home-toolbar-center">

          <button
            className="toolbar-btn active"
            onClick={() =>
              navigate("/")
            }
          >
            🏠 Home
          </button>

        </div>


        {/* RIGHT */}

        <div className="home-toolbar-right">

          <button
            className="toolbar-profile-btn"
            onClick={() =>
              navigate("/profile")
            }
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
          Image Background Karaoke Editor
        </p>

      </header>


      {/* ======================================================
          WORKSPACE
      ====================================================== */}

      <div className="manual-image-workspace">


        {/* ==================================================
            PROJECT HEADER
        ================================================== */}

        <div className="manual-image-workspace-header">

          <h2>
            {project.name}
          </h2>

          <span className="manual-image-badge">
            🖼️ Image
          </span>

        </div>


        {/* ==================================================
            STEP INDICATOR
        ================================================== */}

        <div className="manual-image-workflow">


          {/* VIDEO */}

          <div className="manual-image-workflow-item">

            <div
              className={
                hasVideo
                  ? "manual-image-workflow-step completed"
                  : "manual-image-workflow-step active"
              }
            />

            <span>
              Video
            </span>

          </div>


          <div className="manual-image-workflow-line" />


          {/* IMAGE */}

          <div className="manual-image-workflow-item">

            <div
              className={
                hasImage
                  ? "manual-image-workflow-step completed"
                  : hasVideo
                    ? "manual-image-workflow-step active"
                    : "manual-image-workflow-step disabled"
              }
            />

            <span>
              Image
            </span>

          </div>


          <div className="manual-image-workflow-line" />


          {/* EDITOR */}

          <div className="manual-image-workflow-item">

            <div
              className={
                canStartEditor
                  ? "manual-image-workflow-step active"
                  : "manual-image-workflow-step disabled"
              }
            />

            <span>
              Editor
            </span>

          </div>

        </div>


        {/* ==================================================
            DASHBOARD
        ================================================== */}

        <div className="manual-image-dashboard">


          {/* =================================================
              TIMING VIDEO
          ================================================= */}

          <button
            className={
              "manual-image-card" +
              (
                hasVideo
                  ? " completed"
                  : ""
              )
            }
            onClick={
              handleImportVideo
            }
          >

            <div className="manual-image-card-icon">
              🎬
            </div>


            <div className="manual-image-card-content">

              <strong>

                {hasVideo
                  ? "Change Timing Video"
                  : "Import Timing Video"
                }

              </strong>


              <span>

                {hasVideo

                  ? "Choose another video to listen to and synchronize your lyrics"

                  : "Import the video containing the music you will use for timing"

                }

              </span>

            </div>


            <div className="manual-image-card-status">

              {hasVideo
                ? "✓"
                : "→"
              }

            </div>

          </button>


          {/* =================================================
              BACKGROUND IMAGE
          ================================================= */}

          <button
            className={
              "manual-image-card" +
              (
                hasImage
                  ? " completed"
                  : ""
              )
            }
            onClick={
              handleImportImage
            }
          >

            <div className="manual-image-card-icon">
              🖼️
            </div>


            <div className="manual-image-card-content">

              <strong>

                {hasImage
                  ? "Change Background Image"
                  : "Import Background Image"
                }

              </strong>


              <span>

                {hasImage

                  ? "Choose another image for your karaoke background"

                  : "This image will be displayed as the background during editing and export"

                }

              </span>

            </div>


            <div className="manual-image-card-status">

              {hasImage
                ? "✓"
                : "→"
              }

            </div>

          </button>


          {/* =================================================
              START EDITOR
          ================================================= */}

          <button
            className={
              "manual-image-card manual-image-start-card" +
              (
                canStartEditor
                  ? " ready"
                  : ""
              )
            }
            disabled={
              !canStartEditor
            }
            onClick={
              handleStartEditor
            }
          >

            <div className="manual-image-card-icon">
              ✏️
            </div>


            <div className="manual-image-card-content">

              <strong>

                {!hasVideo

                  ? "Vui lòng chọn Video timing"

                  : !hasImage

                    ? "Vui lòng chọn Image làm Background"

                    : "Bắt đầu"

                }

              </strong>


              <span>

                {!hasVideo

                  ? "Import the timing video before opening the editor"

                  : !hasImage

                    ? "Import a background image before opening the editor"

                    : "Create and synchronize your karaoke lyrics"

                }

              </span>

            </div>


            <div className="manual-image-card-status">
              →
            </div>

          </button>


        </div>


        {canStartEditor && (

          <p className="manual-image-workflow-message success">

            ✅ Video and background image are ready.
            You can now open the editor.

          </p>

        )}


        {/* ==================================================
            INFO
        ================================================== */}

        <div className="manual-image-info">


        </div>


      </div>

    </div>

  );

}