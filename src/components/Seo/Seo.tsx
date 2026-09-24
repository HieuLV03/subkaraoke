import { useEffect } from "react";

type SeoProps = {
  title: string;
  description: string;
  canonical?: string;
};

export default function Seo({
  title,
  description,
  canonical,
}: SeoProps) {

  useEffect(() => {

    // ============================================================
    // TITLE
    // ============================================================

    document.title = title;


    // ============================================================
    // META
    // ============================================================

    const setMeta = (
      name: string,
      content: string
    ) => {

      let meta = document.querySelector(
        `meta[name="${name}"]`
      ) as HTMLMetaElement | null;

      if (!meta) {

        meta = document.createElement("meta");

        meta.name = name;

        document.head.appendChild(meta);

      }

      meta.content = content;
    };


    setMeta(
      "description",
      description
    );


    // ============================================================
    // CANONICAL
    // ============================================================

    if (canonical) {

      let link = document.querySelector(
        'link[rel="canonical"]'
      ) as HTMLLinkElement | null;


      if (!link) {

        link = document.createElement("link");

        link.rel = "canonical";

        document.head.appendChild(link);

      }


      // Nếu truyền "/"
      // thì chuyển thành URL đầy đủ theo domain hiện tại.

      link.href = new URL(
        canonical,
        window.location.origin
      ).href;

    }

  }, [
    title,
    description,
    canonical,
  ]);


  return null;
}