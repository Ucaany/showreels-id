import { Metadata } from "next";
import { EmailLandingPage } from "@/components/email/email-landing-page";

export const metadata: Metadata = {
  title: "Email Support - Showreels.id",
  description: "Tim HR experts kami siap membantu Anda menemukan talenta terbaik",
};

export default function EmailPage() {
  return <EmailLandingPage />;
}
