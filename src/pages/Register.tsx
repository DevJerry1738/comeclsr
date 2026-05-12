// Register.tsx - Updated version with validation, error messages, and email confirmation screen
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, ArrowLeft, Upload, X, ChevronRight, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Validation regex patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,20}$/;

interface FieldErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  age?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [signupEmail, setSignupEmail] = useState(""); // Store email for confirmation screen
  const [signupSuccess, setSignupSuccess] = useState(false); // Show confirmation screen
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    location: "",
    bio: "",
    interests: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateStep = (step: number): boolean => {
    const errors: FieldErrors = {};

    switch (step) {
      case 1:
        // Full name validation
        if (!formData.fullName.trim()) {
          errors.fullName = "Full name is required";
        } else if (formData.fullName.trim().length < 2) {
          errors.fullName = "Full name must be at least 2 characters";
        }

        // Username validation
        if (!formData.username.trim()) {
          errors.username = "Username is required";
        } else if (!USERNAME_REGEX.test(formData.username)) {
          errors.username = "Username must be 3-20 characters (letters, numbers, . and -)";
        }

        // Email validation
        if (!formData.email.trim()) {
          errors.email = "Email is required";
        } else if (!EMAIL_REGEX.test(formData.email)) {
          errors.email = "Please enter a valid email address";
        }

        // Password validation
        if (!formData.password) {
          errors.password = "Password is required";
        } else if (formData.password.length < 6) {
          errors.password = "Password must be at least 6 characters";
        } else if (formData.password.length < 8) {
          errors.password = "Password should be at least 8 characters for security";
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
          errors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = "Passwords do not match";
        }

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          return false;
        }
        return true;

      case 2:
        // Age validation
        if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 120)) {
          errors.age = "Age must be between 18 and 120";
          setFieldErrors(errors);
          return false;
        }
        return true;

      case 3:
        return true;

      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);

    try {
      // Call auth.signUp() - profile is created automatically by trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
          },
        },
      });

      if (authError) {
        if (authError.status === 429) {
          toast.error("Too many signup attempts. Please try again later.");
          setIsLoading(false);
          return;
        }
        if (authError.message?.includes("already registered")) {
          toast.error("This email is already registered. Please try logging in.");
          setIsLoading(false);
          return;
        }
        toast.error(authError.message || "Signup failed");
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account");
        setIsLoading(false);
        return;
      }

      // Small delay to ensure session propagation and trigger execution
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update profile with additional fields using database function
      try {
        const { error: profileError } = await supabase.rpc("update_user_profile", {
          user_id: authData.user.id,
          p_phone: formData.phone || null,
          p_age: formData.age ? parseInt(formData.age) : null,
          p_gender: formData.gender || null,
          p_location: formData.location || null,
          p_bio: formData.bio || null,
          p_interests: formData.interests || null,
          p_profile_photo: profilePhotoPreview || null,
        } as any);

        if (profileError) {
          console.error("Profile update error:", profileError);
          toast.error("Failed to save profile data");
          setIsLoading(false);
          return;
        }
      } catch (profileErr: any) {
        console.error("Profile update exception:", profileErr);
        toast.error("Failed to save profile data");
        setIsLoading(false);
        return;
      }

      // Success! Show confirmation screen
      setSignupEmail(formData.email);
      setSignupSuccess(true);
      
      // Reset form for next use
      setFormData({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        age: "",
        gender: "",
        location: "",
        bio: "",
        interests: "",
        password: "",
        confirmPassword: "",
      });
      setProfilePhotoPreview(null);
      setCurrentStep(1);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setFieldErrors({});

      toast.success("Account created! Check your email to confirm.");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation screen (shown after successful signup)
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-neutral-900/80 border-neutral-800 backdrop-blur-xl shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-rose-900/20 to-pink-900/20 border-b border-neutral-800 p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
              <p className="text-neutral-400 text-sm">We've sent a confirmation link to verify your account</p>
            </CardHeader>

            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-neutral-300">
                    <span className="font-semibold">Email sent to:</span>
                  </p>
                  <p className="text-neutral-400 break-all font-mono text-sm bg-neutral-900/50 p-2 rounded">
                    {signupEmail}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-neutral-400">
                  <h3 className="font-semibold text-neutral-300">What's next?</h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2">
                      <span className="text-rose-500 font-bold">1.</span>
                      <span>Open your email inbox and find the confirmation email from ComeClsr</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-rose-500 font-bold">2.</span>
                      <span>Click the confirmation link to verify your email address</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-rose-500 font-bold">3.</span>
                      <span>Return to ComeClsr and sign in with your email and password</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-3">
                  <p className="text-xs text-neutral-400">
                    <span className="font-semibold text-neutral-300">💡 Tip:</span> If you don't see the email, check your spam folder or wait a few moments and refresh.
                  </p>
                </div>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold transition flex items-center justify-center gap-2"
                >
                  Continue to Login
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-neutral-500 text-xs mt-6">
            Already confirmed your email?{" "}
            <Link to="/login" className="text-rose-400 hover:text-rose-300 font-semibold">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Original registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <Card className="bg-neutral-900/80 border-neutral-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-rose-900/20 to-pink-900/20 border-b border-neutral-800 p-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                <p className="text-neutral-400">Step {currentStep} of 3 - Join ComeClsr today</p>
              </div>

              <div className="flex gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                      step <= currentStep
                        ? "bg-gradient-to-r from-rose-500 to-pink-600"
                        : "bg-neutral-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-neutral-300 font-semibold">
                      Full Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition ${
                        fieldErrors.fullName ? "border-red-500/50" : ""
                      }`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-red-400">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-neutral-300 font-semibold">
                      Username <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition ${
                        fieldErrors.username ? "border-red-500/50" : ""
                      }`}
                    />
                    <p className="text-xs text-neutral-500">3-20 characters, letters, numbers, . and -</p>
                    {fieldErrors.username && (
                      <p className="text-xs text-red-400">{fieldErrors.username}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-neutral-300 font-semibold">
                      Email <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition ${
                        fieldErrors.email ? "border-red-500/50" : ""
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-400">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-neutral-300 font-semibold">
                      Phone <span className="text-neutral-500 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-neutral-300 font-semibold">
                      Password <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition pr-10 ${
                          fieldErrors.password ? "border-red-500/50" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500">Minimum 6 characters (8+ recommended)</p>
                    {fieldErrors.password && (
                      <p className="text-xs text-red-400">{fieldErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-neutral-300 font-semibold">
                      Confirm Password <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition pr-10 ${
                          fieldErrors.confirmPassword ? "border-red-500/50" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-neutral-300 font-semibold">
                        Age <span className="text-neutral-500 text-xs">(optional)</span>
                      </Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        placeholder="25"
                        value={formData.age}
                        onChange={handleChange}
                        disabled={isLoading}
                        min="18"
                        max="120"
                        className={`bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition ${
                          fieldErrors.age ? "border-red-500/50" : ""
                        }`}
                      />
                      {fieldErrors.age && (
                        <p className="text-xs text-red-400">{fieldErrors.age}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-neutral-300 font-semibold">
                        Gender <span className="text-neutral-500 text-xs">(optional)</span>
                      </Label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-neutral-300 font-semibold">
                      Location <span className="text-neutral-500 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="City, Country"
                      value={formData.location}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-neutral-300 font-semibold">
                      Profile Photo <span className="text-neutral-500 text-xs">(optional)</span>
                    </Label>

                    {profilePhotoPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={profilePhotoPreview}
                          alt="Profile preview"
                          className="w-32 h-32 rounded-lg object-cover border-2 border-rose-500/50"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 rounded-full p-1 transition"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-rose-500 hover:bg-neutral-800/30 transition">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                          <p className="text-sm text-neutral-400">Click to upload image</p>
                          <p className="text-xs text-neutral-500">PNG, JPG, GIF (max 5MB)</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          disabled={isLoading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="interests" className="text-neutral-300 font-semibold">
                      Interests <span className="text-neutral-500 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="interests"
                      name="interests"
                      type="text"
                      placeholder="e.g., Photography, Gaming, Music"
                      value={formData.interests}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-rose-500 transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-neutral-300 font-semibold">
                      Bio <span className="text-neutral-500 text-xs">(optional)</span>
                    </Label>
                    <textarea
                      id="bio"
                      name="bio"
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={isLoading}
                      rows={4}
                      className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition resize-none"
                    />
                  </div>

                  <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-neutral-300 font-semibold">Ready to create your account?</p>
                    <p className="text-xs text-neutral-400">
                      Click Complete Registration to create your account. You'll receive a confirmation email to verify your address.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800"
                  >
                    Back
                  </Button>
                )}

                {currentStep < 3 && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold transition"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {currentStep === 3 && (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold transition"
                  >
                    {isLoading ? "Creating Account..." : "Complete Registration"}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-8 text-center border-t border-neutral-800 pt-6">
              <p className="text-neutral-400 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-rose-500 hover:text-rose-400 font-semibold transition">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-neutral-500 text-xs mt-8">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}