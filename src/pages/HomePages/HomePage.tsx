import { useAppStore } from "@/stores/app.store";

import { useNavigate } from "react-router-dom";

import "./HomePage.css";

export default function HomePage() {

  const appName =
    useAppStore(
      state => state.appName
    );

  const navigate =
    useNavigate();


  // ============================================================
  // NEW PROJECT
  // ============================================================

const handleCreateProject = () => {
  navigate("/new-project");
};


  return (

    <div className="home-page">


      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="home-toolbar">


        {/* LEFT */}

        <div className="home-toolbar-left">

          <div className="toolbar-title">

            <strong>
              {appName}
            </strong>

            <span>
              Home
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
            🏠 Home9
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
          NEW PROJECT
      ====================================================== */}

      <div className="welcome">

        <button
          className="card"
          onClick={
            handleCreateProject
          }
        >
          ➕ New Project
        </button>

      </div>


    </div>

  );

}