import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-mist">
      <Navbar updates={102} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
