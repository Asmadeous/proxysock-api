import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
    Monitor,
    ShieldCheck,
    Zap,
    Globe,
    Headphones,
    CheckCircle2,
    ArrowRight,
    User,
    MessageSquare,
    BarChart3,
    Smartphone,
    Shield,
    Cpu,
    Code2,
    Layers,
    Rocket,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { useThemeStore } from "@/store/themeStore";
import api from '../../services/api';

export default function ResellerProgram() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        resellerType: "api_only",
        productsWanted: [] as string[],
        interest: "",
        volume: "",
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

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const inquiryMessage = `
Reseller Inquiry:
-----------------
Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company}
Reseller Type: ${formData.resellerType}
Products Wanted: ${formData.productsWanted.join(', ')}
Expected Volume: ${formData.volume}
Additional Info: ${formData.message || 'N/A'}
            `.trim();

            await api.post('/api/v1/guest_chats', {
                guest_name: formData.name,
                guest_email: formData.email,
                subject: `New Reseller Application: ${formData.company}`,
                message: inquiryMessage
            });

            toast.success("Application Submitted!", {
                description: "Our partnership team will review your details and contact you shortly.",
            });

            setFormData({
                name: "",
                email: "",
                company: "",
                resellerType: "api_only",
                productsWanted: [],
                interest: "",
                volume: "",
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

    const resellerTypes = [
        {
            id: "api_only",
            icon: Code2,
            title: "API Reseller",
            description: "Full product arsenal access. Integrate all our services directly into your platform using our automated REST API.",
            benefits: ["All products included", "Real-time provisioning", "Custom pricing control", "No upfront infrastructure costs"],
            gradient: "from-primary/10 to-primary/5"
        },
        {
            id: "single_product",
            icon: Rocket,
            title: "Single Product Specialist",
            description: "Choose ONE product vertical to dominate. Get hyper-specialized support and the deepest discounts for your niche.",
            benefits: ["One dedicated product", "Vertical-specific support", "Optimized margins", "Niche marketing guidance"],
            gradient: "from-primary/15 to-primary/5"
        },
        {
            id: "dedicated",
            icon: Layers,
            title: "Infrastructure Partner",
            description: "Complete backend utilization. Run your entire business on our enterprise infrastructure with dedicated management.",
            benefits: ["Full backend access", "Dedicated compute nodes", "Monthly post-paid billing", "Multi-user management"],
            gradient: "from-primary/20 to-primary/10"
        }
    ];

    const productCatalog = [
        {
            icon: Globe,
            title: "Premium Proxies",
            description: "Datacenter, ISP, and Residential rotating proxies with 99.9% uptime and zero throttling.",
            features: ["195+ Locations", "Unlimited Bandwidth", "HTTP/S & SOCKS5", "Anti-Bot Tech"]
        },
        {
            icon: Shield,
            title: "Residential VPN",
            description: "Enterprise-grade VPN solutions using real residential IPs to bypass the toughest geoblocks.",
            features: ["No-Log Policy", "Kill Switch", "Multi-Hop Support", "P2P Optimized"]
        },
        {
            icon: Monitor,
            title: "High-Speed RDP",
            description: "Windows Remote Desktop solutions optimized for heavy applications, bots, and SEO tools.",
            features: ["Admin Access", "NVMe Storage", "GPU Options", "10Gbps Uplink"]
        },
        {
            icon: Cpu,
            title: "Scalable VPS",
            description: "KVM-based Virtual Private Servers with instant deployment and automated management.",
            features: ["Snapshots", "Root Access", "DDoS Protection", "Custom ISOs"]
        },
        {
            icon: Smartphone,
            title: "Global eSIM",
            description: "Digital SIM cards for travelers and business professionals with instant QR delivery.",
            features: ["Instant Activation", "Local Rates", "Data Sharing", "Multi-Country Plans"]
        }
    ];

    const benefits = [
        { icon: Zap, title: "Instant Scaling", desc: "Add or remove resources from your inventory in seconds." },
        { icon: ShieldCheck, title: "100% White Label", desc: "Your brand, your logo, our world-class infrastructure." },
        { icon: BarChart3, title: "Flexible Pricing", desc: "Unlock wholesale discounts based on your chosen partnership model." },
        { icon: User, title: "Expert Support", desc: "Direct access to our senior engineering team 24/7." }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Reseller Program | Partner with ProxySock</title>
                <meta name="description" content="Unlock wholesale pricing and enterprise-grade infrastructure. Join the ProxySock reseller program today." />
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
                            <span className="text-sm font-semibold text-primary uppercase tracking-wider italic">Partner Program v2.0</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Scale Without <span className="text-primary italic">Boundaries.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                            Stop worrying about server maintenance and geo-blocking. Join our elite reseller network 
                            and provide your clients with the world's most reliable digital infrastructure.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Button size="lg" className="text-lg px-10 py-7 rounded-2xl shadow-xl shadow-primary/20" onClick={() => document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' })}>
                                Start Reselling Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-2xl border-2" onClick={() => navigate('/contact')}>
                                Schedule a Call
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Reseller Tiers */}
            <section className="py-24 px-4 bg-muted/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-6">Choose Your <span className="text-primary">Partnership Tier</span></h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Whether you're a startup or an established enterprise, we have a reseller model that fits your growth strategy.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {resellerTypes.map((type, idx) => (
                            <motion.div
                                key={type.id}
                                initial={{ opacity: 0, x: idx === 0 ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <Card className={`h-full border-2 border-border/50 bg-gradient-to-br ${type.gradient} backdrop-blur-xl hover:border-primary/50 transition-all duration-500 group overflow-hidden relative`}>
                                    <div className="absolute -right-12 -top-12 h-40 w-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                                    <CardHeader className="p-10">
                                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                            <type.icon className="h-8 w-8 text-primary" />
                                        </div>
                                        <CardTitle className="text-3xl font-bold mb-4">{type.title}</CardTitle>
                                        <p className="text-muted-foreground text-lg leading-relaxed">
                                            {type.description}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-10 pt-0">
                                        <div className="space-y-4">
                                            {type.benefits.map((benefit) => (
                                                <div key={benefit} className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                    <span className="text-foreground/80 font-medium">{benefit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Billing & Terms */}
            <section className="py-24 px-4 bg-muted/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-6">Partnership <span className="text-primary">Terms</span></h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Flexible billing structures designed to support your cash flow and business growth.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm p-8 text-center hover:border-primary/50 transition-colors">
                            <h3 className="text-2xl font-bold mb-4">API Reseller</h3>
                            <div className="text-2xl font-extrabold text-primary mb-2">Deposit-Based</div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">All Products Included</p>
                            <ul className="space-y-3 text-sm text-left mb-8">
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Initial wallet deposit required</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Automated deductions per order</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Instant service delivery</li>
                            </ul>
                        </Card>
                        <Card className="border-2 border-primary bg-primary/5 p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold uppercase tracking-tighter">Focused</div>
                            <h3 className="text-2xl font-bold mb-4">Single Product</h3>
                            <div className="text-2xl font-extrabold text-primary mb-2">Tiered Deposit</div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Choose One Category</p>
                            <ul className="space-y-3 text-sm text-left mb-8">
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Specialized in one product vertical</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Lower entry barrier</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Niche wholesale pricing</li>
                            </ul>
                        </Card>
                        <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm p-8 text-center hover:border-primary/50 transition-colors">
                            <h3 className="text-2xl font-bold mb-4">Infrastructure</h3>
                            <div className="text-2xl font-extrabold text-primary mb-2">Monthly Bill</div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Full Backend Utilization</p>
                            <ul className="space-y-3 text-sm text-left mb-8">
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Post-paid billing at month end</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Resource-based usage charges</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Dedicated backend infrastructure</li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Detailed Product Catalog */}
            <section className="py-24 px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl font-bold mb-4">Our Full <span className="text-primary">Product Arsenal</span></h2>
                            <p className="text-muted-foreground text-lg mb-2">
                                Resell one, some, or all. You decide your focus.
                            </p>
                            <p className="text-muted-foreground">
                                Diversify your portfolio with a complete range of infrastructure services. 
                                All products are available through our unified API.
                            </p>
                        </div>
                        <Button variant="ghost" className="group text-lg" onClick={() => navigate('/proxies')}>
                            Browse All Features <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {productCatalog.map((product, idx) => (
                            <motion.div
                                key={product.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                            >
                                <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:translate-y-[-8px] transition-all duration-300">
                                    <CardContent className="p-8">
                                        <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center mb-6">
                                            <product.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4">{product.title}</h3>
                                        <p className="text-muted-foreground mb-8 leading-relaxed">
                                            {product.description}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {product.features.map((f) => (
                                                <div key={f} className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                                    <span className="text-xs font-semibold text-foreground/70 uppercase tracking-tight">{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                        
                        {/* Custom Requirements Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <Card className="h-full border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center p-8 text-center">
                                <MessageSquare className="h-12 w-12 text-primary mb-4" />
                                <h3 className="text-2xl font-bold mb-2">Custom Needs?</h3>
                                <p className="text-muted-foreground mb-6">We build custom solutions for high-volume partners.</p>
                                <Button onClick={() => navigate('/contact')}>Talk to an Engineer</Button>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-24 px-4 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
                        {benefits.map((benefit) => (
                            <div key={benefit.title} className="text-center group">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <benefit.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Application Section */}
            <section id="apply-form" className="py-24 px-4 relative">
                <div className="absolute inset-0 bg-primary/5 -skew-y-3 z-0" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <Card className="border-border shadow-2xl overflow-hidden glass-card">
                        <CardContent className="p-8 md:p-16">
                            <div className="flex flex-col md:flex-row gap-12">
                                <div className="flex-1">
                                    <h2 className="text-4xl font-bold mb-6">Partner With <span className="text-primary">ProxySock</span></h2>
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Lock className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">Secure Infrastructure</h4>
                                                <p className="text-muted-foreground text-sm">Enterprise-grade security across all nodes.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Globe className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">Global Presence</h4>
                                                <p className="text-muted-foreground text-sm">Servers in every major market worldwide.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Headphones className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">Expert Support</h4>
                                                <p className="text-muted-foreground text-sm">Human support when you need it most.</p>
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
                                            <Label htmlFor="company">Company Name</Label>
                                            <Input
                                                id="company"
                                                name="company"
                                                placeholder="My Hosting Corp"
                                                value={formData.company}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Partnership Type</Label>
                                                <Select value={formData.resellerType} onValueChange={(v) => handleSelectChange("resellerType", v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="api_only">API Integration</SelectItem>
                                                        <SelectItem value="single_product">Single Product Specialist</SelectItem>
                                                        <SelectItem value="infrastructure">Infrastructure Partner</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Monthly Volume</Label>
                                                <Select value={formData.volume} onValueChange={(v) => handleSelectChange("volume", v)}>
                                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="<1k">Under $1k</SelectItem>
                                                        <SelectItem value="1k-5k">$1k - $5k</SelectItem>
                                                        <SelectItem value="5k-10k">$5k - $10k</SelectItem>
                                                        <SelectItem value="10k+">$10k+</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Products of Interest</Label>
                                            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-xl">
                                                {['Proxies', 'VPN', 'RDP', 'VPS', 'eSIM'].map((p) => (
                                                    <label key={p} className="flex items-center gap-2 px-3 py-1 bg-background rounded-lg border border-border cursor-pointer hover:border-primary transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-border text-primary focus:ring-primary"
                                                            checked={formData.productsWanted.includes(p.toLowerCase())}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    productsWanted: checked 
                                                                        ? [...prev.productsWanted, p.toLowerCase()]
                                                                        : prev.productsWanted.filter(id => id !== p.toLowerCase())
                                                                }));
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium">{p}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">About Your Project</Label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                placeholder="Tell us about your target market..."
                                                className="min-h-[100px]"
                                                value={formData.message}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full text-lg h-14 rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting}>
                                            {isSubmitting ? "Processing..." : "Submit Application"}
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
