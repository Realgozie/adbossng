import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (search.includes("scrollTo")) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
