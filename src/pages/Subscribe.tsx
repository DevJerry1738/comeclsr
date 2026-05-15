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

  // Check for pending payment requests
  const { data: pendingPaymentData } = useQuery({
    queryKey: ["payment_check_pending", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("payment_check_pending_for_user");
      if (error) throw error;
      return data as { pending_count: number } | null;
    },
    enabled: !!user,
  });

  const hasPendingPayment = !!(pendingPaymentData && (pendingPaymentData as any)?.pending_count > 0);

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
          <div className="text-neutral-400 font-medium">Loading premium plans...</div>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-6 text-neutral-400">No active subscription plans available</p>
          <Button onClick={() => navigate("/")} variant="outline" className="border-neutral-800 hover:bg-white/5">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-rose-500/30 overflow-x-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 pointer-events-none">
          <img 
            src="/subscription_bg_abstract_1778619827696.png" 
            alt="" 
            className="w-full h-full object-cover mix-blend-screen grayscale opacity-30"
          />
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-2xl px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-neutral-400 hover:text-white hover:bg-white/5 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Subscription</h1>
              <p className="text-xs text-neutral-500">Elevate your experience</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Title Section */}
        <div className="text-center mb-20 space-y-4 animate-fade-in">
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 px-4 py-1 mb-2 hover:bg-rose-500/20 transition-colors">
            Premium Access
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Choose Your <span className="gradient-text">Journey</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Unlock exclusive features and personalized support with our premium subscription plans.
          </p>
        </div>

        {/* Plans Grid/Carousel */}
        <div className="relative mb-20">
          {/* Navigation Arrows (Visible only on mobile/small screens if scrolling is needed) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none z-10 px-2 md:hidden">
            {canScrollLeft && (
              <button
                onClick={() => scroll("left")}
                className="pointer-events-auto p-3 rounded-full bg-black/60 border border-white/10 text-white backdrop-blur-md shadow-2xl hover:scale-110 transition-transform"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll("right")}
                className="pointer-events-auto p-3 rounded-full bg-black/60 border border-white/10 text-white backdrop-blur-md shadow-2xl hover:scale-110 transition-transform"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div
            ref={carouselRef}
            onScroll={checkScroll}
            className="flex md:grid md:grid-cols-3 gap-8 overflow-x-auto md:overflow-visible scrollbar-hide pb-8 px-2"
          >
            {plans.map((plan, index) => {
              const isSelected = selectedPlan === plan.id;
              const isPopular = index === 1; // Middle plan as popular

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`group relative flex-shrink-0 w-[320px] md:w-full cursor-pointer transition-all duration-500 ease-out animate-slide-up`}
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <div className={`absolute inset-0 rounded-[2rem] transition-opacity duration-500 ${
                    isSelected ? "bg-rose-500/20 blur-3xl opacity-50" : "opacity-0 group-hover:opacity-20 bg-rose-500/10 blur-2xl"
                  }`}></div>
                  
                  <Card
                    className={`relative overflow-hidden h-full flex flex-col rounded-[2rem] border transition-all duration-500 glass-card ${
                      isSelected
                        ? "border-rose-500 bg-rose-500/10 shadow-2xl glow-rose scale-[1.02] translate-y-[-8px]"
                        : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    } backdrop-blur-xl`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-0 overflow-hidden w-32 h-32 pointer-events-none">
                        <div className="absolute top-4 right-[-35px] rotate-45 bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-bold py-1 px-10 text-center uppercase tracking-widest shadow-lg">
                          Popular
                        </div>
                      </div>
                    )}

                    <CardHeader className="pt-10 pb-6 px-8">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className={`text-2xl font-bold tracking-tight ${isSelected ? "text-rose-400" : "text-white"}`}>
                          {plan.name}
                        </CardTitle>
                        {isSelected && (
                          <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center animate-in zoom-in duration-300">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-black tracking-tighter transition-colors ${isSelected ? "text-white" : "text-neutral-200"}`}>
                          ${plan.amount.toFixed(0)}
                        </span>
                        <span className="text-neutral-500 font-medium">.{(plan.amount % 1).toFixed(2).split('.')[1]}</span>
                        <span className="text-neutral-500 ml-1 text-sm">/ {plan.duration_days} days</span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 px-8 pb-10 space-y-8">
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      
                      <div className="space-y-4">
                        <FeatureItem isSelected={isSelected} text={`${plan.duration_days} Days Full Access`} />
                        <FeatureItem isSelected={isSelected} text="Direct Agent Chat Line" />
                        <FeatureItem isSelected={isSelected} text="Priority Ticket Handling" />
                        <FeatureItem isSelected={isSelected} text="Advanced Content Unlocks" />
                        <FeatureItem isSelected={isSelected} text="Zero Ad Interruptions" />
                      </div>

                      <div className="pt-4">
                        <div className={`w-full py-4 rounded-2xl text-center font-bold tracking-wide transition-all duration-300 ${
                          isSelected 
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg" 
                            : "bg-white/5 text-neutral-400 group-hover:bg-white/10 group-hover:text-white"
                        }`}>
                          {isSelected ? "Plan Selected" : "Select Plan"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terms & Confirmation Section */}
        <div className="max-w-2xl mx-auto space-y-12 animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
          {hasPendingPayment && (
            <div className="p-6 rounded-3xl border border-amber-500/50 bg-amber-500/5 flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center mt-1">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              </div>
              <div>
                <p className="font-semibold text-amber-400 mb-1">Pending Payment Request</p>
                <p className="text-sm text-amber-200">
                  You have a pending payment request awaiting admin review. Please wait for payment confirmation before submitting a new request.
                </p>
              </div>
            </div>
          )}
          
          <div 
            onClick={() => setTermsAccepted(!termsAccepted)}
            className={`group flex items-start gap-5 p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${
              termsAccepted 
                ? "border-rose-500/50 bg-rose-500/5" 
                : "border-white/5 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
              termsAccepted ? "bg-rose-500 border-rose-500" : "border-neutral-700 group-hover:border-neutral-500"
            }`}>
              {termsAccepted && <Check className="w-4 h-4 text-white" />}
            </div>
            <p className="text-sm leading-relaxed text-neutral-400 group-hover:text-neutral-300 transition-colors">
              I acknowledge that upon selection, an administrator will reach out via my registered email with secure payment instructions. Full premium access is granted immediately after payment verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="ghost"
              className="flex-1 py-8 rounded-2xl text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all font-semibold"
              onClick={() => navigate("/")}
            >
              Go Back
            </Button>
            <Button
              className={`flex-1 py-8 rounded-2xl font-bold text-lg transition-all duration-500 ${
                selectedPlan && termsAccepted && !hasPendingPayment
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-2xl shadow-rose-500/20 hover:scale-[1.02] hover:brightness-110"
                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50"
              }`}
              disabled={!selectedPlan || !termsAccepted || hasPendingPayment}
              onClick={proceedToPayment}
            >
              {hasPendingPayment ? "Pending Payment Review" : "Complete Order"}
            </Button>
          </div>
          
          <p className="text-center text-xs text-neutral-600 uppercase tracking-widest font-medium">
            Secure Encryption & Privacy Guaranteed
          </p>
        </div>
      </main>
    </div>
  );
}

function FeatureItem({ text, isSelected }: { text: string; isSelected: boolean }) {
  return (
    <div className="flex items-center gap-3 group/item">
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
        isSelected ? "bg-rose-500/20" : "bg-white/5"
      }`}>
        <Check className={`w-3 h-3 ${isSelected ? "text-rose-400" : "text-neutral-600"}`} />
      </div>
      <span className={`text-sm transition-colors ${isSelected ? "text-neutral-200" : "text-neutral-400"}`}>
        {text}
      </span>
    </div>
  );
}

