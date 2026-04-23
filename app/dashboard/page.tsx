"use client";

import { StoreCarousel } from "@/components/store-carousel";
import { ReportsSection } from "@/components/reports-section";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { IfoodDashboard } from "@/components/ifood/IfoodDashboard";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black">
      <main className="w-full px-4 sm:px-6 lg:px-8">
        {/* iFood Dashboard */}
        <section className="pt-8 pb-8">
          <IfoodDashboard />
        </section>

        {/* Divisor */}
        <div className="border-t border-[#1f1f20] mb-8" />

        {/* Store Carousel (Saipos) */}
        <section className="pb-10">
          <StoreCarousel />
        </section>

        {/* Reports Section (Saipos) */}
        <section className="pb-12">
          <ReportsSection />
        </section>
      </main>

      <WhatsAppButton />
    </div>
  );
}

