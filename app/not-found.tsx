"use client";

import Link from "next/link";
import { ArrowLeft, House, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const helpfulLinks = [
  {
    title: "Browse Parts",
    description: "Search for auto parts by make and model",
    href: "/search",
  },
  {
    title: "Find Services",
    description: "Book mechanics and garages near you",
    href: "/services",
  },
  {
    title: "Request Quote",
    description: "Get competitive quotes from suppliers",
    href: "/rfq",
  },
  {
    title: "Fleet Dashboard",
    description: "Manage your fleet and procurement",
    href: "/dashboard",
  },
];

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 sm:p-8">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-2xl text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-[#DC2626]/20 bg-[#DC2626]/10">
            <SearchX className="h-12 w-12 text-[#DC2626]" />
          </div>

          <h1 className="mb-4 text-5xl font-bold text-white sm:text-6xl">
            404
          </h1>

          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            Page Not Found
          </h2>

          <p className="mb-8 text-base text-[#9CA3AF] sm:text-xl">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            might have been moved or doesn&apos;t exist.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-2 border-[#2A2A2A] bg-[#1A1A1A] px-6 py-3 text-white hover:border-[#DC2626] hover:bg-[#1A1A1A]"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </Button>

            <Button
              asChild
              className="gap-2 bg-[#DC2626] px-6 py-3 text-white hover:bg-[#B91C1C]"
            >
              <Link href="/">
                <House className="h-5 w-5" />
                Go Home
              </Link>
            </Button>
          </div>

          <Card className="mt-12 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] text-left">
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Helpful Links
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {helpfulLinks.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-4 transition-all hover:border-[#DC2626]"
                  >
                    <h4 className="mb-1 font-semibold text-white transition-colors group-hover:text-[#DC2626]">
                      {item.title}
                    </h4>
                    <p className="text-sm text-[#9CA3AF]">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
