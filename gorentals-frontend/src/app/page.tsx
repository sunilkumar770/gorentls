import { Button } from '@/components/ui/Button';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { Search, Camera, Wrench, Tent, Music, MoreHorizontal, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      {/* Hero Section: The Curated Gallery North Star */}
      <section className="relative pt-32 pb-40 overflow-hidden bg-[#fff8f6]">
        {/* Soft Tonal Depth Blurs */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] bg-[#fda77a]/20 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[400px] h-[400px] bg-[#ffdbca]/30 rounded-full mix-blend-multiply filter blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ffeae0] text-[#9d4300] text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-ping" />
            Live Marketplace
          </div>
          
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-[#251913] mb-8 leading-[0.9] max-w-4xl">
            Rent the <span className="italic font-serif font-light text-[#9d4300]">Extraordinary</span>, <br/>
            Every Single Day.
          </h1>
          
          <p className="text-xl md:text-2xl text-[#584237] max-w-2xl mx-auto mb-12 leading-relaxed font-medium tracking-tight">
            Elevate your projects with professional-grade artifacts. <br className="hidden md:block"/> Access the city's finest gear, curated for the modern creator.
          </p>
          
          <div className="w-full max-w-4xl px-4">
            <div className="bg-white/40 backdrop-blur-2xl p-2 rounded-[2rem] shadow-ambient ring-1 ring-white/50 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#f97316] h-5 w-5 transition-transform group-focus-within:scale-110" />
                <input 
                  type="text" 
                  placeholder="What artifact are you seeking?" 
                  className="w-full pl-14 pr-6 py-5 bg-white rounded-[1.5rem] outline-none text-[#251913] font-display font-bold text-lg placeholder-[#8c7164]/50 focus:ring-2 focus:ring-[#f97316] transition-all"
                />
              </div>
              <Link href="/search" className="w-full sm:w-auto">
                <Button size="lg" className="gradient-signature w-full h-full text-white shadow-ambient rounded-[1.5rem] px-12 py-5 font-display font-black text-lg transition-transform hover:-translate-y-1 active:scale-95">
                  Begin Search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories: The Collection Grid */}
      <section className="bg-white py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col mb-16 text-center">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#8c7164] mb-4">The Collections</h2>
            <div className="h-px w-24 bg-[#f97316] mx-auto opacity-20" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[
              { icon: Camera, label: "Imaging", color: "text-[#9d4300]", bg: "bg-[#fff8f6]" },
              { icon: Wrench, label: "Heavy Duty", color: "text-[#9d4300]", bg: "bg-[#fff8f6]" },
              { icon: Tent, label: "Expedition", color: "text-[#9d4300]", bg: "bg-[#fff8f6]" },
              { icon: Music, label: "Acoustics", color: "text-[#9d4300]", bg: "bg-[#fff8f6]" },
              { icon: MoreHorizontal, label: "Archive", color: "text-[#9d4300]", bg: "bg-[#fff8f6]" }
            ].map((category, idx) => (
              <div key={idx} className={`flex flex-col items-center justify-center p-10 ${category.bg} rounded-[2.5rem] cursor-pointer hover:bg-white transition-all duration-500 shadow-ambient hover:shadow-[0_24px_48px_rgba(37,25,19,0.1)] group relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#f97316]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-white shadow-sm ring-1 ring-[#f97316]/10 ${category.color} group-hover:bg-[#f97316] group-hover:text-white transition-all duration-500`}>
                  <category.icon className="w-8 h-8 stroke-[2]" />
                </div>
                <span className="font-display font-black text-[#251913] text-lg tracking-tight group-hover:text-[#f97316] transition-colors">{category.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured: The Editorial Gallery */}
      <section className="bg-[#fff8f6] py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-[#251913] leading-[0.9] mb-6">
                Fresh From <br/><span className="text-[#9d4300]">The Archive</span>
              </h2>
              <p className="text-[#8c7164] text-xl font-medium tracking-tight">Hand-picked artifacts ready for your next masterpiece.</p>
            </div>
            <Link href="/search" className="inline-flex items-center gap-3 text-lg font-display font-black text-[#251913] hover:text-[#f97316] transition-all group pb-2 border-b-2 border-[#251913]/10">
              View Collection <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          
          <ListingGrid filters={{ sort: 'rating' }} />
        </div>
      </section>

      {/* Trust: The Professional Standard */}
      <section className="py-32 bg-white px-4">
        <div className="max-w-7xl mx-auto bg-[#251913] rounded-[3rem] p-12 md:p-24 relative overflow-hidden">
          {/* Decorative Background for Contrast */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f97316]/10 rounded-full blur-[120px] -mr-64 -mt-64" />
          
          <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-white leading-[0.9] mb-8">
                The Trust <br/><span className="text-[#f97316]">Standard.</span>
              </h2>
              <p className="text-white/60 text-xl font-medium mb-12 max-w-md">Every rental is secured by professional-grade protection systems.</p>
              
              <div className="space-y-8">
                {[
                  { title: "Verification", desc: "Every owner is personally vetted by our security team." },
                  { title: "Protection", desc: "Built-in coverage up to $5,000 for total peace of mind." },
                  { title: "Escrow", desc: "Payments held securely until the rental is successfully finished." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center shrink-0 text-white font-black">{i+1}</div>
                    <div>
                      <h4 className="text-white font-display font-black text-lg mb-1">{item.title}</h4>
                      <p className="text-white/40 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative aspect-square lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl skew-y-3 lg:-rotate-6">
              <Image 
                 src="https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?q=80&w=2670&auto=format&fit=crop" 
                 alt="Professional Gear" 
                 fill 
                 className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#251913] via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <p className="text-white font-medium italic">"The quality of equipment on GoRentals is unparalleled. It's my go-to for every major production."</p>
                <p className="text-[#f97316] font-black mt-4 uppercase tracking-widest text-[10px]">Marcus Thorne — Director</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
