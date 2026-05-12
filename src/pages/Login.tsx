// Login.tsx - Updated with better validation and error messages
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [errors, setErrors] = useState<LoginErrors>({});

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password is too short";
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
        toast.success("Welcome back!");
        // Small delay to ensure session is set
        setTimeout(() => {
          navigate("/dashboard");
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(225,29,72,0.1),_transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-6 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card className="bg-neutral-900/80 backdrop-blur-xl border-neutral-800">
          <CardHeader className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <p className="text-sm text-neutral-400">Sign in to your ComeClsr account</p>
          </CardHeader>

          <CardContent>
            {errors.general && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  className={`bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition ${
                    errors.email ? "border-red-500/50" : ""
                  }`}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className={`bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 pr-10 transition ${
                      errors.password ? "border-red-500/50" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-5 transition"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-rose-400 hover:text-rose-300 font-medium">
                Create One
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-neutral-500 text-xs mt-6">
          Forgot your password?{" "}
          <Link to="#" className="text-rose-400 hover:text-rose-300 font-semibold">
            Reset It
          </Link>
        </p>
      </div>
    </div>
  );
}