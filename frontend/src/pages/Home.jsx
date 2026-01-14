import React from 'react';
import { Phone, Mail, MessageCircle, CheckCircle, Building2, Package, FileCheck, ClipboardList, Warehouse, Shield, Users, Target } from 'lucide-react';
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
      description: 'Independent verification of inventory to ensure accuracy, existence, valuation, and effectiveness of inventory controls across warehouses, retail outlets, and distribution centers.'
    },
    {
      icon: FileCheck,
      title: 'Internal Audit',
      description: 'Risk-based internal audits designed to evaluate governance frameworks, strengthen internal controls, and improve operational efficiency.'
    },
    {
      icon: Building2,
      title: 'Fixed Asset Verification',
      description: 'Physical verification and reconciliation of fixed assets to ensure accuracy of records, tagging, movement control, and compliance with applicable accounting standards.'
    },
    {
      icon: ClipboardList,
      title: 'SOP & Process Audit',
      description: 'Review and assessment of standard operating procedures to identify control gaps, inefficiencies, and opportunities for process improvement.'
    },
    {
      icon: Warehouse,
      title: 'Warehouse Audit',
      description: 'Comprehensive warehouse audits covering stock movement, storage practices, documentation controls, and loss prevention mechanisms.'
    },
    {
      icon: Shield,
      title: 'Risk & Compliance Review',
      description: 'Evaluation of compliance risks, control weaknesses, and exposure areas to support informed management decision-making.'
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
    'Retail Chains',
    'Warehouses & Logistics',
    'Manufacturing Units',
    'E-commerce',
    'FMCG',
    'Corporates',
    'Startups'
  ];

  const approach = [
    'Structured and systematic',
    'Practical and field-oriented',
    'Independent and unbiased',
    'Focused on clear, actionable outcomes'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">AudiX Solutions & Co.</h1>
                <p className="text-xs text-slate-600">Where Audits Meet Exceptional X-ceptionalism</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#services" className="text-slate-700 hover:text-blue-600 transition-colors">Services</a>
              <a href="#about" className="text-slate-700 hover:text-blue-600 transition-colors">About</a>
              <a href="#contact" className="text-slate-700 hover:text-blue-600 transition-colors">Contact</a>
              <Button onClick={handleCall} variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Phone className="h-4 w-4 mr-2" />
                Call Us
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
              <span className="text-sm font-medium text-blue-700">Audit • Assurance • Inventory Solutions • Fixed Asset Audits</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Trusted Audit & Advisory Partner
              <span className="block text-blue-600 mt-2">for Growing Businesses</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-8">
              AudiX Solutions & Co. delivers structured, reliable, and execution-driven audit solutions backed by over 10+ years of leadership experience. We support organizations and professional firms with high-quality audit execution, strong internal control reviews, and dependable on-ground audit support across India.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button onClick={handleCall} size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                <Phone className="h-5 w-5 mr-2" />
                Call Us
              </Button>
              <Button onClick={handleWhatsApp} size="lg" variant="outline" className="text-lg px-8 border-2 hover:bg-green-50 hover:border-green-500 hover:text-green-700">
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-slate-600">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>9205514887</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span>arvindsingh@audix.co.in</span>
              </div>
              <div>
                <Badge variant="secondary">Delhi | Delhi NCR | Pan-India</Badge>
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
            <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
          </div>
          <div className="max-w-4xl mx-auto">
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
      </section>

      {/* Why Choose AudiX */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Why Choose AudiX</h3>
            <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {whyChoose.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
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
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Comprehensive audit solutions tailored to your business needs</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-slate-200">
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
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4">Audit Manpower & Vendor Support</h3>
            <div className="w-20 h-1 bg-white mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg">
              <h4 className="text-2xl font-bold mb-4">Dedicated Payroll-Based Audit Manpower</h4>
              <p className="leading-relaxed mb-4">
                At AudiX Solutions & Co., we do not engage or deploy per-day manpower for audit assignments. All audit work is executed exclusively through experienced audit professionals who are on our payroll, ensuring consistency, accountability, and execution quality across all engagements.
              </p>
              <p className="leading-relaxed">
                We believe audit execution demands trained, disciplined, and stable teams, not temporary resources engaged for short-term cost optimization. Our payroll-based model allows better control, continuity, and reliable outcomes for clients and partner firms.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg">
              <h4 className="text-2xl font-bold mb-4">Vendor Support for Large Audit Firms</h4>
              <p className="leading-relaxed mb-6">
                AudiX also works as a trusted execution partner for large audit firms and professional practices. We provide structured on-ground audit support while strictly following the principal firm's audit methodology, reporting formats, timelines, and confidentiality requirements.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>No per-day or ad-hoc manpower</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>100% payroll-based experienced audit professionals</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Reduced supervision and rework</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Reliable execution for large and multi-location audits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Professional independence and confidentiality maintained</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Industries We Serve</h3>
            <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {industries.map((industry, index) => (
              <Badge key={index} variant="outline" className="text-lg px-6 py-3 border-2 border-slate-300 hover:border-blue-600 hover:bg-blue-50 transition-colors">
                {industry}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Our Approach</h3>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">We believe audits should go beyond compliance and deliver practical value.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {approach.map((item, index) => (
              <div key={index} className="text-center p-6 bg-slate-50 rounded-lg hover:bg-blue-50 transition-colors">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <p className="text-slate-700 font-medium text-lg">{item}</p>
              </div>
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
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer" onClick={handleCall}>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Phone</CardTitle>
                <CardDescription className="text-slate-300 text-lg">9205514887</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer" onClick={handleEmail}>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Email</CardTitle>
                <CardDescription className="text-slate-300 text-lg break-all">arvindsingh@audix.co.in</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer" onClick={handleWhatsApp}>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">WhatsApp</CardTitle>
                <CardDescription className="text-slate-300 text-lg">Chat with us</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="text-center mt-12">
            <p className="text-slate-400 mb-2">Visit our website</p>
            <a href="http://www.audix.co.in" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xl font-medium">www.audix.co.in</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building2 className="h-6 w-6 text-blue-500" />
              <div>
                <p className="font-bold">AudiX Solutions & Co.</p>
                <p className="text-sm text-slate-400">Where Audits Meet Exceptional X-ceptionalism</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-400 text-sm">© 2025 AudiX Solutions & Co. All rights reserved.</p>
              <p className="text-slate-500 text-xs mt-1">Delhi | Delhi NCR | North Zone | Pan-India</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;