export const metadata = {
  title: "Sentient 3D Shooter",
  description: "A fun shooter game made with Three.js and Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body style={{ margin: 0, backgroundColor: "black" }}>{children}</body>
    </html>
  );
}
