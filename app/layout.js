export const metadata = {
  title: "Sentient 3D Shooter",
  description: "A fun 3D shooter game"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body style={{ margin: 0, padding: 0, overflow: "hidden", background: "#000" }}>
        {children}
      </body>
    </html>
  );
}
