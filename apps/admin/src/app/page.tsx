import dynamic from "next/dynamic";

const AdminAppClient = dynamic(() => import("../components/AdminAppClient"), {
  ssr: false,
  loading: () => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      backgroundColor: "#060913",
      color: "#94a3b8",
      fontFamily: "sans-serif",
      fontSize: "18px",
      fontWeight: "500"
    }}>
      Načítání administrace / Loading Admin...
    </div>
  )
});

export default function AdminHome() {
  return <AdminAppClient />;
}
