import dynamic from "next/dynamic";

const MainAppClient = dynamic(() => import("../components/MainAppClient"), {
  ssr: false,
  loading: () => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      backgroundColor: "var(--bg-canvas)",
      color: "var(--text-secondary)",
      fontFamily: "var(--font-sans), sans-serif",
      fontSize: "18px",
      fontWeight: "500"
    }}>
      Loading Prague Resilient...
    </div>
  )
});

export default function Home() {
  return <MainAppClient />;
}
