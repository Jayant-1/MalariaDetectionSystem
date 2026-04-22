import { motion } from "framer-motion";
import {
  Activity,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Features", path: "/#features" },
      { name: "Detection", path: "/detection" },
      { name: "How It Works", path: "/#how-it-works" },
      { name: "Pricing", path: "/#pricing" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Team", path: "/team" },
      { name: "Careers", path: "/careers" },
      { name: "Contact", path: "/contact" },
    ],
    resources: [
      { name: "Documentation", path: "/docs" },
      { name: "API Reference", path: "/api" },
      { name: "Support", path: "/support" },
      { name: "FAQs", path: "/faqs" },
    ],
    legal: [
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms of Service", path: "/terms" },
      { name: "Cookie Policy", path: "/cookies" },
      { name: "Compliance", path: "/compliance" },
    ],
  };

  const socialLinks = [
    { icon: Github, href: "https://github.com/Jayant-1", label: "GitHub" },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/jayant-potdar-880a461b8/",
      label: "LinkedIn",
    },
    { icon: Twitter, href: "https://x.com/Jayantpotdar_", label: "Twitter" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-8 border-b border-gray-800">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 group mb-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-primary-500 to-teal-500 p-2 rounded-lg"
              >
                <Activity className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-display font-bold text-white">
                  Malaria Detection AI
                </span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 mb-4 max-w-sm">
              Empowering hospitals with AI-powered diagnostics for faster, more
              accurate malaria detection and treatment.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-primary-600 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="py-8 border-b border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-primary-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Email</p>
                <a
                  href="mailto:jayantpotdar2006@gmail.com"
                  className="text-sm hover:text-primary-400 transition-colors"
                >
                  jayantpotdar2006@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-primary-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Phone</p>
                <a
                  href="tel:+918788640172"
                  className="text-sm hover:text-primary-400 transition-colors"
                >
                  +91 878 864 0172
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-primary-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Location</p>
                <p className="text-sm">
                  Poona Hospital & Research Centre, Pune
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-400">
            © {currentYear} Malaria Detection AI. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <span>Made with ❤️ for Healthcare</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">ISO 27001 Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
