// Login.tsx - Full-screen immersive redesign
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, ArrowLeft, Heart, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!isForgotPassword) {
      if (!password) {
        newErrors.password = "Password is required";
      } else if (password.length < 6) {
        newErrors.password = "Password is too short";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: "email" | "password", value: string) => {
    if (field === "email") setEmail(value);
    else setPassword(value);

    // Clear error for this field
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          if (error.status === 429) {
            setErrors({ general: "Too many requests. Please wait a moment before trying again." });
            toast.error("Too many requests");
          } else {
            setErrors({ general: error.message || "Failed to send reset link." });
            toast.error("Failed to send reset link");
          }
        } else {
          setResetSent(true);
          toast.success("Password reset link sent!");
        }
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Handle specific error types
        if (error.message?.includes("Invalid login credentials")) {
          setErrors({
            general: "Invalid email or password. Please try again.",
          });
          toast.error("Invalid credentials");
        } else if (error.message?.includes("Email not confirmed")) {
          setErrors({
            general: "Please confirm your email address before logging in. Check your inbox for the confirmation link.",
          });
          toast.error("Email not confirmed");
        } else if (error.status === 429) {
          setErrors({
            general: "Too many login attempts. Please try again later.",
          });
          toast.error("Too many attempts");
        } else {
          setErrors({
            general: error.message || "Login failed. Please try again.",
          });
          toast.error(error.message || "Login failed");
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Fetch user profile to determine redirect
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        toast.success("Welcome back!");
        
        // Determine redirect based on role
        const role = (profile as any)?.role;
        const redirectPath = role === "agent" 
          ? "/agent" 
          : role === "admin" 
          ? "/admin" 
          : "/dashboard";

        // Small delay to ensure session is set
        setTimeout(() => {
          navigate(redirectPath);
        }, 500);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setErrors({
        general: error?.message || "An unexpected error occurred",
      });
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-6 relative overflow-hidden">
      {/* Ambient rose glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(225,29,72,0.15),_transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-light text-white">
            {resetSent ? "Check Your Email" : isForgotPassword ? "Reset Password" : "Welcome Back"}
          </h1>
          <p className="text-sm text-neutral-400">
            {resetSent
              ? "We've sent a password reset link to your email."
              : isForgotPassword
              ? "Enter your email to receive a reset link"
              : "Sign in to your ComeClsr account"}
          </p>
        </div>

        {/* Form */}
        {!resetSent ? (
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            {/* Error Banner */}
          {errors.general && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{errors.general}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-300 text-xs uppercase tracking-wider">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
              className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500/50 focus:outline-none rounded-xl px-4 py-3.5 transition min-h-[44px] ${
                errors.email ? "border-red-500/50" : ""
              }`}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>

            {/* Password */}
            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-neutral-300 text-xs uppercase tracking-wider">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrors({});
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500/50 focus:outline-none rounded-xl px-4 py-3.5 pr-12 transition min-h-[44px] ${
                      errors.password ? "border-red-500/50" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-4 rounded-xl min-h-[44px] mt-6 transition"
              disabled={isLoading}
            >
              {isLoading 
                ? (isForgotPassword ? "Sending..." : "Signing in...") 
                : (isForgotPassword ? "Send Reset Link" : "Sign In")}
            </Button>
            
            {isForgotPassword && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrors({});
                }}
                className="w-full text-neutral-400 hover:text-white mt-2"
                disabled={isLoading}
              >
                Back to Sign In
              </Button>
            )}
          </form>
        ) : (
          <div className="mb-8 space-y-4">
            <Button
              type="button"
              onClick={() => {
                setResetSent(false);
                setIsForgotPassword(false);
                setPassword("");
              }}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-4 rounded-xl min-h-[44px]"
            >
              Back to Login
            </Button>
          </div>
        )}

        {/* Links */}
        <div className="space-y-3 text-center text-sm">
          <p className="text-neutral-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-rose-400 hover:text-rose-300 font-medium transition">
              Create One
            </Link>
          </p>
          <Link to="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-400 transition">
            <ArrowLeft className="w-3 h-3" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}