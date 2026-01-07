"use client";

import { StoreCarousel } from "@/components/store-carousel";
import { ReportsSection } from "@/components/reports-section";
import { WhatsAppButton } from "@/components/whatsapp-button";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Store Carousel */}
        <section className="pt-8 pb-12">
          <StoreCarousel />
        </section>
        
        {/* Reports Section */}
        <section className="pb-12">
          <ReportsSection />
        </section>
      </main>
      
      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
}

