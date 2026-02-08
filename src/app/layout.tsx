import "./globals.css";
import { TopNav } from "@/components/TopNav";

export const metadata = {
  title: "HomeSocial MVP",
  description: "Video-first home listings + social interaction"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
