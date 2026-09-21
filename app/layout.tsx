import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mermer - Taş Atölyeleri için Profesyonel Yerleşim Çözümü",
  description: "Mermer ve granit plakaları fotoğrafla kalibre edin, şablon parçalarını yerleştirin, damarları eşleştirin ve CNC için DXF çıktısı alın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
