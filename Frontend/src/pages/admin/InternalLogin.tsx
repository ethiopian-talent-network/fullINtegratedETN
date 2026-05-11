import { useState } from "react";
import { useNavigate } from "react-router";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { internalLogin } from "../../api/admin/adminApi";
import { ShieldCheck, Eye, EyeOff, Moon, Sun, AlertCircle, Loader2 } from "lucide-react";

export default function InternalLogin() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const dm = darkMode;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await internalLogin(email, password);
      // Store token separately from public auth
      localStorage.setItem("internal_token", data.token);
      localStorage.setItem("internal_user", JSON.stringify(data.user));

      if (data.role === "admin") navigate("/admin/dashboard");
      else if (data.role === "owner") navigate("/owner");
      else setError("Access denied.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[#0084ca]/30 ${
    dm
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-[#0084ca]"
      : "bg-white border-slate-300 text-gray-900 placeholder-gray-400 focus:border-[#0084ca]"
  }`;

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${dm ? "bg-gray-950" : "bg-slate-100"}`}>
      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className={`fixed top-4 right-4 p-2 rounded-lg transition-colors ${dm ? "bg-gray-800 text-gray-400 hover:text-white" : "bg-white text-gray-500 hover:text-gray-900 shadow-sm"}`}
      >
        {dm ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className={`w-full max-w-md rounded-2xl border p-8 shadow-xl ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"}`}>
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0084ca] to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-[#0084ca]/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${dm ? "text-white" : "text-gray-900"}`}>Internal Portal</h1>
          <p className={`text-sm mt-1 ${dm ? "text-gray-400" : "text-gray-500"}`}>
            Restricted access — Admin &amp; Owner only
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dm ? "text-gray-300" : "text-gray-700"}`}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@etn.com"
              className={inputCls}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dm ? "text-gray-300" : "text-gray-700"}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${dm ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0084ca] hover:bg-[#006ba6] text-white font-semibold transition-colors disabled:opacity-50 mt-2 shadow-sm shadow-[#0084ca]/20"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
          </button>
        </form>

        <div className={`mt-6 pt-5 border-t text-center text-xs ${dm ? "border-gray-800 text-gray-600" : "border-slate-200 text-gray-400"}`}>
          This portal is for authorized internal staff only.<br />
          Unauthorized access is prohibited.
        </div>
      </div>
    </div>
  );
}
