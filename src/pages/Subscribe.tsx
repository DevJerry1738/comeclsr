import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  duration_days: number;
  is_active: boolean;
}

export default function SubscribePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch active subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["subscription_plans_active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("amount", { ascending: true });
      return (data || []) as SubscriptionPlan[];
    },
    enabled: !!user,
  });

  // Auto-select first plan
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[0].id);
    }
  }, [plans, selectedPlan]);

  const checkScroll = () => {
    if (carouselRef.current) {
      setCanScrollLeft(carouselRef.current.scrollLeft > 0);
      setCanScrollRight(
        carouselRef.current.scrollLeft <
          carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [plans]);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 320;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  const proceedToPayment = () => {
    if (!selectedPlan) {
      alert("Please select a plan");
      return;
    }
    const plan = plans.find((p) => p.id === selectedPlan);
    if (plan) {
      navigate("/payment-confirmation", {
        state: {
          plan: {
            id: plan.id,
            name: plan.name,
            amount: plan.amount,
            duration_days: plan.duration_days,
          },
        },
      });
    }
  };

  if (!user) return null;

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 flex items-center justify-center">
        <div className="text-white">Loading subscription plans...</div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No active subscription plans available</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-semibold">Choose Your Plan</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Subscribe to ComeClsr
          </h2>
          <p className="text-neutral-400 text-lg">
            Choose the perfect plan for your needs
          </p>
        </div>

        {/* Plans Carousel */}
        <div className="relative mb-12">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Carousel */}
          <div
            ref={carouselRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-2 px-2"
            style={{ scrollBehavior: "smooth" }}
          >
            {plans.map((plan, index) => {
              const isSelected = selectedPlan === plan.id;
              const isPopular = index === 1; // Middle plan is popular

              return (
                <div
                  key={plan.id}
                  className="flex-shrink-0 w-80 animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <Card
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`cursor-pointer transition-all duration-300 h-full flex flex-col relative ${
                      isSelected
                        ? "border-rose-500 bg-gradient-to-b from-rose-500/10 to-neutral-900/60 shadow-lg shadow-rose-500/20 scale-105"
                        : "border-neutral-700 bg-neutral-900/60 hover:border-rose-500/50 hover:bg-neutral-800/50"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-6">
                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-rose-400">
                            ${plan.amount.toFixed(2)}
                          </span>
                          <span className="text-neutral-400">
                            /{plan.duration_days} days
                          </span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-300">
                            {plan.duration_days} day access
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-300">
                            Chat with assigned agent
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-300">
                            Priority support
                          </span>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className="pt-4 mt-auto">
                        {isSelected && (
                          <div className="text-center py-2 px-3 bg-rose-500/20 border border-rose-500 rounded-lg">
                            <span className="text-rose-300 font-semibold flex items-center justify-center gap-2">
                              <Check className="w-4 h-4" />
                              Selected
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Terms & Conditions */}
        <Card className="bg-neutral-900/60 border-neutral-800 mb-8">
          <CardContent className="pt-6">
            <label className="flex items-start p-4 border border-neutral-700 rounded-lg cursor-pointer hover:border-rose-500/50 hover:bg-neutral-800/50 transition">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mr-4 mt-1"
              />
              <span className="text-sm text-neutral-300">
                I agree that admin will contact me via email with payment details. I understand that subscription access will be granted after payment confirmation.
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 max-w-md mx-auto">
          <Button
            variant="outline"
            className="flex-1 border-neutral-700"
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-6"
            disabled={!selectedPlan || !termsAccepted}
            onClick={proceedToPayment}
          >
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
