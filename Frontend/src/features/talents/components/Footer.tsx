import { Link } from "react-router";
import { Heart, GitBranch, Globe, Mail } from "lucide-react";
import { TALENT_ROUTES, SHARED_ROUTES } from "../../../config/routes";

const NAV_LINKS = [
  { label: "Find Jobs", to: TALENT_ROUTES.DASHBOARD.path },
  { label: "My Applications", to: TALENT_ROUTES.APPLICATIONS.path },
  { label: "Network", to: TALENT_ROUTES.NETWORK.path },
  { label: "Messages", to: SHARED_ROUTES.MESSAGES.path },
  { label: "Profile", to: TALENT_ROUTES.PROFILE.path },
  { label: "Portfolio", to: TALENT_ROUTES.PORTFOLIO.path },
];

const SUPPORT_LINKS = ["Help Center", "Privacy Policy", "Terms of Service", "Contact Us"];

export function Footer() {
  return (
    <footer className="w-full mt-12 bg-black">

      {/* Main body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">

          {/* Brand */}
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <span className="etn-brand-fancy text-3xl">ETN</span>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              Connecting Ethiopian talents with world-class opportunities. Build your career, grow your network.
            </p>
            <div className="flex items-center gap-1 mt-1">
              <a href="mailto:support@etn.com"
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <GitBranch className="w-4 h-4" />
              </a>
              <a href="https://etn.com" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg text-gray-500 hover:text-[#0084ca] hover:bg-white/10 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">
              Support
            </h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((item) => (
                <li key={item}>
                  <span className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600 text-center sm:text-left">
            © {new Date().getFullYear()} Ethiopian Talent Network. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by the ETN Team
          </p>
        </div>
      </div>

    </footer>
  );
}
