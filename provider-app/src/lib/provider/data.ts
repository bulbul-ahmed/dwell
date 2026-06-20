export function imgUrl(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;
}

export type ListingStatus = 'Active' | 'Paused' | 'Rented';

export interface Listing {
  id: number;
  title: string;
  where: string;
  type: string;
  price: string;
  status: ListingStatus;
  featured: boolean;
  views: number;
  leads: number;
  saves: number;
  chats: number;
  visits: number;
  img: string;
}

export const LISTINGS: Listing[] = [
  { id: 1, title: 'Sunlit 2-Bed Apartment, Block B', where: 'Block B, Aftab Nagar', type: 'Rent', price: '৳38,000/mo', status: 'Active', featured: true,  views: 1284, leads: 31, saves: 96, chats: 18, visits: 7, img: '1502672260266-1c1ef2d93688' },
  { id: 2, title: 'Garden-Facing 2-Bed, Block H',    where: 'Block H, Aftab Nagar', type: 'Rent', price: '৳42,000/mo', status: 'Active', featured: false, views: 1640, leads: 38, saves: 88, chats: 21, visits: 9, img: '1493809842364-78817add7ffb' },
  { id: 3, title: 'Student Hostel Seat near Campus', where: 'Block G, Aftab Nagar', type: 'Student', price: '৳6,500/mo', status: 'Active', featured: false, views: 980,  leads: 22, saves: 53, chats: 15, visits: 6, img: '1555854877-bab0e564b8d5' },
  { id: 4, title: 'AC Studio Sublet, 4-Month Term',  where: 'Block C, Aftab Nagar', type: 'Sublet', price: '৳18,000/mo', status: 'Paused', featured: false, views: 410,  leads: 9,  saves: 22, chats: 6,  visits: 2, img: '1522708323590-d24dbb6b0267' },
  { id: 5, title: 'Bright 2-Bed, Banasree Edge',     where: 'Banasree, Dhaka',      type: 'Rent', price: '৳34,000/mo', status: 'Rented', featured: false, views: 1120, leads: 27, saves: 61, chats: 14, visits: 8, img: '1484154218962-a197022b5858' },
];

export type LeadStatus = 'New' | 'Replied';
export type LeadKind  = 'Visit request' | 'Chat';

export interface Lead {
  id: number;
  name: string;
  initial: string;
  avBg: string;
  kind: LeadKind;
  message: string;
  listing: string;
  time: string;
  status: LeadStatus;
}

export const LEADS: Lead[] = [
  { id: 1, name: 'Tasnia Rahman',   initial: 'T', avBg: '#6B4E8A', kind: 'Visit request', message: 'Hi, is the Block B flat available this weekend for a visit?',     listing: 'Sunlit 2-Bed, Block B',       time: '12m ago',   status: 'New'     },
  { id: 2, name: 'Imran Chowdhury', initial: 'I', avBg: '#B4602B', kind: 'Chat',          message: 'Is the parking covered and is there generator backup for the ACs?', listing: 'Garden-Facing 2-Bed, Block H', time: '40m ago',   status: 'New'     },
  { id: 3, name: 'Farzana Akter',   initial: 'F', avBg: '#2A5C8A', kind: 'Visit request', message: 'Can I see the hostel seat on Sunday afternoon?',                    listing: 'Student Hostel Seat',          time: '2h ago',    status: 'New'     },
  { id: 4, name: 'Sabbir Ahmed',    initial: 'S', avBg: '#2E7D55', kind: 'Chat',          message: 'What is the advance and service charge for the sublet?',            listing: 'AC Studio Sublet',             time: 'Yesterday', status: 'Replied' },
  { id: 5, name: 'Nusrat Jahan',    initial: 'N', avBg: '#9A7B1F', kind: 'Chat',          message: 'Thanks for the quick reply — I will confirm by tomorrow.',          listing: 'Bright 2-Bed, Banasree',      time: 'Yesterday', status: 'Replied' },
];

export type VisitStatus = 'Requested' | 'Confirmed' | 'Suggested' | 'Completed' | 'Declined';

export interface Visit {
  id: number;
  seeker: string;
  initial: string;
  avBg: string;
  listing: string;
  mon: string;
  day: string;
  time: string;
  base: VisitStatus;
}

export const VISITS: Visit[] = [
  { id: 1, seeker: 'Farzana Akter',   initial: 'F', avBg: '#2A5C8A', listing: 'Student Hostel Seat, Block G',    mon: 'Jun', day: '21', time: 'Sun, Jun 21 · 4:30 PM', base: 'Requested'  },
  { id: 2, seeker: 'Sabbir Ahmed',    initial: 'S', avBg: '#2E7D55', listing: 'AC Studio Sublet, Block C',       mon: 'Jun', day: '22', time: 'Mon, Jun 22 · 5:00 PM', base: 'Requested'  },
  { id: 3, seeker: 'Tasnia Rahman',   initial: 'T', avBg: '#6B4E8A', listing: 'Sunlit 2-Bed, Block B',           mon: 'Jun', day: '20', time: 'Sat, Jun 20 · 11:00 AM', base: 'Confirmed'  },
  { id: 4, seeker: 'Imran Chowdhury', initial: 'I', avBg: '#B4602B', listing: 'Garden-Facing 2-Bed, Block H',   mon: 'Jun', day: '20', time: 'Sat, Jun 20 · 3:00 PM',  base: 'Confirmed'  },
  { id: 5, seeker: 'Nusrat Jahan',    initial: 'N', avBg: '#9A7B1F', listing: 'Bright 2-Bed, Banasree',         mon: 'Jun', day: '14', time: 'Sat, Jun 14 · 2:00 PM',  base: 'Completed'  },
];

