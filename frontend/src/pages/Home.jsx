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
    },
    {
      icon: Users,
      title: 'Manpower Sourcing (Audit Support Services)',
      description: 'We provide trained audit manpower support to larger audit firms for on-ground audit execution and operational assistance. Our team supports audit engagements by assisting with stock verification, retail and warehouse audits, data validation, MIS support, and process checks, working strictly under the scope and supervision defined by the lead audit firm. This collaboration model allows partner firms to scale audit operations efficiently, while enabling our team to gain structured exposure, hands-on experience, and continuous training in real audit environments. We focus on professional conduct, data confidentiality, and process discipline, ensuring audit work is executed accurately and in line with engagement requirements.',
      image: 'https://images.unsplash.com/photo-1622675363311-3e1904dc1885'
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
      name: 'Arvind Singh Bora',
      role: 'Founder & Lead Auditor',
      image: 'https://customer-assets.emergentagent.com/job_company-profile-52/artifacts/qwj5paje_My%20own%20Pic.jpeg',
      experience: 'Graduate with 10+ years of extensive experience across multiple leading audit firms including Future Group and NHBS. Specialized in execution-driven audit solutions, inventory management, and fixed asset verification with proven track record in managing large-scale multi-location audit engagements.',
      expertise: ['Stock & Inventory Audit', 'Fixed Asset Verification', 'Internal Audit', 'Warehouse Audit', 'Process Audit', 'Multi-location Audits']
    },
    {
      name: 'Vikas Punia',
      role: 'CA Professional Advisor',
      image: 'https://customer-assets.emergentagent.com/job_company-profile-52/artifacts/wm7jfmgm_Vikas%20%20punia%20ca%20Pic.jpeg',
      experience: 'A finance and audit professional with 6+ years of experience, including Big 4 firm exposure, with strong expertise across assurance, advisory, and compliance functions. Specialized in statutory audits, ICFR, IFRS, US GAAP process reviews, and IPO listing support.',
      expertise: ['Statutory & Tax Audits', 'ICFR & IFRS', 'Due Diligence', 'Virtual CFO Services', 'IPO Listing Support', 'Global Accounting']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-slate-200 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-6 relative overflow-hidden">
          {/* Background Logo Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <img 
              src="https://customer-assets.emergentagent.com/job_company-profile-52/artifacts/j06th8bc_Audix%20Logo.png" 
              alt="Background Logo" 
              className="h-32 w-auto"
            />
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_company-profile-52/artifacts/j06th8bc_Audix%20Logo.png" 
                alt="AudiX Solutions Logo" 
                className="h-20 w-auto"
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 company-name-3d">
                  AudiX Solutions & Co.
                </h1>
                <p className="text-xs md:text-sm text-slate-600 font-semibold">Where Audits Meet Exceptional X-ceptionalism</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#services" className="text-slate-700 hover:text-blue-600 transition-colors font-semibold text-lg">Services</a>
              <a href="#about" className="text-slate-700 hover:text-blue-600 transition-colors font-semibold text-lg">About</a>
              <a href="#team" className="text-slate-700 hover:text-blue-600 transition-colors font-semibold text-lg">Team</a>
              <a href="#contact" className="text-slate-700 hover:text-blue-600 transition-colors font-semibold text-lg">Contact</a>
              <Button onClick={handleCall} variant="default" size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                <Phone className="h-5 w-5 mr-2" />
                Call Us
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Background Image */}
      <section className="relative pt-40 pb-24 px-4 overflow-hidden">
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
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <div className="flex items-center justify-center space-x-2 bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full">
                <Award className="h-5 w-5 text-yellow-300" />
                <span className="text-sm font-bold text-white">Your Trusted Audit Partner</span>
              </div>
            </div>
            <h3 className="text-5xl font-bold mb-6">Why Choose AudiX</h3>
            <div className="w-24 h-1.5 bg-yellow-400 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">Experience the difference of working with audit professionals who combine expertise, integrity, and execution excellence</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {whyChoose.map((item, index) => (
              <div 
                key={index} 
                className="why-choose-card bg-white/10 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/30 hover:border-yellow-400 transition-all transform hover:-translate-y-3 hover:scale-105 shadow-2xl hover:shadow-yellow-500/30 group relative overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-400/0 group-hover:from-yellow-400/10 group-hover:to-transparent transition-all duration-300 rounded-2xl"></div>
                
                <div className="flex items-start space-x-4 relative z-10">
                  <div className="flex-shrink-0">
                    <div className="h-14 w-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/50 transition-all group-hover:rotate-12 group-hover:scale-110">
                      <CheckCircle className="h-7 w-7 text-blue-900" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-lg font-semibold leading-relaxed group-hover:text-yellow-100 transition-colors">{item}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Trust badges */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">10+</div>
              <p className="text-sm text-blue-100">Years Experience</p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">16+</div>
              <p className="text-sm text-blue-100">Trusted Clients</p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">100%</div>
              <p className="text-sm text-blue-100">Compliance</p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">Pan-India</div>
              <p className="text-sm text-blue-100">Coverage</p>
            </div>
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
          
          {/* First 6 Services in Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {services.slice(0, 6).map((service, index) => (
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
          
          {/* Manpower Sourcing - Full Width Landscape Card */}
          {services.slice(6).map((service, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 border-0 shadow-lg">
              <div className="grid md:grid-cols-3 gap-0">
                {/* Image Section - 1/3 width */}
                <div className="h-64 md:h-auto overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
                {/* Content Section - 2/3 width */}
                <div className="md:col-span-2 p-8">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <service.icon className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                      <CardDescription className="text-slate-600 leading-relaxed text-base">
                        {service.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
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

      {/* Our Clients */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)' }}></div>
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4">Our Esteemed Clients</h3>
            <div className="w-20 h-1 bg-blue-400 mx-auto mb-4"></div>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Trusted by leading brands across India for reliable audit and assurance services</p>
          </div>

          {/* Main Clients */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-bold text-blue-400 mb-2">Main Clients</h4>
              <p className="text-slate-300">Direct audit and assurance engagements with leading retail brands</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {[
                { name: 'Fabindia', category: 'Retail & Lifestyle' },
                { name: 'Nicobar', category: 'Home & Fashion' },
                { name: 'Miniso', category: 'Lifestyle Products' },
                { name: 'Storeex 24/7', category: 'Retail Chain' },
                { name: 'Kickers', category: 'Footwear Brand' },
                { name: 'Kothari', category: 'Business Group' }
              ].map((client, index) => (
                <div 
                  key={index} 
                  className="client-card-3d bg-white/10 backdrop-blur-md p-6 rounded-2xl border-2 border-white/20 hover:border-blue-400 transition-all transform hover:-translate-y-3 hover:scale-105 shadow-xl hover:shadow-2xl group"
                  style={{
                    perspective: '1000px',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className="text-center">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-blue-500/50 transition-all">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <h5 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{client.name}</h5>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{client.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Clients */}
          <div>
            <div className="text-center mb-8">
              <h4 className="text-2xl font-bold text-green-400 mb-2">Vendor Support Clients</h4>
              <p className="text-slate-300">Strategic audit support partnerships through leading consulting firms</p>
            </div>
            
            {/* Protiviti Division */}
            <div className="mb-12">
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 rounded-full shadow-lg">
                  <h5 className="text-xl font-bold text-white">Protiviti</h5>
                </div>
                <p className="text-slate-400 mt-2 text-sm">Internal Audit & Risk Management Consulting</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                  { name: 'Blinkit', category: 'Quick Commerce' },
                  { name: 'Zomato', category: 'Food Delivery' },
                  { name: 'Britannia', category: 'FMCG' },
                  { name: 'Pharma Implant', category: 'Healthcare' },
                  { name: 'Tata Group', category: 'Conglomerate' }
                ].map((client, index) => (
                  <div 
                    key={index} 
                    className="client-card-3d bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-md p-5 rounded-xl border-2 border-purple-400/30 hover:border-purple-400 transition-all transform hover:-translate-y-3 hover:scale-105 shadow-xl hover:shadow-2xl group"
                    style={{
                      perspective: '1000px',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <div className="text-center">
                      <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-purple-500/50 transition-all">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <h5 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{client.name}</h5>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{client.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adjectus Division */}
            <div>
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 rounded-full shadow-lg">
                  <h5 className="text-xl font-bold text-white">Adjectus</h5>
                </div>
                <p className="text-slate-400 mt-2 text-sm">Audit & Assurance Services</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
                {[
                  { name: 'Rare Rabbit', category: 'Fashion' },
                  { name: 'Campus', category: 'Footwear' },
                  { name: 'Firstcry', category: 'Baby & Kids' },
                  { name: 'Healthkart', category: 'Health & Wellness' },
                  { name: 'OYO', category: 'Hospitality' },
                  { name: 'VLCC', category: 'Wellness' },
                  { name: 'Eveready', category: 'Consumer Goods' },
                  { name: 'Snitch', category: 'Fashion' }
                ].map((client, index) => (
                  <div 
                    key={index} 
                    className="client-card-3d bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 backdrop-blur-md p-5 rounded-xl border-2 border-emerald-400/30 hover:border-emerald-400 transition-all transform hover:-translate-y-3 hover:scale-105 shadow-xl hover:shadow-2xl group"
                    style={{
                      perspective: '1000px',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <div className="text-center">
                      <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-emerald-500/50 transition-all">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <h5 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">{client.name}</h5>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{client.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
              <div className="text-4xl font-bold text-blue-400 mb-2">16+</div>
              <p className="text-slate-300">Trusted Client Relationships</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
              <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
              <p className="text-slate-300">Client Satisfaction Rate</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
              <div className="text-4xl font-bold text-blue-400 mb-2">Pan-India</div>
              <p className="text-slate-300">Service Coverage</p>
            </div>
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
                <div className="h-80 overflow-hidden bg-slate-100">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover object-top hover:scale-110 transition-transform duration-500"
                    style={{ objectPosition: 'center 20%' }}
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
                className="h-16 w-auto mb-4"
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