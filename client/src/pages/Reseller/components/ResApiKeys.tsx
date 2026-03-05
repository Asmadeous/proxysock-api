import { inputClasses } from "../../SuperAdmin/components/FormModal";

export default function ResApiKeys() {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
            <div className="bg-muted rounded-xl border border-border p-6">
                <p className="text-muted-foreground text-sm mb-4">Your API credentials are used for automated proxy ordering. Keep them secure.</p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">API Token</label>
                        <div className="flex items-center gap-2">
                            <input type="password" readOnly value="••••••••••••••••" className={`${inputClasses} flex-1`} />
                            <button className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80">Show</button>
                            <button className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">Rotate</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
