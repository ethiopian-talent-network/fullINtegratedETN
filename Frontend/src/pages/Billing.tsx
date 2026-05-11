import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  ArrowRight,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  Trash2,
  Plus,
} from "lucide-react";
import {
  getBillingInfo,
  upsertBillingInfo,
  deleteBillingInfo,
  type BillingInfo,
} from "../api/billing/billingApi";
import { useAuth } from "../contexts/AuthContext";

type PayoutMethod = "telebirr" | "cbe_birr" | "bank";

export default function Billing() {
  const { darkMode } = useDarkMode();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BillingInfo>>({});

  useEffect(() => {
    if (token) {
      fetchBillingInfo();
    }
  }, [token]);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBillingInfo(token);
      setBillingInfo(response.billing || null);
      setFormData(response.billing || {});
    } catch (err: any) {
      if (err.message === "Billing information not found") {
        // No billing info exists, show form to create
        setBillingInfo(null);
        setFormData({});
      } else {
        setError(err.message || "Failed to fetch billing information");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    // Validate required fields
    if (
      !formData.full_name ||
      !formData.email ||
      !formData.phone ||
      !formData.payout_method
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate payout method specific fields
    if (
      formData.payout_method === "bank" &&
      (!formData.account_number || !formData.bank_name)
    ) {
      setError(
        "Bank account number and bank name are required for bank payout method",
      );
      return;
    }

    if (
      (formData.payout_method === "telebirr" ||
        formData.payout_method === "cbe_birr") &&
      !formData.account_number
    ) {
      setError("Phone number is required for telebirr/cbe_birr payout method");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await upsertBillingInfo(
        token,
        formData as Omit<
          BillingInfo,
          "id" | "user_id" | "is_verified" | "created_at" | "updated_at"
        >,
      );

      await fetchBillingInfo();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save billing information");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !billingInfo?.id) return;

    if (!confirm("Are you sure you want to delete your billing information?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteBillingInfo(token);
      setBillingInfo(null);
      setFormData({});
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to delete billing information");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getPayoutMethodIcon = (method: PayoutMethod) => {
    switch (method) {
      case "telebirr":
      case "cbe_birr":
        return <Smartphone className="w-5 h-5" />;
      case "bank":
        return <Building2 className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPayoutMethodName = (method: PayoutMethod) => {
    switch (method) {
      case "telebirr":
        return "Telebirr";
      case "cbe_birr":
        return "CBE Birr";
      case "bank":
        return "Bank Transfer";
      default:
        return method;
    }
  };

  if (loading && !billingInfo) {
    return (
      <div
        className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0084ca]"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Header */}
      <header
        className={`transition-colors duration-300 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-b border-gray-200"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/talent-dashboard"
              className={`flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
                darkMode
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/" className="text-2xl font-bold text-[#0084ca]">
                ETN
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Billing Information
          </h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Manage your payment methods and billing details
          </p>
        </div>

        {/* Billing Form */}
        {!billingInfo || isEditing ? (
          <div
            className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                {billingInfo
                  ? "Edit Billing Information"
                  : "Add Billing Information"}
              </h2>
              {billingInfo && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3
                  className={`text-lg font-medium mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name || ""}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-[#0084ca]`}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-[#0084ca]`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-[#0084ca]`}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payout Method */}
              <div>
                <h3
                  className={`text-lg font-medium mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Payout Method *
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      value: "telebirr",
                      label: "Telebirr",
                      description: "Mobile money transfer",
                    },
                    {
                      value: "cbe_birr",
                      label: "CBE Birr",
                      description: "Commercial Bank of Ethiopia",
                    },
                    {
                      value: "bank",
                      label: "Bank Transfer",
                      description: "Direct bank deposit",
                    },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        formData.payout_method === method.value
                          ? "border-[#0084ca] bg-[#0084ca]10"
                          : darkMode
                            ? "border-gray-600 bg-gray-700 hover:bg-gray-600"
                            : "border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payout_method"
                          value={method.value}
                          checked={formData.payout_method === method.value}
                          onChange={handleInputChange}
                          className="text-[#0084ca]"
                        />
                        <div>
                          <div className="font-medium">{method.label}</div>
                          <div
                            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {method.description}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Account Details */}
              <div>
                <h3
                  className={`text-lg font-medium mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {formData.payout_method === "bank"
                        ? "Account Number *"
                        : "Phone Number *"}
                    </label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number || ""}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-[#0084ca]`}
                      placeholder={
                        formData.payout_method === "bank"
                          ? "Enter bank account number"
                          : "Enter phone number"
                      }
                      required
                    />
                  </div>
                  {formData.payout_method === "bank" && (
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name || ""}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-[#0084ca]`}
                        placeholder="Enter bank name"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    loading
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-[#0084ca] text-white hover:bg-[#006ba6]"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>
                        {billingInfo ? "Update" : "Save"} Billing Info
                      </span>
                    </div>
                  )}
                </button>

                {billingInfo && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(billingInfo);
                    }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* Billing Info Display */
          <div
            className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Billing Information
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3
                  className={`text-lg font-medium mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p
                      className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Full Name
                    </p>
                    <p
                      className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {billingInfo.full_name}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Email
                    </p>
                    <p
                      className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {billingInfo.email}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Phone
                    </p>
                    <p
                      className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {billingInfo.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payout Method */}
              <div>
                <h3
                  className={`text-lg font-medium mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Payout Method
                </h3>
                <div
                  className={`p-4 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}
                >
                  <div className="flex items-center gap-3">
                    {getPayoutMethodIcon(billingInfo.payout_method)}
                    <div>
                      <p
                        className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {getPayoutMethodName(billingInfo.payout_method)}
                      </p>
                      <p
                        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {billingInfo.payout_method === "bank"
                          ? `${billingInfo.bank_name} - ${billingInfo.account_number}`
                          : billingInfo.account_number}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div>
                <h3
                  className={`text-lg font-medium mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Verification Status
                </h3>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    billingInfo.is_verified
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  }`}
                >
                  {billingInfo.is_verified ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Pending Verification
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add New Billing Info Button */}
        {billingInfo && !isEditing && (
          <div className="mt-6">
            <button
              onClick={() => {
                setBillingInfo(null);
                setFormData({});
                setIsEditing(true);
              }}
              className={`w-full p-4 rounded-lg border-2 border-dashed transition-colors ${
                darkMode
                  ? "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Add New Billing Method</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
