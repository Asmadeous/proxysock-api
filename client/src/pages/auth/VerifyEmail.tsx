import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthLogo from "../../components/auth/AuthLogo";
import { toast } from "react-hot-toast";
import { verifyEmail } from "../../services/railsAuth";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        verifyEmail(token)
            .then(() => {
                setStatus("success");
                toast.success("Email verified!");
                setTimeout(() => navigate("/dashboard"), 2000);
            })
            .catch((error) => {
                setStatus("error");
                toast.error(error.response?.data?.error || "Verification failed");
            });
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 text-center">
                <AuthLogo variant="auto" />
                {status === "verifying" && <h2 className="text-xl">Verifying your email...</h2>}
                {status === "success" && <h2 className="text-xl text-green-600">Email verified! Redirecting...</h2>}
                {status === "error" && <h2 className="text-xl text-red-600">Verification failed or link expired.</h2>}
            </div>
        </div>
    );
}
