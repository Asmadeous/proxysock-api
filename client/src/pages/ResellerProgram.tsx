import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
    Server,
    Monitor,
    ShieldCheck,
    Zap,
    Globe,
    Headphones,
    CheckCircle2,
    ArrowRight,
    Mail,
    Building2,
    User,
    MessageSquare,
    BarChart3,
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { useThemeStore } from "@/store/themeStore";

export default function ResellerProgram() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        interest: "", // vps, rdp, both
        volume: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

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

        // Simulator API call
        try {
            // In a real implementation, this would POST to your backend
            await new Promise((resolve) => setTimeout(resolve, 1500));

            console.log("Reseller Application:", formData);
            toast.success("Application Submitted!", {
                description: "Our partnership team will review your details and contact you shortly.",
            });

            setFormData({
                name: "",
                email: "",
                company: "",
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

    const features = [
        {
            icon: ShieldCheck,
            title: "White Label Options",
            description: "Operate under your own brand with our unbranded infrastructure solutions.",
        },
        {
            icon: Zap,
            title: "API Access",
            description: "Full automation with our robust API for instant provisioning and management.",
        },
        {
            icon: BarChart3,
            title: "High Margins",
            description: "Competitive wholesale pricing allows you to maximize your profit margins.",
        },
        {
            icon: Globe,
            title: "Global Infrastructure",
            description: "Access our worldwide network of high-performance data centers.",
        },
        {
            icon: Headphones,
            title: "Dedicated Support",
            description: "Priority technical support channel for our reseller partners.",
        },
        {
            icon: Server,
            title: "Scalable Resources",
            description: "Instantly scale your inventory to meet your customers' demands.",
        },
    ];

    const { dark } = useThemeStore();

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Reseller Program | VPS & RDP Partnership - ProxySock</title>
                <meta
                    name="description"
                    content="Join the ProxySock Reseller Program. Offer high-performance VPS and RDP solutions to your clients with our white-label infrastructure."
                />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "serviceType": "Reseller Program",
                        "provider": {
                            "@type": "Organization",
                            "name": "ProxySock",
                            "url": "https://www.proxysock.com"
                        },
                        "name": "VPS & RDP Reseller Program",
                        "description": "White-label VPS and RDP hosting infrastructure for resellers.",
                        "offers": {
                            "@type": "Offer",
                            "availability": "https://schema.org/InStock",
                            "price": "0",
                            "priceCurrency": "USD"
                        }
                    })}
                </script>
            </Helmet>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div
                    className="absolute inset-0 z-0 opacity-[0.10] pointer-events-none"
                    style={{
                        backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                    }}
                />
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Become a <span className="text-primary">ProxySock Reseller</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                            Scale your business by offering premium VPS and RDP hosting solutions.
                            Leverage our global infrastructure to provide enterprise-grade performance
                            to your clients.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="text-lg px-8 py-6" onClick={() => document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' })}>
                                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate('/contact')}>
                                Contact Sales
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Products Focus */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            <Card className="relative border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                                <CardContent className="p-8">
                                    <Server className="h-12 w-12 text-primary mb-6" />
                                    <h3 className="text-2xl font-bold mb-4">VPS Reseller</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Offer high-performance KVM Virtual Private Servers. Full root access,
                                        NVMe storage, and DDoS protection included.
                                    </p>
                                    <ul className="space-y-3 mb-8">
                                        {["Instant Deployment", "Windows & Linux OS", "99.9% Uptime", "Unmanaged & Managed"].map((item) => (
                                            <li key={item} className="flex items-center text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button variant="secondary" className="w-full" onClick={() => navigate('/vps')}>
                                        View VPS Products
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            <Card className="relative border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                                <CardContent className="p-8">
                                    <Monitor className="h-12 w-12 text-primary mb-6" />
                                    <h3 className="text-2xl font-bold mb-4">RDP Reseller</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Provide robust Remote Desktop Protocol solutions. Ideal for bots,
                                        SEO tools, and secure browsing environments.
                                    </p>
                                    <ul className="space-y-3 mb-8">
                                        {["Admin Access", "Private IP", "Residential ISP Options", "High Speed Network"].map((item) => (
                                            <li key={item} className="flex items-center text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button variant="secondary" className="w-full" onClick={() => navigate('/rdp')}>
                                        View RDP Products
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Why Partner With Us?</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            We provide the infrastructure so you can focus on sales and growth.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <Card key={feature.title} className="bg-background border-none shadow-md hover:shadow-xl transition-shadow">
                                <CardContent className="p-6">
                                    <feature.icon className="h-10 w-10 text-primary mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Application Form */}
            <section id="apply-form" className="py-24 px-4">
                <div className="max-w-3xl mx-auto">
                    <Card className="border-border shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 w-full h-2 bg-primary" />
                        <CardContent className="p-8 md:p-12">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold mb-2">Submit Your Interest</h2>
                                <p className="text-muted-foreground">
                                    Complete the form below to join our reseller network.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="John Doe"
                                                className="pl-10"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Work Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="john@company.com"
                                                className="pl-10"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company">Company Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="company"
                                            name="company"
                                            placeholder="My Hosting Ltd"
                                            className="pl-10"
                                            value={formData.company}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="interest">Product Interest</Label>
                                        <Select
                                            value={formData.interest}
                                            onValueChange={(val) => handleSelectChange("interest", val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Products" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="vps">VPS Only</SelectItem>
                                                <SelectItem value="rdp">RDP Only</SelectItem>
                                                <SelectItem value="both">Both VPS & RDP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="volume">Expected Monthly Volume (USD)</Label>
                                        <Select
                                            value={formData.volume}
                                            onValueChange={(val) => handleSelectChange("volume", val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Volume" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="<1k">Less than $1,000</SelectItem>
                                                <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                                                <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                                                <SelectItem value="10k+">$10,000+</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Additional Information</Label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                        <Textarea
                                            id="message"
                                            name="message"
                                            placeholder="Tell us about your business and specific requirements..."
                                            className="min-h-[120px] pl-10"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full text-lg h-12" disabled={isSubmitting}>
                                    {isSubmitting ? "Submitting Application..." : "Submit Application"}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    By submitting this form, you agree to our Terms of Service and Privacy Policy.
                                    Your data will be securely handled.
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
