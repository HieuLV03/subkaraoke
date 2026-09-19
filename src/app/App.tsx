import {
  Routes,
  Route
} from "react-router-dom";

import MainLayout from "@/layouts/MainLayout/MainLayout";

import HomePage from "@/pages/HomePages/HomePage";
import EditorPage from "@/pages/EditorPage/EditorPage";
import EditLinePage from "@/pages/EditorPage/EditLinePage/EditLinePage";
import Profile from "@/pages/Profile/Profile";

import NewProjectPage from "@/pages/NewProjectPage/NewProjectPage";
import ManualProjectPage from "@/pages/ManualProjectPage/ManualProjectPage";
import ManualImageProjectPage from "@/pages/ManualImageProjectPage/ManualImageProjectPage";


export default function App() {

  return (

    <>

      {/* =====================================================
          MAIN APP
      ===================================================== */}

      <MainLayout>

        <Routes>

          {/* ================================================
              HOME
          ================================================ */}

          <Route
            path="/"
            element={
              <HomePage />
            }
          />


          {/* ================================================
              NEW PROJECT
          ================================================ */}

          <Route
            path="/new-project"
            element={
              <NewProjectPage />
            }
          />


          {/* ================================================
              MANUAL PROJECT
          ================================================ */}

          <Route
            path="/project/manual"
            element={
              <ManualProjectPage />
            }
          />


          {/* ================================================
              MANUAL IMAGE PROJECT
          ================================================ */}

          <Route
            path="/project/manual-image"
            element={
              <ManualImageProjectPage />
            }
          />


          {/* ================================================
              AI PROJECT
              
              Tạm giữ route để tránh phá routing cũ.
              Sau này sẽ loại bỏ khi hoàn thiện Web.
          ================================================ */}


          {/* ================================================
              PROCESSING
              
              Tạm giữ để tránh phá cấu trúc hiện tại.
              AI sẽ được loại bỏ khỏi Web sau.
          ================================================ */}



          {/* ================================================
              EDITOR - LINES
          ================================================ */}

          <Route
            path="/editor/lines"
            element={
              <EditLinePage />
            }
          />


          {/* ================================================
              EDITOR
          ================================================ */}

          <Route
            path="/editor"
            element={
              <EditorPage />
            }
          />


          {/* ================================================
              PROFILE
          ================================================ */}

          <Route
            path="/profile"
            element={
              <Profile />
            }
          />

        </Routes>

      </MainLayout>

    </>

  );

}