import React from 'react';
import { navLinks } from '../data/mockData';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1E2A5E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
                <div className="absolute inset-1 bg-[#1E2A5E] rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#1E2A5E] rounded-full"></div>
                  </div>
                </div>
              </div>
              <span className="text-xl font-bold">Audix Solutions</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Smart management solution for your business. Track attendance, manage payroll, and automate HR tasks effortlessly.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Features</h3>
            <ul className="space-y-2">
              {['Employee Management', 'Attendance Tracking', 'Payroll Management', 'Vehicle Management', 'Cashbook', 'Reports'].map((item, idx) => (
                <li key={idx}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">Wesoftek Solutions Pvt Ltd, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <a href="mailto:support@supermanage.io" className="text-gray-400 hover:text-white transition-colors text-sm">
                  support@supermanage.io
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400 flex-shrink-0" />
                <a href="tel:+919876543210" className="text-gray-400 hover:text-white transition-colors text-sm">
                  +91 98765 43210
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 Wesoftek Solutions Pvt Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
