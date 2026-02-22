// import { useState } from 'react';git
import { useNavigate } from "react-router-dom";
import { Shield, Zap, Globe, ArrowRight, CheckCircle, Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";
// import Navbar from "@components/";

export default function VPNLanding() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const vpnPlans = [
    {
      id: "residential-daily",
      name: "Residential Daily",
      price: 2.99,
      period: "day",
      duration: 1,
      bandwidth: "Unlimited",
      servers: "150+ Countries",
      speed: "High Speed",
      type: "residential",
      features: [
        "Unlimited Bandwidth",
        "150+ Server Locations",
        "AES-256 Encryption",
        "Kill Switch Protection",
        "DNS Leak Protection",
        "Email Support",
      ],
      popular: false,
    },
    {
      id: "residential-weekly",
      name: "Residential Weekly",
      price: 14.99,
      period: "week",
      duration: 7,
      bandwidth: "Unlimited",
      servers: "150+ Countries",
      speed: "Ultra Speed",
      type: "residential",
      features: [
        "Unlimited Bandwidth",
        "150+ Server Locations",
        "AES-256 Encryption",
        "Kill Switch Protection",
        "DNS Leak Protection",
        "Priority Support",
        "Split Tunneling",
        "Ad Blocker",
      ],
      popular: true,
    },
    {
      id: "residential-monthly",
      name: "Residential Monthly",
      price: 49.99,
      period: "month",
      duration: 30,
      bandwidth: "Unlimited",
      servers: "150+ Countries",
      speed: "Lightning Speed",
      type: "residential",
      features: [
        "Unlimited Bandwidth",
        "150+ Server Locations",
        "AES-256 Encryption",
        "Kill Switch Protection",
        "DNS Leak Protection",
        "24/7 Priority Support",
        "Split Tunneling",
        "Ad Blocker",
        "Dedicated IP Option",
        "Streaming Optimized",
      ],
      popular: false,
    },
  ];

  const handlePlanClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate("/dashboard/vpn");
  };

  const features = [
    {
      icon: Shield,
      title: "Military-Grade Security",
      description:
        "AES-256 encryption keeps your data completely secure from hackers and snoopers",
    },
    {
      icon: Eye,
      title: "Complete Privacy",
      description:
        "No-log policy means we never track, store, or monitor your online activity",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Optimized servers deliver blazing fast speeds for streaming and browsing",
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Connect to servers across 150+ locations worldwide",
    },
  ];

  const serverRegions = [
    { region: "USA", countries: "All US States Coverage" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900/10 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900/10 to-gray-900">
      {/* <Navbar /> */}

      {/* Hero Section */}
      <div className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-b from-yellow-900/20 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900/40"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <div className="flex justify-center gap-4 mb-6">
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                From $2.50 Daily
              </span>
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                150+ Countries
              </span>
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                Instant Activation
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight">
              Residential VPN
              <span className="block text-yellow-500 mt-2">
                Global Privacy Protection
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              Stay connected with real residential IPs. Access global content,
              protect your privacy, and browse anonymously with military-grade
              encryption.
            </p>

            <div className="mt-10">
              <button
                onClick={handlePlanClick}
                className="px-8 py-3 text-lg bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors duration-200 inline-flex items-center font-medium shadow-lg hover:shadow-yellow-600/20"
              >
                {isAuthenticated ? "Get VPN Now" : "Sign In to Get Started"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
              <p className="mt-4 text-gray-400 text-sm">
                Daily • Weekly • Monthly plans available
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent"></div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Why Choose Our VPN
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
              Advanced security features designed to protect your privacy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border border-yellow-500/20"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500/20 rounded-lg mb-3">
                    <IconComponent className="h-6 w-6 text-yellow-500" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gray-800/50 py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Residential VPN Plans
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
              Flexible billing options for every need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vpnPlans.map((plan) => {
              return (
                <div
                  key={plan.id}
                  className={`bg-gray-900/80 backdrop-blur-xl rounded-lg p-6 border transition-all duration-300 ${
                    plan.popular
                      ? "border-yellow-500/50 ring-2 ring-yellow-500/20"
                      : "border-gray-800"
                  }`}
                >
                  {plan.popular && (
                    <div className="mb-2">
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded uppercase">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4">
                    Real residential IP
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-800/50 p-3 rounded text-center">
                      <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                      <span className="text-white font-bold text-xs block">
                        Unlimited
                      </span>
                      <span className="text-xs text-gray-400">Bandwidth</span>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded text-center">
                      <Globe className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                      <span className="text-white font-bold text-xs block">
                        USA
                      </span>
                      <span className="text-xs text-gray-400">Coverage</span>
                    </div>
                  </div>

                  <ul className="text-xs text-gray-400 space-y-1 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                  </ul>

                  <button
                    onClick={handlePlanClick}
                    className={`w-full block text-center px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                      plan.popular
                        ? "bg-yellow-600 text-white hover:bg-yellow-700"
                        : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                  >
                    {isAuthenticated ? "Select Plan" : "Sign In to Buy"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Servers Section */}
      <div className="bg-gray-800/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Server Coverage
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
              Complete coverage across all US states
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-md mx-auto">
            {serverRegions.map((device, index) => (
              <div
                key={index}
                className="bg-gray-900/80 backdrop-blur-xl rounded-lg p-4 border border-gray-800"
              >
                <h3 className="text-lg font-bold text-white mb-3">
                  {device.region}
                </h3>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>✓ {device.countries}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Why Residential VPN
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                title: "Real IPs",
                description: "Legitimate residential addresses",
              },
              { title: "High Speed", description: "Optimized for performance" },
              { title: "No Detection", description: "Appear as real users" },
              { title: "24/7 Support", description: "Always here to help" },
            ].map((feature, index) => {
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500/20 rounded-lg mb-3">
                    <CheckCircle className="h-6 w-6 text-yellow-500" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-12">
            VPN Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "What are residential IPs?",
                a: "Residential IPs are assigned to real residential devices. They appear as legitimate users, making them perfect for accessing geoblocked content and maintaining privacy.",
              },
              {
                q: "How do I know if my device supports VPN?",
                a: "Most devices support VPN including smartphones, tablets, computers, and routers. Simply install our VPN app and connect to start using it.",
              },
              {
                q: "Can I use VPN on multiple devices?",
                a: "Yes! All plans support multiple simultaneous connections so you can protect all your devices at once.",
              },
              {
                q: "What happens when my plan expires?",
                a: "You can easily renew your plan through our app or website. Simply purchase another plan and it will extend your access.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800/50 rounded-lg p-6 border border-yellow-500/10"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-slate-300 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Protect Your Privacy?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Choose from daily, weekly, or monthly residential VPN plans
          </p>
          <button
            onClick={handlePlanClick}
            className="inline-flex items-center px-8 py-3 bg-white text-yellow-600 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium text-lg"
          >
            Get VPN Now
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
          <p className="mt-4 text-white/80 text-sm">
            Flexible plans • Instant activation • 24/7 support
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-yellow-500/20">
        <div className="max-w-7xl mx-auto py-10 px-6 sm:px-8">
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} ProxySock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
