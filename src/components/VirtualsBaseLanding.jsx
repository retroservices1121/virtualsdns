import React, { useState, useEffect } from 'react';
import { Search, User, Settings, Gift, Wallet, AlertCircle, CheckCircle, ShoppingCart, ArrowRightLeft, Store, ExternalLink, Sparkles, Zap, Shield, Globe, Rocket, Star, Twitter, Clock, Users, TrendingUp, Smartphone } from 'lucide-react';

const VirtualsBaseLanding = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [isVisible, setIsVisible] = useState({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [nameSearch, setNameSearch] = useState('');
  const [isNameAvailable, setIsNameAvailable] = useState(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  
  // Simulate name availability check
  const checkNameAvailability = (name) => {
    if (!name) {
      setIsNameAvailable(null);
      return;
    }
    
    // Simulate API delay
    setTimeout(() => {
      const unavailableNames = ['alice', 'bob', 'charlie', 'david', 'eve', 'john', 'mary'];
      const isAvailable = !unavailableNames.includes(name.toLowerCase());
      setIsNameAvailable(isAvailable);
    }, 300);
  };

  // Floating CTA visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setShowFloatingCta(scrollPercent > 20 && scrollPercent < 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Built on Base L2 - transactions complete in seconds, not minutes",
      color: "from-yellow-400 to-cyan-400"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Ultra Secure",
      description: "Immutable blockchain records with smart contract verification",
      color: "from-cyan-400 to-purple-500"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Universal Access",
      description: "Works across all Web3 applications and compatible wallets",
      color: "from-purple-500 to-yellow-400"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "VIRTUAL Ecosystem",
      description: "Designed for the VIRTUAL Protocol ecosystem and compatible wallets",
      color: "from-cyan-400 to-purple-500"
    }
  ];

  const stats = [
    { number: "12.5K+", label: "Names Registered", icon: "🎯" },
    { number: "24/7", label: "Available", icon: "🌍" },
    { number: "Instant", label: "Registration", icon: "⚡" }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Starfield */}
        <div className="absolute inset-0">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Star className="w-1 h-1 text-white opacity-60" />
            </div>
          ))}
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Moving Gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(163, 71, 255, 0.1), transparent 40%)`
          }}
        />
      </div>

      {/* Floating CTA */}
      {showFloatingCta && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <button 
            onClick={() => scrollToSection('name-checker')}
            className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full text-white font-semibold hover:from-purple-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 flex items-center gap-2"
          >
            <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Try It Now!
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10"></div>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🤖</span>
                </div>
                <span className="text-white font-bold text-xl">.virtuals.base</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-white transition-colors">Features</button>
                <button onClick={() => scrollToSection('demo')} className="text-gray-300 hover:text-white transition-colors">Demo</button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-gray-300 hover:text-white transition-colors">How It Works</button>
                <button onClick={() => scrollToSection('pricing')} className="text-gray-300 hover:text-white transition-colors">Pricing</button>
                <a 
                  href="https://twitter.com/virtualsbase" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Twitter className="w-5 h-5" />
                  Follow Us
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="text-center max-w-6xl mx-auto">
            {/* Main Title */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-cyan-400 to-yellow-400 mb-6 animate-pulse">
                .virtuals.base
              </h1>
              <p className="text-2xl md:text-4xl text-white mb-4 font-light">
                The Future of VIRTUAL Identity
              </p>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Transform cryptic wallet addresses into memorable names for your VIRTUAL ecosystem. 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 font-semibold"> alice.virtuals.base</span> instead of 
                <span className="font-mono text-gray-500"> 0x742d35Cc6634C0532925a3b8D40E4...</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-12">
              <button 
                onClick={() => scrollToSection('name-checker')}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full text-white font-semibold text-lg hover:from-purple-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 flex items-center gap-3"
              >
                <Search className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Launch App
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10"></div>
              </button>
            
              <button 
                onClick={() => scrollToSection('demo')}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full text-white font-semibold text-lg hover:from-cyan-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-400/50 flex items-center gap-3"
              >
                <ArrowRightLeft className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                Transfer Names
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10"></div>
              </button>
              
              <button 
                onClick={() => scrollToSection('pricing')}
                className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black font-semibold text-lg hover:from-yellow-500 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/50 flex items-center gap-3"
              >
                <Store className="w-6 h-6 group-hover:animate-bounce transition-transform" />
                Marketplace
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10"></div>
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live on Base Network</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>Sub-second Transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">12.5K+ Active Users</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="text-center group hover:transform hover:scale-110 transition-all duration-300"
                >
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section id="name-checker" className="py-20 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Try It <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-yellow-400">Live</span>
              </h2>
              <p className="text-xl text-gray-300">
                Check if your perfect username is available right now
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-12">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={nameSearch}
                    onChange={(e) => {
                      setNameSearch(e.target.value);
                      checkNameAvailability(e.target.value);
                    }}
                    placeholder="Enter your desired username..."
                    className="w-full px-6 py-4 bg-black/50 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 text-lg"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400">.virtuals.base</span>
                  </div>
                </div>
                <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full text-white font-semibold hover:from-purple-600 hover:to-cyan-500 transition-all duration-300 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Check
                </button>
              </div>

              {isNameAvailable !== null && nameSearch && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl ${isNameAvailable ? 'bg-cyan-400/20 border border-cyan-400/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                  {isNameAvailable ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-cyan-400" />
                      <div>
                        <p className="text-cyan-400 font-semibold">🎉 {nameSearch}.virtuals.base is available!</p>
                        <p className="text-gray-300 text-sm">Reserve it now for just $5 USD</p>
                      </div>
                      <button 
                        onClick={() => scrollToSection('pricing')}
                        className="ml-auto px-6 py-2 bg-cyan-400 rounded-full text-black font-semibold hover:bg-cyan-500 transition-colors"
                      >
                        Reserve Now
                      </button>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-red-400" />
                      <div>
                        <p className="text-red-400 font-semibold">{nameSearch}.virtuals.base is already taken</p>
                        <p className="text-gray-300 text-sm">Try a different name or check the marketplace</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mock Wallet Interface */}
        <section id="demo" className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                See The <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Difference</span>
              </h2>
              <p className="text-xl text-gray-300">
                Compare the old way vs. the .virtuals.base way
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Before */}
              <div className="bg-red-500/10 backdrop-blur-lg rounded-3xl p-8 border border-red-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400">😵</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">The Old Way</h3>
                </div>
                
                <div className="bg-black/50 rounded-2xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Send to AI Agent:</span>
                    <Smartphone className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 mb-4">
                    <span className="font-mono text-red-400 text-sm break-all">0x742d35Cc6634C0532925a3b8D40E4...</span>
                  </div>
                  <div className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Wait, is this the right address?
                  </div>
                </div>

                <div className="text-gray-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">❌</span>
                    <span>Impossible to remember</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">❌</span>
                    <span>Easy to make mistakes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">❌</span>
                    <span>Not user-friendly</span>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="bg-green-500/10 backdrop-blur-lg rounded-3xl p-8 border border-green-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400">🎉</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">The .virtuals.base Way</h3>
                </div>
                
                <div className="bg-black/50 rounded-2xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">Send to AI Agent:</span>
                    <Smartphone className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-3 mb-4">
                    <span className="font-mono text-cyan-400 text-lg">alice.virtuals.base</span>
                  </div>
                  <div className="text-cyan-400 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Perfect! Easy and memorable.
                  </div>
                </div>

                <div className="text-gray-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Human-readable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Easy to remember</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span>Professional & trustworthy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">.virtuals.base</span>?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Built for Web3 users and the VIRTUAL ecosystem
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group relative p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-br ${feature.color} mb-6 group-hover:rotate-12 transition-transform duration-300`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  
                  {/* Hover effect */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Works</span>
              </h2>
              <p className="text-xl text-gray-300">
                Three simple steps to transform your wallet identity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Choose Your Name",
                  description: "Pick a memorable name for your wallet - alice, bob, or anything you want. Check availability instantly.",
                  icon: "📝",
                  color: "from-purple-500 to-cyan-400"
                },
                {
                  step: "02", 
                  title: "Pay & Register",
                  description: "Pay with ETH, USDC, or VIRTUAL tokens. Registration happens instantly on Base L2 network.",
                  icon: "💰",
                  color: "from-cyan-400 to-yellow-400"
                },
                {
                  step: "03",
                  title: "Start Using",
                  description: "Your wallet now has a human-readable address that works everywhere in Web3. Share it with confidence!",
                  icon: "🚀",
                  color: "from-yellow-400 to-purple-500"
                }
              ].map((item, index) => (
                <div key={index} className="relative text-center group">
                  {/* Step Number */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${item.color} text-white font-bold text-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {item.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="text-6xl mb-6 group-hover:animate-bounce">
                    {item.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>
                  
                  {/* Connecting Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-transparent transform -translate-x-8">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">VIRTUAL</span> Revolution
              </h2>
              <p className="text-xl text-gray-300 mb-16">
                Be part of the future of decentralized identity
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300">
                  <div className="text-6xl mb-6">🌟</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Easy to Remember</h3>
                  <p className="text-gray-300">No more copying and pasting long wallet addresses. Your .virtuals.base name is simple and memorable.</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300">
                  <div className="text-6xl mb-6">🔒</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Secure & Trusted</h3>
                  <p className="text-gray-300">Built on Base blockchain with secure smart contracts. Your name registration is permanent and secure.</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300">
                  <div className="text-6xl mb-6">🚀</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Future Ready</h3>
                  <p className="text-gray-300">Compatible with all major wallets and dApps. Your name grows with the VIRTUAL ecosystem.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-yellow-400">Pricing</span>
              </h2>
              <p className="text-xl text-gray-300">
                Transparent pricing for all username types
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20 text-center relative overflow-hidden">
              <div className="text-6xl mb-8">💎</div>
              <h3 className="text-3xl font-bold text-white mb-4">Any Basic Name</h3>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400">
                  $5 USD
                </div>
                <div className="text-gray-400">
                  + $10/year renewal
                </div>
              </div>
              
              <div className="text-gray-400 mb-8">
                (0.001 ETH or 5 USDC or 1000 VIRTUAL)
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">Instant Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">Universal Compatibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">Transfer Anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-300">$10 Annual Renewal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">Premium & Legacy Names</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">24/7 Support</span>
                </div>
              </div>

              <button 
                onClick={() => scrollToSection('name-checker')}
                className="px-12 py-4 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full text-white font-bold text-xl hover:from-purple-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="bg-gradient-to-r from-purple-500/20 to-cyan-400/20 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Ready to Claim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400">Username</span>?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join 12,500+ users with memorable .virtuals.base names
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button 
                  onClick={() => scrollToSection('name-checker')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full text-white font-semibold text-lg hover:from-purple-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 justify-center"
                >
                  <Rocket className="w-5 h-5" />
                  Get Started - $5
                </button>
                <a 
                  href="https://twitter.com/virtualsbase" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-black/50 border border-white/20 rounded-full text-white font-semibold text-lg hover:bg-black/70 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 justify-center"
                >
                  <Twitter className="w-5 h-5" />
                  Follow Updates
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/10">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🤖</span>
                </div>
                <span className="text-white font-bold text-lg">.virtuals.base</span>
              </div>
              
              <div className="flex items-center space-x-6">
                <span className="text-gray-400">Built on Base Network</span>
                <a 
                  href="https://twitter.com/virtualsbase" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Twitter className="w-5 h-5" />
                  @virtualsbase
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default VirtualsBaseLanding;
