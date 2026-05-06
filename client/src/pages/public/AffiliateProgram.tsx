import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
    DollarSign,
    TrendingUp,
    ShieldCheck,
    Zap,
    Globe,
    ArrowRight,
    PieChart,
    Clock,
    MessageSquare,
    Headphones,
    Lock,
    Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { useThemeStore } from "@/store/themeStore";
import api from '../../services/api';

export default function AffiliateProgram() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { dark } = useThemeStore();

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const inquiryMessage = `
Affiliate Partnership Inquiry:
-----------------
Name: ${formData.name}
Email: ${formData.email}
Details: ${formData.message}
            `.trim();

            await api.post('/api/v1/guest_chats', {
                guest_name: formData.name,
                guest_email: formData.email,
                subject: `New Affiliate Application: ${formData.name}`,
                message: inquiryMessage
            });

            toast.success("Application Received!", {
                description: "Our partnership team will review your profile and contact you for negotiation.",
            });

            setFormData({
                name: "",
                email: "",
                message: "",
            });
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Submission Failed", {
                description: "Please try again later or contact support directly.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        {
            icon: MessageSquare,
            title: "Submit Interest",
            desc: "Tell us about your project through our simple application form below."
        },
        {
            icon: TrendingUp,
            title: "Negotiate Terms",
            desc: "Our team will reach out to discuss custom commission rates tailored to your volume."
        },
        {
            icon: Zap,
            title: "Start Scaling",
            desc: "Get your custom tracking links and start earning from day one."
        }
    ];

    const benefits = [
        {
            icon: DollarSign,
            title: "Negotiated Commissions",
            desc: "We don't do flat rates. We negotiate custom deals based on your traffic quality and volume."
        },
        {
            icon: PieChart,
            title: "Real-Time Tracking",
            desc: "Advanced dashboard to monitor every click, conversion, and payout in real-time."
        },
        {
            icon: Clock,
            title: "Lifetime Attribution",
            desc: "Earn from your referrals for their entire lifecycle on our platform. No cut-offs."
        },
        {
            icon: ShieldCheck,
            title: "Premium Product",
            desc: "Industry-leading infrastructure ensures high conversion and low churn for your traffic."
        },
        {
            icon: Headphones,
            title: "Dedicated Support",
            desc: "Direct line to our partnership managers to help you optimize your campaigns."
        },
        {
            icon: Globe,
            title: "Global Infrastructure",
            desc: "Servers and support in every major market to serve your worldwide audience."
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Affiliate Program | Partner with ProxySock</title>
                <meta name="description" content="Apply for the ProxySock affiliate program. Negotiated commission rates, lifetime attribution, and premium infrastructure." />
            </Helmet>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden">
                <div
                    className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
                    style={{
                        backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                            <Rocket className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-primary uppercase tracking-wider italic">Strategic Partnership Program</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Custom Deals. <span className="text-primary italic">Unlimited Scale.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                            We don't believe in one-size-fits-all. Apply today for a custom affiliate 
                            partnership with negotiated rates and dedicated support.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Button size="lg" className="text-lg px-10 py-7 rounded-2xl shadow-xl shadow-primary/20" onClick={() => document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' })}>
                                Apply for Partnership <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-2xl border-2" onClick={() => navigate('/contact')}>
                                Talk to Support
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-24 px-4 bg-muted/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-6">Our <span className="text-primary">Process</span></h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            We manually review every application to ensure a perfect fit for both parties.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="relative text-center group"
                            >
                                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                                    <step.icon className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-6">Why Partner With <span className="text-primary">ProxySock?</span></h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Strategic advantages built for professional traffic partners.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, idx) => (
                            <motion.div
                                key={benefit.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.05 }}
                            >
                                <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                                    <CardContent className="p-8">
                                        <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center mb-6">
                                            <benefit.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {benefit.desc}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interest Form Section */}
            <section id="apply-form" className="py-24 px-4 relative">
                <div className="absolute inset-0 bg-primary/5 -skew-y-3 z-0" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <Card className="border-border shadow-2xl overflow-hidden glass-card">
                        <CardContent className="p-8 md:p-16">
                            <div className="flex flex-col md:flex-row gap-12">
                                <div className="flex-1">
                                    <h2 className="text-4xl font-bold mb-6">Affiliate <span className="text-primary">Inquiry</span></h2>
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <DollarSign className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">Negotiated Rates</h4>
                                                <p className="text-muted-foreground text-sm">We find a rate that works for your traffic volume.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <TrendingUp className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">Growth Driven</h4>
                                                <p className="text-muted-foreground text-sm">Our team helps you scale your referral income.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Lock className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">Secure Payouts</h4>
                                                <p className="text-muted-foreground text-sm">Reliable monthly payments via multiple methods.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-[1.5]">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    placeholder="John Doe"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Work Email</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="john@company.com"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">About Your Project</Label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                placeholder="Tell us about your audience and how you plan to promote us..."
                                                className="min-h-[150px]"
                                                value={formData.message}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <Button type="submit" className="w-full text-lg h-14 rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting}>
                                            {isSubmitting ? "Processing..." : "Submit Inquiry"}
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
