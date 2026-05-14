import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Heart, Sparkles, ArrowRight, Shield, Users, MessageCircle, Crown } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const [showPopup, setShowPopup] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const hasAccepted = localStorage.getItem('comeclsr_accepted')
    if (!hasAccepted) {
      setShowPopup(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('comeclsr_accepted', 'true')
    setShowPopup(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white overflow-x-hidden">
      {/* +18 Popup */}
      <Dialog open={showPopup} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg bg-neutral-900 border-neutral-800 text-white p-0 overflow-hidden">
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center glow-rose">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold leading-relaxed">
                Your next connection isn't random—it's already happening.
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                With ComeClsr, attraction starts before you even make a move.
                Women nearby are discovering profiles, pausing, and showing interest in real time.
              </p>
              <p className="text-sm text-neutral-400 leading-relaxed">
                No long bios. No pressure.
                Just real attention, real curiosity, and real chances to connect.
              </p>
              <p className="text-sm font-medium text-white">Take the step.</p>
            </div>
            <Button
              onClick={handleAccept}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-6 text-base"
            >
              ACCEPT AND CONTINUE +18
            </Button>
            <p className="text-xs text-neutral-500 tracking-wider">
              Be seen. Be wanted. Come closer.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(225,29,72,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.1),_transparent_50%)]" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 animate-fade-in">
            <Sparkles className="w-3 h-3 text-rose-400" />
            Premium Connections Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-slide-up">
            Come <span className="gradient-text">Clsr</span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            Real attention. Real curiosity. Real chances to connect.
            No algorithms. No random swipes. Just curated, meaningful conversations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            {user ? (
              <Button
                onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'agent' ? '/agent' : '/dashboard')}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold px-10 py-6 text-base group shadow-lg shadow-rose-500/20"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold px-8 py-6 text-base group"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-base"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6 pt-12 max-w-lg mx-auto">
            <div className="text-center space-y-2">
              <Shield className="w-6 h-6 mx-auto text-rose-400" />
              <p className="text-xs text-neutral-500">Verified</p>
            </div>
            <div className="text-center space-y-2">
              <Users className="w-6 h-6 mx-auto text-rose-400" />
              <p className="text-xs text-neutral-500">Curated</p>
            </div>
            <div className="text-center space-y-2">
              <MessageCircle className="w-6 h-6 mx-auto text-rose-400" />
              <p className="text-xs text-neutral-500">Real Chat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(225,29,72,0.08),_transparent_60%)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-neutral-400 max-w-xl mx-auto">A carefully controlled experience designed for genuine connection.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Crown,
                title: "Apply & Verify",
                desc: "Create your profile, complete KYC, and submit for admin review. Every user is verified."
              },
              {
                icon: Heart,
                title: "Get Approved",
                desc: "After payment and KYC approval, our team assigns you a dedicated connection partner."
              },
              {
                icon: Sparkles,
                title: "Start Connecting",
                desc: "Your assigned partner reaches out first. Share media and voice notes in private chat."
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 space-y-4 hover:bg-white/10 transition-all duration-300">
                <feature.icon className="w-8 h-8 text-rose-400" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Come Closer?</h2>
          <p className="text-neutral-400 max-w-lg mx-auto">
            Join the platform where every connection is intentional, every conversation is meaningful, and every moment matters.
          </p>
          <Button
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold px-10 py-6 text-base"
          >
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
          <p>ComeClsr. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
