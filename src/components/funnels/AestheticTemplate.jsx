import React, { useRef } from 'react';
import { CheckCircle2, Star, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react';

// Mock GHL form for Studio preview — replaced with real embed on deploy
const MockGHLForm = ({ formId }) => (
    <div className="w-full bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center text-zinc-400">
        <p className="font-semibold text-sm text-zinc-500">GHL Form — {formId || 'No ID Set'}</p>
        <div className="mt-3 space-y-2">
            <div className="h-9 bg-zinc-100 rounded-lg w-full" />
            <div className="h-9 bg-zinc-100 rounded-lg w-full" />
            <div className="h-9 bg-zinc-100 rounded-lg w-full" />
        </div>
        <button className="mt-4 w-full py-3 bg-zinc-900 text-white font-bold rounded-lg text-sm">
            Submit →
        </button>
    </div>
);

const DEFAULT_CONFIG = {
    header: {
        logoText: 'CLINIC LOGO',
        ctaText: 'Book FREE Consultation',
    },
    hero: {
        headline: 'Reveal Your',
        headlineAccent: 'Natural Glow',
        bullets: [
            'Advanced HIFU, Body Sculpting, and Aquapure Facials',
            'Painless Laser Hair Removal and In-Depth Skin Scans',
            'Customized treatment plans tailored to your unique skin',
        ],
        offerTitle: 'Special Introductory Consultation Details',
        offerSubtitle: 'Limited Time Offer Only!',
        formBadge: 'Book Your Free Consultation',
        ghlFormId: 'YOUR_GHL_FORM_ID',
        image1: 'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?q=80&w=720&auto=format&fit=crop',
        image2: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=720&auto=format&fit=crop',
        image3: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=720&auto=format&fit=crop',
        badgeTitle: 'Premium Care',
        badgeText: 'Award winning specialists dedicated to your skin and body goals.',
    },
    about: {
        title: 'About The Clinic',
        paragraphs: [
            'We are a modern aesthetic clinic with award-winning specialists experienced in non-invasive skin and body treatments. Trusted by professionals and influencers, we combine cutting-edge technology with precision-driven techniques.',
            'Each treatment plan is meticulously tailored to your unique physiology. From Aquapure facials to advanced laser hair removal and body sculpting, every procedure focuses on enhancing your natural beauty.',
        ],
        image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?q=80&w=1080&auto=format&fit=crop',
        badge1: 'Industry Award Winner',
        badge2: '1,000+ Radiant Results',
    },
    patients: {
        title: 'Our Patients',
        subtitle: 'Join over 1,000+ patients that have transformed their confidence with us!',
        images: [
            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=600&auto=format&fit=crop',
        ],
    },
    actionPlan: {
        steps: [
            { title: 'Consultation', description: "We'll perform an in-depth Skin Scan and create a bespoke treatment plan, walking you through your expected results." },
            { title: 'Assessment', description: "We'll finalize your customized selection of treatments—whether HIFU, Body Sculpting, or Laser therapy—for your approval." },
            { title: 'Treatment', description: 'Relax in our luxury clinic suite as we deliver your premium aesthetic treatment with precision and care.' },
        ],
    },
    pricing: {
        title: 'Pricing Structure',
        subtitle: 'Bespoke Treatment Packages',
        package1: {
            name: 'Starter Package',
            bullets: ['Targeted Laser Hair Removal or Aquapure Facial', 'Comprehensive Skin Scan Included'],
            finance: '0% Finance For 12 Months',
            tag: 'Limited Time Only',
            price: 'from £3,000',
            oldPrice: 'Usually £3,500',
        },
        package2: {
            name: 'Premium Transformation',
            highlight: 'Most Popular',
            bullets: ['Full Body Sculpting & Advanced HIFU Session', 'Post-Treatment Care Kit Included'],
            finance: '0% Finance For 12 Months',
            tag: 'Limited Time Only',
            price: 'from £4,000',
            oldPrice: 'Usually £4,995',
        },
    },
    reviews: {
        items: [
            { name: 'John Smith', date: '2 months ago', text: 'Had the absolute best experience. My skin has never looked better and the team was so supportive!' },
            { name: 'Emma Jones', date: '4 months ago', text: 'After years of struggling with my skin, I finally tried their Aquapure facial and HIFU. The results are amazing.' },
            { name: 'Mark Davies', date: '5 months ago', text: 'Brilliant aesthetic team. Highly recommend anyone considering body sculpting to go in for the free consult.' },
            { name: 'Katie Wilson', date: '7 months ago', text: 'So happy with my laser hair removal. The skin scan technology showed me exactly what my skin needed.' },
        ],
    },
};

const AestheticTemplate = ({ config: rawConfig, isStudio = false }) => {
    const formRef = useRef(null);

    // Deep-merge config with defaults so partial AI updates never crash the page
    const config = {
        header: { ...DEFAULT_CONFIG.header, ...rawConfig?.header },
        hero: { ...DEFAULT_CONFIG.hero, ...rawConfig?.hero },
        about: { ...DEFAULT_CONFIG.about, ...rawConfig?.about },
        patients: { ...DEFAULT_CONFIG.patients, ...rawConfig?.patients },
        actionPlan: { ...DEFAULT_CONFIG.actionPlan, ...rawConfig?.actionPlan },
        pricing: {
            ...DEFAULT_CONFIG.pricing,
            ...rawConfig?.pricing,
            package1: { ...DEFAULT_CONFIG.pricing.package1, ...rawConfig?.pricing?.package1 },
            package2: { ...DEFAULT_CONFIG.pricing.package2, ...rawConfig?.pricing?.package2 },
        },
        reviews: { ...DEFAULT_CONFIG.reviews, ...rawConfig?.reviews },
    };

    const { header, hero, about, patients, actionPlan, pricing, reviews } = config;

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
            {/* Studio Indicator Banner */}
            {isStudio && (
                <div className="sticky top-0 z-[999] bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-bold text-center py-1.5 tracking-widest uppercase">
                    ✦ Studio Preview — Not Live
                </div>
            )}

            {/* 1. Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100">
                <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
                    <div className="text-2xl font-black tracking-tighter">{header.logoText}</div>
                    <button
                        onClick={scrollToForm}
                        className="hidden md:inline-flex px-6 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                        {header.ctaText}
                    </button>
                </div>
            </header>

            {/* 2. Hero */}
            <section className="bg-zinc-50 pt-16 pb-24 overflow-hidden">
                <div className="max-w-6xl mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="max-w-xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                            {hero.headline}{' '}
                            {hero.headlineAccent && <span className="text-zinc-500">{hero.headlineAccent}</span>}
                        </h1>

                        <ul className="space-y-4 mb-10 text-lg text-zinc-600 font-medium">
                            {(hero.bullets || []).map((bullet, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-zinc-900 flex-shrink-0" />
                                    <span>{bullet}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8 pt-4 border-t border-zinc-200">
                            <p className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-2">+ {hero.offerTitle}</p>
                            <p className="text-sm text-zinc-500 mb-6 font-medium">{hero.offerSubtitle}</p>
                        </div>

                        <div ref={formRef} className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl shadow-zinc-200/50 border border-zinc-100 relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                                {hero.formBadge}
                            </div>
                            <div className="mt-4">
                                <MockGHLForm formId={hero.ghlFormId} />
                            </div>
                        </div>
                    </div>

                    <div className="relative hidden md:grid grid-cols-2 gap-4 h-[600px]">
                        <div className="flex flex-col gap-4 mt-12">
                            <img src={hero.image1} alt="Clinical setting" className="rounded-2xl object-cover h-64 w-full shadow-lg" />
                            <img src={hero.image2} alt="Consultation" className="rounded-2xl object-cover h-72 w-full shadow-lg" />
                        </div>
                        <div className="flex flex-col gap-4">
                            <img src={hero.image3} alt="Patient" className="rounded-2xl object-cover h-80 w-full shadow-lg" />
                            <div className="bg-zinc-900 rounded-2xl p-6 flex flex-col justify-center text-white h-56 shadow-lg">
                                <h3 className="font-bold text-2xl leading-tight mb-2">{hero.badgeTitle}</h3>
                                <p className="text-zinc-400 text-sm">{hero.badgeText}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. About */}
            <section className="bg-zinc-900 text-white py-24">
                <div className="max-w-6xl mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-zinc-800 rounded-3xl transform -rotate-3 scale-105"></div>
                        <img src={about.image} alt="Clinic" className="relative rounded-3xl object-cover h-[500px] w-full shadow-2xl" />
                        <div className="absolute -bottom-6 -right-6 bg-white text-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-100 hidden sm:block">
                            <div className="flex items-center gap-3 mb-3">
                                <ShieldCheck className="w-5 h-5 text-zinc-500" />
                                <span className="font-bold text-sm">{about.badge1}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-zinc-500" />
                                <span className="font-bold text-sm">{about.badge2}</span>
                            </div>
                        </div>
                    </div>
                    <div className="max-w-lg">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">{about.title}</h2>
                        <div className="text-zinc-400 text-lg space-y-6 leading-relaxed mb-10">
                            {(about.paragraphs || []).map((p, i) => <p key={i}>{p}</p>)}
                        </div>
                        <button onClick={scrollToForm} className="px-8 py-4 bg-white text-zinc-900 font-bold rounded-xl hover:bg-zinc-100 transition-colors inline-flex items-center gap-2 group w-full md:w-auto justify-center">
                            {header.ctaText}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* 4. Patients */}
            <section className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-4 lg:px-8 text-center">
                    <h2 className="text-4xl font-extrabold text-zinc-900 mb-4">{patients.title}</h2>
                    <p className="text-xl text-zinc-600 mb-16 max-w-2xl mx-auto font-medium">{patients.subtitle}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {(patients.images || []).map((img, i) => (
                            <img key={i} src={img} alt={`Result ${i + 1}`} className="rounded-2xl object-cover aspect-square w-full bg-zinc-100 shadow-md" />
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Action Plan */}
            <section className="bg-zinc-900 text-white py-24">
                <div className="max-w-6xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Your Journey To Confidence</p>
                        <h2 className="text-4xl md:text-5xl font-extrabold">3 STEP ACTION PLAN</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {(actionPlan.steps || []).map((step, i) => (
                            <div key={i} className="bg-zinc-800 rounded-3xl p-8 text-center relative mt-6">
                                <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center font-bold text-xl absolute -top-6 left-1/2 -translate-x-1/2 border-4 border-zinc-900">{i + 1}</div>
                                <h3 className="text-xl font-bold mb-4 pt-4 border-b border-zinc-700 pb-4 uppercase tracking-wide">{step.title}</h3>
                                <p className="text-zinc-400 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Pricing */}
            <section className="py-24 bg-zinc-50">
                <div className="max-w-6xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 mb-4">{pricing.title}</h2>
                        <p className="text-xl text-zinc-600 font-medium">{pricing.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {pricing.package1 && (
                            <div className="bg-white rounded-3xl border-2 border-zinc-200 overflow-hidden flex flex-col hover:border-zinc-300 transition-colors">
                                <div className="p-8 text-center flex-grow">
                                    <h3 className="text-2xl font-bold text-zinc-900 mb-6">{pricing.package1.name}</h3>
                                    <ul className="space-y-4 text-zinc-600 font-medium mb-8">
                                        {(pricing.package1.bullets || []).map((b, i) => (
                                            <li key={i} className="flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5 text-zinc-400 flex-shrink-0" /> {b}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-zinc-100 py-4 text-center border-y border-zinc-200">
                                    <p className="font-bold text-zinc-900 uppercase tracking-widest text-sm">{pricing.package1.finance}</p>
                                </div>
                                <div className="p-8 text-center bg-white">
                                    <p className="text-sm font-bold uppercase tracking-wide text-zinc-500 mb-2">{pricing.package1.tag}</p>
                                    <p className="text-5xl font-black text-zinc-900 mb-2">{pricing.package1.price}</p>
                                    <p className="text-zinc-400 line-through">{pricing.package1.oldPrice}</p>
                                </div>
                            </div>
                        )}
                        {pricing.package2 && (
                            <div className="bg-white rounded-3xl border-2 border-zinc-900 shadow-xl overflow-hidden flex flex-col relative transform md:-translate-y-4">
                                <div className="absolute top-0 left-0 right-0 bg-zinc-900 text-white text-center py-2 text-sm font-bold tracking-widest uppercase">{pricing.package2.highlight}</div>
                                <div className="p-8 text-center flex-grow mt-6">
                                    <h3 className="text-2xl font-bold text-zinc-900 mb-6">{pricing.package2.name}</h3>
                                    <ul className="space-y-4 text-zinc-600 font-medium mb-8">
                                        {(pricing.package2.bullets || []).map((b, i) => (
                                            <li key={i} className="flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5 text-zinc-900 flex-shrink-0" /> {b}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-zinc-900 py-4 text-center border-y border-zinc-900 text-white">
                                    <p className="font-bold uppercase tracking-widest text-sm">{pricing.package2.finance}</p>
                                </div>
                                <div className="p-8 text-center bg-zinc-50">
                                    <p className="text-sm font-bold uppercase tracking-wide text-zinc-500 mb-2">{pricing.package2.tag}</p>
                                    <p className="text-5xl font-black text-zinc-900 mb-2">{pricing.package2.price}</p>
                                    <p className="text-zinc-400 line-through">{pricing.package2.oldPrice}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-16 text-center">
                        <button onClick={scrollToForm} className="px-10 py-5 bg-zinc-900 text-white font-bold text-lg rounded-xl hover:bg-zinc-800 transition-colors shadow-xl w-full sm:w-auto">
                            {header.ctaText}
                        </button>
                    </div>
                </div>
            </section>

            {/* 7. Reviews */}
            <section className="py-24 bg-white border-t border-zinc-100">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 mb-6">What Our Patients Say</h2>
                        <div className="inline-flex items-center gap-4 bg-zinc-50 px-6 py-4 rounded-2xl border border-zinc-200">
                            <span className="font-black text-xl tracking-tighter">Google</span>
                            <span className="font-bold">Reviews</span>
                            <div className="w-px h-8 bg-zinc-300"></div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-2xl">4.9</span>
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="fill-current w-5 h-5" />)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(reviews.items || []).map((review, i) => (
                            <div key={i} className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex flex-shrink-0 items-center justify-center font-bold text-zinc-500">{review.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-bold text-sm text-zinc-900">{review.name}</p>
                                        <p className="text-xs text-zinc-500">{review.date}</p>
                                    </div>
                                </div>
                                <div className="flex text-yellow-400">{[...Array(5)].map((_, j) => <Star key={j} className="fill-current w-4 h-4" />)}</div>
                                <p className="text-zinc-600 text-sm leading-relaxed flex-grow">"{review.text}"</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-16 text-center">
                        <button onClick={scrollToForm} className="px-10 py-5 bg-zinc-900 text-white font-bold text-lg rounded-xl hover:bg-zinc-800 transition-colors shadow-xl w-full sm:w-auto">
                            {header.ctaText}
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-8 border-t border-zinc-100 text-center">
                <p className="text-zinc-500 text-sm font-medium">© {new Date().getFullYear()} {header.logoText}. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default AestheticTemplate;
