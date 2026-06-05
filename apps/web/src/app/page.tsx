import dynamic from "next/dynamic";

const MainAppClient = dynamic(() => import("../components/MainAppClient"), {
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
      Načítání aplikace Praha Odolná / Loading...
    </div>
  )
});

export default function Home() {
  return <MainAppClient />;
}
