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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.12),transparent_30%),#030712] px-4">
      <div className="w-full max-w-md bg-zinc-950/95 border border-zinc-800 shadow-2xl shadow-indigo-500/10 rounded-3xl p-10 text-center backdrop-blur-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">Welcome to ErrorLens</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Sign in with Google to manage your projects and inspect error reports.
          </p>
        </div>

        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
        />
      </div>
    </div>
  );
}

export default Login;