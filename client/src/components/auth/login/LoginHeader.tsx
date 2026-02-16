import logo from "../../../assets/images/favicon.svg";

export default function LoginHeader() {
  return (
    <div className="text-center mb-8 ">
      <div className="md:hidden hidden items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl mb-6 border border-red-500/30">
        <img
          src={logo}
          alt="ProxySock"
          className="h-10 w-10"
        />
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-2">
        Welcome Back
      </h2>
      <p className="text-foreground text-lg">
        Sign in to access your dashboard
      </p>
    </div>
  );
} 
