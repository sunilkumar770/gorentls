'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar, 
  Filter, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Activity,
  Zap,
  ArrowUpRight,
  ChevronRight,
  Info
} from 'lucide-react';

const REVENUE_DATA = [
  { name: 'Mon', value: 2400 },
  { name: 'Tue', value: 1398 },
  { name: 'Wed', value: 9800 },
  { name: 'Thu', value: 3908 },
  { name: 'Fri', value: 4800 },
  { name: 'Sat', value: 3800 },
  { name: 'Sun', value: 4300 },
];

const CATEGORY_DATA = [
  { name: 'Cameras', value: 45 },
  { name: 'Drones', value: 30 },
  { name: 'Audio', value: 15 },
  { name: 'Laptops', value: 10 },
];

const COLORS = ['#4F46E5', '#1E3A8A', '#A54100', '#777681'];

const STATS = [
  { label: 'Total Earnings', value: '₹48,250', change: '+12.5%', trending: 'up', icon: DollarSign, bg: 'bg-indigo-50', color: 'text-[#4F46E5]' },
  { label: 'Bookings', value: '34', change: '+5.2%', trending: 'up', icon: ShoppingBag, bg: 'bg-amber-50', color: 'text-amber-700' },
  { label: 'Conversion Rate', value: '3.4%', change: '-0.8%', trending: 'down', icon: Activity, bg: 'bg-rose-50', color: 'text-rose-600' },
  { label: 'Profile Views', value: '1,240', change: '+18.3%', trending: 'up', icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
];

const TOP_LISTINGS = [
  { id: 1, title: 'Sony A7 III Full-Frame', bookings: 12, revenue: '₹14,400', rating: 4.9, img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&q=80' },
  { id: 2, title: 'DJI Mini 3 Pro Drone', bookings: 8, revenue: '₹14,400', rating: 4.7, img: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=100&q=80' },
  { id: 3, title: 'Rode VideoMic Pro+', bookings: 5, revenue: '₹2,250', rating: 4.8, img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&q=80' },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState('Last 7 days');

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Analytics Overview</h1>
          <p className="text-muted mt-2">Detailed insights into your store&apos;s performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-card border-2 border-border text-muted rounded-2xl text-xs font-bold hover:bg-subtle transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <div className="bg-slate-900 p-1 rounded-2xl flex">
            {['Last 7 days', 'Last 30 days'].map((r) => (
              <button 
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  range === r ? 'bg-card text-text shadow-sm' : 'text-faint hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-card p-8 rounded-[2.5rem] shadow-sm shadow-slate-100/50 flex flex-col group hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                stat.trending === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {stat.trending === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {stat.change}
              </div>
            </div>
            <p className="text-sm font-bold text-faint uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-text">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card rounded-[3rem] p-10 shadow-sm shadow-slate-100/50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl font-bold text-text">Revenue Trends</h2>
              <p className="text-xs text-faint mt-1 uppercase tracking-widest font-bold">Daily Earnings Overview</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#4F46E5]">₹24,500</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Total this week</p>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.2)', padding: '15px'}} 
                  itemStyle={{color: '#4F46E5', fontWeight: 800, fontSize: '14px'}}
                  labelStyle={{color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '5px'}}
                />
                <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Chart */}
        <div className="bg-card rounded-[3rem] p-10 shadow-sm shadow-slate-100/50 flex flex-col">
          <h2 className="text-xl font-bold text-text mb-2">Category Split</h2>
          <p className="text-xs text-faint uppercase tracking-widest font-bold mb-8">Revenue by item type</p>
          
          <div className="h-64 w-full relative mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CATEGORY_DATA} innerRadius={70} outerRadius={100} paddingAngle={10} dataKey="value" cornerRadius={10}>
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-black text-text">₹48k</p>
              <p className="text-[10px] text-faint font-bold uppercase tracking-widest">Total</p>
            </div>
          </div>

          <div className="space-y-4">
            {CATEGORY_DATA.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx]}} />
                  <span className="text-sm font-bold text-muted">{item.name}</span>
                </div>
                <span className="text-sm font-black text-text">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Listings Table */}
      <div className="bg-card rounded-[3rem] p-10 shadow-sm shadow-slate-100/50">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-text">Top Performing Listings</h2>
          <Link href="/dashboard/listings" className="text-xs font-bold text-[#4F46E5] flex items-center gap-1 hover:underline">
            Manage All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-4 text-[10px] font-black text-faint uppercase tracking-widest">Listing</th>
                <th className="text-center py-4 text-[10px] font-black text-faint uppercase tracking-widest">Bookings</th>
                <th className="text-center py-4 text-[10px] font-black text-faint uppercase tracking-widest">Revenue</th>
                <th className="text-center py-4 text-[10px] font-black text-faint uppercase tracking-widest">Rating</th>
                <th className="text-right py-4 text-[10px] font-black text-faint uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {TOP_LISTINGS.map((item) => (
                <tr key={item.id} className="group hover:bg-subtle/50 transition-colors">
                  <td className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-subtle flex-shrink-0">
                        <img src={item.img} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-text">{item.title}</span>
                    </div>
                  </td>
                  <td className="text-center py-5 font-bold text-text">{item.bookings}</td>
                  <td className="text-center py-5 font-black text-text">{item.revenue}</td>
                  <td className="text-center py-5">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 border-none" />
                      <span className="text-sm font-bold text-text">{item.rating}</span>
                    </div>
                  </td>
                  <td className="text-right py-5">
                    <button className="p-2 bg-subtle text-faint rounded-xl hover:bg-indigo-50 hover:text-[#4F46E5] transition-all">
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-indigo-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-card/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 border border-indigo-400/30">
              <Zap className="w-7 h-7 text-indigo-300" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-4">Smart Insights</h2>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Based on your current performance and local market trends in Hyderabad, we suggest optimizing your listings.
            </p>
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-card/5 rounded-[2rem] border border-white/10 hover:bg-card/10 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold">High Demand Alert</h3>
              </div>
              <p className="text-xs text-indigo-100/70 leading-relaxed mb-4">
                Camera gear rentals in your area are up 45% for upcoming wedding season. Consider adjusting prices by 10%.
              </p>
              <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                Update Pricing <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-6 bg-card/5 rounded-[2rem] border border-white/10 hover:bg-card/10 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold">Optimize Listing</h3>
              </div>
              <p className="text-xs text-indigo-100/70 leading-relaxed mb-4">
                Your DJI Mini 3 Pro gets many views but lower bookings. Adding 2 more photos of the accessories might help.
              </p>
              <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                Edit Listing <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  )
}
