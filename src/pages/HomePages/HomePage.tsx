import { useAppStore } from "@/stores/app.store";
import { useNavigate } from "react-router-dom";

import Seo from "@/components/Seo/Seo";

import "./HomePage.css";

export default function HomePage() {

  const appName = useAppStore(
    state => state.appName
  );

  const navigate = useNavigate();


  // ============================================================
  // NEW PROJECT
  // ============================================================

  const handleCreateProject = () => {
    navigate("/new-project");
  };


  return (

    <div className="home-page">

      {/* ======================================================
          SEO
      ====================================================== */}

      <Seo
        title="SubKaraoke – Tạo và chỉnh sửa phụ đề Karaoke online"
        description="SubKaraoke là công cụ tạo, chỉnh sửa và đồng bộ phụ đề Karaoke online. Thêm video, chỉnh sửa lời bài hát, căn chỉnh thời gian và xuất video Karaoke trực tiếp trên trình duyệt."
        canonical="/"
      />


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
          Tạo và chỉnh sửa phụ đề Karaoke online
        </h1>

        <p>
          SubKaraoke là công cụ tạo, chỉnh sửa và đồng bộ
          phụ đề Karaoke trực tuyến. Thêm video, chỉnh sửa
          lời bài hát, căn chỉnh thời gian và xuất video
          Karaoke ngay trên trình duyệt.
        </p>

      </header>


      {/* ======================================================
          NEW PROJECT
      ====================================================== */}

      <div className="welcome">

        <button
          className="card"
          onClick={handleCreateProject}
        >
          ➕ New Project
        </button>

      </div>


      {/* ======================================================
          SEO CONTENT
      ====================================================== */}

      <section className="home-seo-content">

        <h2>
          Tạo video Karaoke online với SubKaraoke
        </h2>

        <p>
          SubKaraoke giúp bạn tạo và chỉnh sửa phụ đề
          Karaoke trực tiếp trên trình duyệt mà không
          cần cài đặt phần mềm chỉnh sửa video phức tạp.
        </p>


        <h2>
          Chỉnh sửa lời bài hát và thời gian Karaoke
        </h2>

        <p>
          Bạn có thể thêm video, chỉnh sửa từng dòng lời
          bài hát, căn chỉnh thời gian hiển thị và tùy
          chỉnh kiểu chữ, màu sắc, vị trí cũng như hiệu
          ứng phụ đề Karaoke.
        </p>


        <h2>
          Xuất video Karaoke
        </h2>

        <p>
          Sau khi hoàn thành phụ đề, bạn có thể xuất
          video Karaoke trực tiếp từ trình duyệt để
          sử dụng và chia sẻ.
        </p>

      </section>


    </div>

  );

}