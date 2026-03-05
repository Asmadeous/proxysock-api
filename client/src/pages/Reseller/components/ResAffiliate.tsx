import { LinkIcon } from "@heroicons/react/24/outline";

export default function ResAffiliate() {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Affiliate Program</h2>
            <div className="bg-muted rounded-xl border border-border p-6 text-center">
                <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">Earn commissions by referring new customers.</p>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">Enroll Now</button>
            </div>
        </div>
    );
}
