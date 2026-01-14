import React from 'react';
import { Phone, Mail, MessageCircle, CheckCircle, Building2, Package, FileCheck, ClipboardList, Warehouse, Shield, Users, Target, Award, Briefcase, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const Home = () => {
  const handleCall = () => {
    window.location.href = 'tel:9205514887';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/919205514887', '_blank');
  };

  const handleEmail = () => {
    window.location.href = 'mailto:arvindsingh@audix.co.in';
  };

  const services = [
    {
      icon: Package,
      title: 'Stock / Inventory Audit',
      description: 'Independent verification of inventory to ensure accuracy, existence, valuation, and effectiveness of inventory controls across warehouses, retail outlets, and distribution centers.',
      image: 'https://images.unsplash.com/photo-1664382953403-fc1ac77073a0'
    },
    {
      icon: FileCheck,
      title: 'Internal Audit',
      description: 'Risk-based internal audits designed to evaluate governance frameworks, strengthen internal controls, and improve operational efficiency.',
      image: 'https://images.unsplash.com/photo-1573164574572-cb89e39749b4'
    },
    {
      icon: Building2,
      title: 'Fixed Asset Verification',
      description: 'Physical verification and reconciliation of fixed assets to ensure accuracy of records, tagging, movement control, and compliance with applicable accounting standards.',
      image: 'https://images.unsplash.com/photo-1753955900083-b62ee8d97805'
    },
    {
      icon: ClipboardList,
      title: 'SOP & Process Audit',
      description: 'Review and assessment of standard operating procedures to identify control gaps, inefficiencies, and opportunities for process improvement.',
      image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984'
    },
    {
      icon: Warehouse,
      title: 'Warehouse Audit',
      description: 'Comprehensive warehouse audits covering stock movement, storage practices, documentation controls, and loss prevention mechanisms.',
      image: 'https://images.unsplash.com/photo-1749244768351-2726dc23d26c'
    },
    {
      icon: Shield,
      title: 'Risk & Compliance Review',
      description: 'Evaluation of compliance risks, control weaknesses, and exposure areas to support informed management decision-making.',
      image: 'https://images.unsplash.com/photo-1752118464988-2914fb27d0f0'
    }
  ];

  const whyChoose = [
    'Founded by professionals with 10+ years of audit experience',
    'GST & MSME Registered audit firm',
    'Team comprising Audit Professionals, CA & CMA backgrounds',
    'Strong on-ground audit execution capabilities',
    'Ethical, independent, and confidential working approach',
    'Experience across multiple locations in India',
    'Trusted execution partner for professional firms and corporates'
  ];

  const industries = [
    { name: 'Retail Chains', icon: '🏪' },
    { name: 'Warehouses & Logistics', icon: '📦' },
    { name: 'Manufacturing Units', icon: '🏭' },
    { name: 'E-commerce', icon: '🛒' },
    { name: 'FMCG', icon: '🏢' },
    { name: 'Corporates', icon: '🏛️' },
    { name: 'Startups', icon: '🚀' }
  ];

  const approach = [
    { text: 'Structured and systematic', icon: Target },
    { text: 'Practical and field-oriented', icon: Briefcase },
    { text: 'Independent and unbiased', icon: Award },
    { text: 'Focused on clear, actionable outcomes', icon: TrendingUp }
  ];

  const teamMembers = [
    {
      name: 'Arvind Singh',
      role: 'Founder & Lead Auditor',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
      experience: '10+ years of hands-on experience in audit, assurance, inventory management, and fixed asset verification. Led numerous large-scale audit engagements across India.',
      expertise: ['Internal Audit', 'Inventory Management', 'Fixed Asset Verification', 'Risk Assessment']
    },
    {
      name: 'CA Professional',
      role: 'Chartered Accountant',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      experience: '8+ years of experience in statutory audits, taxation, and compliance. Specialized in corporate governance and financial reporting standards.',
      expertise: ['Statutory Audit', 'Tax Compliance', 'Financial Reporting', 'Corporate Governance']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-slate-200 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_company-profile-52/artifacts/j06th8bc_Audix%20Logo.png" 
                alt="AudiX Solutions Logo" 
                className="h-12 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#services" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">Services</a>
              <a href="#about" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">About</a>
              <a href="#team" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">Team</a>
              <a href="#contact" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
              <Button onClick={handleCall} variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-md">
                <Phone className="h-4 w-4 mr-2" />
                Call Us
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Background Image */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-800/95 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1606836591695-4d58a73eba1e" 
            alt="Professional Office" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto max-w-6xl relative z-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 px-6 py-2 rounded-full mb-6">
              <span className="text-sm font-medium text-blue-100">Audit • Assurance • Inventory Solutions • Fixed Asset Audits</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Trusted Audit & Advisory Partner
              <span className="block text-blue-400 mt-2">for Growing Businesses</span>
            </h2>
            <p className="text-xl text-slate-200 max-w-4xl mx-auto leading-relaxed mb-8">
              AudiX Solutions & Co. delivers structured, reliable, and execution-driven audit solutions backed by over 10+ years of leadership experience. We support organizations and professional firms with high-quality audit execution, strong internal control reviews, and dependable on-ground audit support across India.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button onClick={handleCall} size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 shadow-lg hover:shadow-xl transition-all">
                <Phone className="h-5 w-5 mr-2" />
                Call Us
              </Button>
              <Button onClick={handleWhatsApp} size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 shadow-lg hover:shadow-xl transition-all">
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-slate-200">
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Phone className="h-4 w-4 mr-2" />
                <span>9205514887</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Mail className="h-4 w-4 mr-2" />
                <span>arvindsingh@audix.co.in</span>
              </div>
              <div>
                <Badge variant="secondary" className="bg-blue-500/30 text-white border-blue-400/30">Delhi | Delhi NCR | Pan-India</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Who We Are</h3>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1622675363311-3e1904dc1885" 
                alt="Professional Team" 
                className="rounded-2xl shadow-xl"
              />
            </div>
            <div>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                AudiX Solutions & Co. is an audit and advisory firm founded by a seasoned audit professional with more than a decade of hands-on experience in audit, assurance, inventory management, and fixed asset verification.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Although AudiX is a newly established firm, its foundation is built on deep domain expertise, field-level execution strength, and structured audit methodologies developed over years of professional practice. Our team brings practical exposure across diverse audit environments and industries, enabling us to deliver audits that are not only compliant but also value-focused.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed">
                We work closely with clients to strengthen internal controls, enhance operational efficiency, and provide clear, actionable audit insights aligned with professional standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose AudiX */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-100 to-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Why Choose AudiX</h3>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {whyChoose.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1">
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <p className="text-slate-700 text-lg">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section id="services" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Our Services</h3>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto mb-4"></div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Comprehensive audit solutions tailored to your business needs</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 border-0 shadow-lg">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <service.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 leading-relaxed">{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Manpower & Vendor Support */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-900 via-slate-800 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1740914994657-f1cdffdc418e)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4">Audit Manpower & Vendor Support</h3>
            <div className="w-20 h-1 bg-white mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl">
              <h4 className="text-2xl font-bold mb-4">Dedicated Payroll-Based Audit Manpower</h4>
              <p className="leading-relaxed mb-4">
                At AudiX Solutions & Co., we do not engage or deploy per-day manpower for audit assignments. All audit work is executed exclusively through experienced audit professionals who are on our payroll, ensuring consistency, accountability, and execution quality across all engagements.
              </p>
              <p className="leading-relaxed">
                We believe audit execution demands trained, disciplined, and stable teams, not temporary resources engaged for short-term cost optimization. Our payroll-based model allows better control, continuity, and reliable outcomes for clients and partner firms.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl">
              <h4 className="text-2xl font-bold mb-4">Vendor Support for Large Audit Firms</h4>
              <p className="leading-relaxed mb-6">
                AudiX also works as a trusted execution partner for large audit firms and professional practices. We provide structured on-ground audit support while strictly following the principal firm's audit methodology, reporting formats, timelines, and confidentiality requirements.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>No per-day or ad-hoc manpower</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>100% payroll-based experienced audit professionals</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>Reduced supervision and rework</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>Reliable execution for large and multi-location audits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>Professional independence and confidentiality maintained</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries We Serve - 3D Effect */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Industries We Serve</h3>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {industries.map((industry, index) => (
              <div 
                key={index} 
                className="industry-card bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 hover:scale-105 border-2 border-slate-200 hover:border-blue-400"
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{industry.icon}</div>
                  <p className="text-slate-700 font-medium text-sm">{industry.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Our Approach</h3>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto mb-4"></div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">We believe audits should go beyond compliance and deliver practical value.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {approach.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="text-center p-8 bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl hover:from-blue-100 hover:to-slate-100 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-1">
                  <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-slate-700 font-medium text-lg">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Team / Leadership */}
      <section id="team" className="py-20 px-4 bg-gradient-to-br from-slate-100 to-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Our Leadership Team</h3>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto mb-4"></div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Meet the professionals driving excellence in audit and assurance services</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="overflow-hidden shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border-0">
                <div className="h-80 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                  <CardTitle className="text-2xl">{member.name}</CardTitle>
                  <CardDescription className="text-blue-100 text-lg">{member.role}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <p className="text-slate-700 leading-relaxed mb-4">{member.experience}</p>
                  <div className="mt-4">
                    <p className="font-semibold text-slate-900 mb-2">Areas of Expertise:</p>
                    <div className="flex flex-wrap gap-2">
                      {member.expertise.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="py-20 px-4 bg-slate-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4">Contact Us</h3>
            <div className="w-20 h-1 bg-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-slate-300">Connect with us via call or WhatsApp to discuss your audit and manpower support requirements.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl" onClick={handleCall}>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Phone</CardTitle>
                <CardDescription className="text-slate-300 text-lg">9205514887</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl" onClick={handleEmail}>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Email</CardTitle>
                <CardDescription className="text-slate-300 text-lg break-all">arvindsingh@audix.co.in</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl" onClick={handleWhatsApp}>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">WhatsApp</CardTitle>
                <CardDescription className="text-slate-300 text-lg">Chat with us</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="text-center mt-12">
            <p className="text-slate-400 mb-2">Visit our website</p>
            <a href="http://www.audix.co.in" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xl font-medium transition-colors">www.audix.co.in</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <img 
                src="https://customer-assets.emergentagent.com/job_company-profile-52/artifacts/j06th8bc_Audix%20Logo.png" 
                alt="AudiX Solutions Logo" 
                className="h-12 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-slate-400 text-sm">Where Audits Meet Exceptional X-ceptionalism</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#services" className="block text-slate-400 hover:text-blue-400 transition-colors">Our Services</a>
                <a href="#about" className="block text-slate-400 hover:text-blue-400 transition-colors">About Us</a>
                <a href="#team" className="block text-slate-400 hover:text-blue-400 transition-colors">Our Team</a>
                <a href="#contact" className="block text-slate-400 hover:text-blue-400 transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Contact Info</h4>
              <div className="space-y-2 text-slate-400">
                <p className="flex items-center"><Phone className="h-4 w-4 mr-2" /> 9205514887</p>
                <p className="flex items-center"><Mail className="h-4 w-4 mr-2" /> arvindsingh@audix.co.in</p>
                <p className="text-sm">Delhi | Delhi NCR | North Zone | Pan-India</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center">
            <p className="text-slate-400 text-sm">© 2025 AudiX Solutions & Co. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;