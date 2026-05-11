import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { TALENT_ROUTES } from "../../../config/routes";
import { getTokenBalance } from "../../../api/talent/talentApi";

export function TokenCard() {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokenBalance();
  }, []);

  const loadTokenBalance = async () => {
    try {
      const response = await getTokenBalance();
      setTokenBalance(response.balance);
    } catch (error) {
      console.error("Failed to load token balance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="lg:col-span-1 order-first lg:order-last">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 sm:p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-1 order-first lg:order-last">
      <div className="bg-gradient-to-br from-[#0084ca] to-[#006ba6] rounded-xl border border-[#0084ca]/20 shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-sm sm:text-base">
              Token Balance
            </span>
          </div>
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>+12%</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
            {tokenBalance}
          </div>
          <p className="text-white/80 text-xs sm:text-sm">tokens available</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-white/90 text-xs sm:text-sm">
            <span>Applications used</span>
            <span className="font-medium">5 tokens</span>
          </div>
          <div className="flex items-center justify-between text-white/90 text-xs sm:text-sm">
            <span>Pending refunds</span>
            <span className="font-medium">0 tokens</span>
          </div>
        </div>

        <Link
          to={TALENT_ROUTES.APPLICATIONS.path}
          className="mt-4 block w-full bg-white/20 hover:bg-white/30 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          <div className="flex items-center justify-center gap-2">
            <span>View Applications</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
