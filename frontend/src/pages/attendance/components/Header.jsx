import React, { useState } from 'react';
import { navLinks } from '../data/mockData';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('Home');

  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 animate-spin-slow" style={{ animationDuration: '8s' }}></div>
              <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                <div className="w-5 h-5 bg-[#2D3A8C] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900">Audix Solutions</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveLink(link.label);
                }}
                className={`text-sm font-medium transition-colors hover:text-[#2D3A8C] ${
                  activeLink === link.label
                    ? 'text-[#2D3A8C] border-b-2 border-[#2D3A8C] pb-1'
                    : 'text-gray-600'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Login Button */}
          <button className="hidden md:block bg-[#2D3A8C] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#1E2A6E] transition-all duration-300 hover:shadow-lg hover:shadow-[#2D3A8C]/30">
            Desktop Login
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveLink(link.label);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-sm font-medium px-4 py-2 ${
                    activeLink === link.label
                      ? 'text-[#2D3A8C] bg-blue-50'
                      : 'text-gray-600'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <button className="mx-4 bg-[#2D3A8C] text-white px-6 py-2.5 rounded-lg font-medium text-sm">
                Desktop Login
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