export const SUGGEST_SLOTS = [
  { day: 'Fri, Jun 19', time: '5:00 PM' },
  { day: 'Sat, Jun 20', time: '11:00 AM' },
  { day: 'Sun, Jun 21', time: '4:30 PM' },
];

export interface Review {
  id: number;
  by: string;
  initial: string;
  avBg: string;
  when: string;
  context: string;
  stars: string;
  text: string;
  replied: boolean;
  reply?: string;
}

export const REVIEWS: Review[] = [
  { id: 1, by: 'Tasnia Rahman',   initial: 'T', avBg: '#6B4E8A', when: '3 days ago',  context: 'Visited Block B flat', stars: '★★★★★', text: 'Very responsive and the flat matched the photos exactly. Showed up on time and answered every question patiently. Highly recommend.',                               replied: true,  reply: 'Thank you Tasnia! It was a pleasure showing you the flat. Do reach out anytime.' },
  { id: 2, by: 'Imran Chowdhury', initial: 'I', avBg: '#B4602B', when: '1 week ago',  context: 'Rented Block H',       stars: '★★★★☆', text: 'Smooth process overall. Advance terms were clear and the handover was quick. Service charge could have been explained a little earlier.',                         replied: false },
  { id: 3, by: 'Farzana Akter',   initial: 'F', avBg: '#2A5C8A', when: '2 weeks ago', context: 'Chatted about sublet', stars: '★★★★★', text: 'Genuine listing and honest about the condition. Helped arrange a flexible visit time. Would recommend to others looking in Aftab Nagar.',                  replied: false },
  { id: 4, by: 'Nusrat Jahan',    initial: 'N', avBg: '#9A7B1F', when: '3 weeks ago', context: 'Visited Banasree',     stars: '★★★★★', text: 'Professional and trustworthy. The verified badge is well-earned — everything was exactly as described.',                                                       replied: true,  reply: 'We appreciate the kind words, Nusrat. Wishing you a happy move!' },
];

export const RATING_BARS = [
  { star: 5, count: 32, w: '90%' },
  { star: 4, count: 7,  w: '20%' },
  { star: 3, count: 1,  w: '6%'  },
  { star: 2, count: 1,  w: '6%'  },
  { star: 1, count: 0,  w: '2%'  },
];

export const BOOST_PLANS = [
  { key: '3d',   name: 'Boost · 3 days',     sub: 'Top of category for 3 days',      price: '৳600',   tag: '',        duration: '3 days'  },
  { key: '7d',   name: 'Boost · 7 days',     sub: 'Top of category + search',        price: '৳1,200', tag: 'Popular', duration: '7 days'  },
  { key: '30d',  name: 'Boost · 30 days',    sub: 'Best value for slow markets',     price: '৳3,500', tag: '',        duration: '30 days' },
  { key: 'feat', name: 'Featured slot',       sub: 'Home page banner · 7 days',      price: '৳2,000', tag: '',        duration: '7 days'  },
];

export const PAY_METHODS = [
  { key: 'bkash',  label: 'bKash',  logo: 'bK', logoBg: '#E2136E' },
  { key: 'nagad',  label: 'Nagad',  logo: 'N',  logoBg: '#EE7716' },
  { key: 'rocket', label: 'Rocket', logo: 'R',  logoBg: '#8A2BE2' },
  { key: 'card',   label: 'Card',   logo: '💳', logoBg: '#1E3A5C' },
];

export const PERF_VIEWS  = [60, 75, 55, 90, 110, 130, 95, 120, 140, 115, 150, 170, 135, 160];
export const PERF_LEADS  = [3,  5,  2,  6,  8,   7,   4,  9,  11,  6,   10,  13,  8,   12 ];

export const AN_KPIS = [
  { label: 'Total views · 30d',  value: '5.6k', delta: '▲ 14%'  },
  { label: 'Leads · 30d',        value: '182',  delta: '▲ 11%'  },
  { label: 'Visit conversion',   value: '8.4%', delta: '▲ 1.2pt'},
  { label: 'Avg. response',      value: '15m',  delta: '▼ 4m'   },
];

export const SRC_LEGEND = [
  { label: 'Search',          value: '96', color: '#1E3A5C' },
  { label: 'Boosted slots',   value: '54', color: '#C9A24B' },
  { label: 'Direct / saved',  value: '32', color: '#2E7D55' },
];

export const TEAM = [
  { initial: 'SR', name: 'Salma Rahman', avBg: '#2C557F', email: 'salma@rahima.bd',  role: 'Owner', roleFg: '#9A7B1F', roleBg: '#F6EFD9' },
  { initial: 'HK', name: 'Hasan Kabir',  avBg: '#2E7D55', email: 'hasan@rahima.bd',  role: 'Agent', roleFg: '#2A5C8A', roleBg: '#E6EFF7' },
  { initial: 'MA', name: 'Mitu Akter',   avBg: '#6B4E8A', email: 'mitu@rahima.bd',   role: 'Agent', roleFg: '#2A5C8A', roleBg: '#E6EFF7' },
];

export const NOTIF_PREFS = [
  { key: 'leads',   label: 'New lead alerts',      sub: 'SMS + push when a seeker enquires',      def: true  },
  { key: 'visits',  label: 'Visit reminders',       sub: 'Reminders 1 hour before each visit',    def: true  },
  { key: 'reviews', label: 'Review notifications',  sub: 'When a seeker leaves a review',         def: false },
];
