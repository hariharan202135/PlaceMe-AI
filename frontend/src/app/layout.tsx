import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = { className: "font-sans" };
const geistMono = { className: "font-mono" };

export const metadata: Metadata = {
  title: "PlaceMe AI | Production-Ready AI Placement Prep",
  description: "Accelerate your placements at TCS, Infosys, Wipro, and Accenture. Features AI-powered mock HR interviews, ATS resume checkers, code compilers, and diagnostic mock tests.",
};

import GoogleProvider from "@/components/GoogleProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.className} ${geistMono.className} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider>
          <GoogleProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </GoogleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
