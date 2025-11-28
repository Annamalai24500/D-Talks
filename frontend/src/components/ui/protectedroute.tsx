import type { JSX, ReactNode } from "react";
import { useNavigate,Navigate } from "react-router-dom";

export default function Protectedroute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  if (!token || token === "null" || token === "undefined" || token === "") {
    return <Navigate to="/login" replace/>
  }

  return children;
}
