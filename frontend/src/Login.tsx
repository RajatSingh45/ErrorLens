import { GoogleLogin } from "@react-oauth/google";

function Login() {
  const handleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      const data = await res.json();

      // console.log("User:", data);

      localStorage.setItem("token", data.token);
      localStorage.setItem(
         "user",
      JSON.stringify(data.user)
      );

      window.location.reload();

    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07090f] px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/95 p-10 shadow-2xl shadow-indigo-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_30%)]" />
        <div className="relative z-10 text-center">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">ErrorLens</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Modern error intelligence</h1>
            <p className="mt-4 text-sm text-slate-400">
              Sign in with Google to manage your projects, monitor issues, and review smart fixes.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.log("Login Failed")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;