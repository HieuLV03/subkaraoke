
import { useAppStore } from "@/stores/app.store";
import { useProjectStore } from "@/stores/project.store";

import { useNavigate } from "react-router-dom";

import "./NewProjectPage.css";

export default function NewProjectPage() {

  const appName =
    useAppStore(
      state => state.appName
    );

  const navigate =
    useNavigate();

  const createProject =
    useProjectStore(
      state => state.createProject
    );


  // ============================================================
  // ============================================================



  // ============================================================
  // MANUAL VIDEO KARAOKE
  // ============================================================

  const handleManualProject = () => {

    createProject(
      "New Karaoke Project"
    );

    navigate("/project/manual");

  };


  // ============================================================
  // MANUAL IMAGE KARAOKE
  // ============================================================

  const handleManualImageProject = () => {

    createProject(
      "New Image Karaoke Project"
    );

    navigate("/project/manual-image");

  };


  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {

    navigate("/");

  };


  return (

    <div className="new-project-page">


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
              New Project
            </span>

          </div>

        </div>


        {/* CENTER */}

        <div className="home-toolbar-center">

          <button
            className="toolbar-btn active"
            onClick={
              handleBack
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

  

      </header>


      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="new-project-workspace">


        <div className="new-project-header">

          <h2>
            Create New Project
          </h2>

          <p>
            Choose how you want to create your karaoke project.
          </p>

        </div>


        {/* ==================================================
            PROJECT OPTIONS
        ================================================== */}

        <div className="project-options">


          {/* =================================================
          ================================================= */}


          {/* =================================================
              MANUAL VIDEO KARAOKE
          ================================================= */}

          <button
            className="project-option-card manual-option"
            onClick={
              handleManualProject
            }
          >

            <div className="project-option-icon">
              ✏️
            </div>


            <div className="project-option-content">

              <h3>
                Manual Karaoke
              </h3>

              <p>
                Skip AI processing and go directly
                to the editor. You can add and sync
                lyrics manually.
              </p>

              <span className="project-option-flow">

                Import Video
                {" → "}
                Editor

              </span>

            </div>


            <div className="project-option-arrow">
              →
            </div>

          </button>


          {/* =================================================
              MANUAL IMAGE KARAOKE
          ================================================= */}

          <button
            className="project-option-card image-option"
            onClick={
              handleManualImageProject
            }
          >

            <div className="project-option-icon">
              🖼️
            </div>


            <div className="project-option-content">

              <h3>
                Image Karaoke
              </h3>

              <p>
                Use a video as the timing and audio source,
                while using your own image as the karaoke
                background.
              </p>

              <span className="project-option-flow">

                Import Video
                {" → "}
                Import Image
                {" → "}
                Editor

              </span>

            </div>


            <div className="project-option-arrow">
              →
            </div>

          </button>


        </div>


        {/* ==================================================
            INFORMATION
        ================================================== */}

        <div className="new-project-info">

          <p>
            💡 You can choose AI, Manual Video or Image
            Karaoke mode for each project.
          </p>

        </div>


      </div>

    </div>

  );

}
