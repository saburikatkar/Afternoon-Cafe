import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  useGetMenu, useGetGallery, useGetReviews, useSubmitReview, useAdminLogin,
  useGetAdminSession, useAdminLogout, useGetAdminReviews, useModerateReview,
  useDeleteReview, useGetAdminMenu, useCreateMenuCategory, useUpdateMenuCategory,
  useDeleteMenuCategory, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  useGetAdminGallery, useCreateGalleryImage, useUpdateGalleryImage, useDeleteGalleryImage,
  getGetMenuQueryKey, getGetGalleryQueryKey, getGetReviewsQueryKey, getGetAdminReviewsQueryKey,
  getGetAdminMenuQueryKey, getGetAdminGalleryQueryKey, getGetAdminSessionQueryKey,
} from '@workspace/api-client-react';
import type { GalleryImage, MenuCategory, MenuItem, Review } from '@workspace/api-client-react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Clock3, Coffee, MapPin, Menu as MenuIcon, MessageCircle, Plus, Star, X } from 'lucide-react';

const queryClient = new QueryClient();
const address = 'Playshire Sports Club, behind Jio bp pulse EV charging station, Wagholi, Pune 412207';
const mapHref = 'https://www.google.com/maps/dir/?api=1&destination=Playshire+Sports+Club%2C+behind+Jio+bp+pulse+EV+charging+station%2C+Wagholi%2C+Pune+412207';
const mapEmbed = 'https://www.google.com/maps?q=Playshire+Sports+Club+Wagholi+Pune+412207&output=embed';
const phone = '080808 84171';
const whatsapp = 'https://wa.me/918080884171';
const sampleReviews: Review[] = [
  { id: -1, name: 'Sample guest', rating: 5, message: 'Sample setup content — replace with an approved guest review.', status: 'approved', created_at: '' },
  { id: -2, name: 'Sample guest', rating: 5, message: 'Sample setup content — this example is not a customer testimonial.', status: 'approved', created_at: '' },
  { id: -3, name: 'Sample guest', rating: 4, message: 'Sample setup content — remove when real approved reviews are available.', status: 'approved', created_at: '' },
];

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={CafeHome} /><Route path="/admin" component={AdminPage} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}
function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function CafeHome() {
  const menu = useGetMenu(); const gallery = useGetGallery(); const reviews = useGetReviews();
  const submitReview = useSubmitReview(); const [lightbox, setLightbox] = useState<number | null>(null);
  const [reviewSent, setReviewSent] = useState(false); const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    document.title = 'Afternoons Cafe | Wagholi, Pune';
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow');
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  const imageList = gallery.data ?? [];
  const selectedImage = lightbox === null ? null : imageList[lightbox];
  const changePhoto = (dir: number) => setLightbox((n) => n === null || !imageList.length ? null : (n + dir + imageList.length) % imageList.length);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const formElement = e.currentTarget; const form = new FormData(formElement);
    submitReview.mutate({ data: { name: String(form.get('name')), rating: Number(form.get('rating')), message: String(form.get('message')), website: String(form.get('website') || '') } }, {
      onSuccess: () => { setReviewSent(true); formElement.reset(); queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() }); },
    });
  };
  return <main className="paper min-h-[100dvh] overflow-hidden">
    <header className="relative z-30 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 md:px-12 md:py-7">
      <a href="#top" className="flex items-center gap-3 text-foreground no-underline" aria-label="Afternoons Cafe home">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-primary/40 text-primary"><Coffee size={19} strokeWidth={1.5} /></span>
        <span><span className="serif block text-[20px] leading-none">Afternoons</span><span className="mt-1 block text-[9px] uppercase tracking-[.23em] text-muted-foreground">Cafe · Wagholi</span></span>
      </a>
      <nav className="hidden items-center gap-9 text-[12px] tracking-wide md:flex">
        <a href="#story" className="text-foreground/80 no-underline hover:text-primary">Our little place</a><a href="#menu" className="text-foreground/80 no-underline hover:text-primary">Menu</a><a href="#photos" className="text-foreground/80 no-underline hover:text-primary">Photos</a><a href="#visit" className="text-foreground/80 no-underline hover:text-primary">Find us</a>
      </nav>
      <a href={whatsapp} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full bg-primary px-5 py-3 text-[11px] font-semibold tracking-wide text-primary-foreground no-underline transition-opacity hover:opacity-85 md:flex"><MessageCircle size={15} /> Say hello</a>
      <button type="button" className="grid h-10 w-10 place-items-center border-0 bg-transparent text-foreground md:hidden" aria-label="Toggle navigation" onClick={() => setMobileOpen(!mobileOpen)}><MenuIcon size={22} /></button>
      {mobileOpen && <nav className="absolute left-0 right-0 top-full flex flex-col gap-4 border-y border-border bg-background px-6 py-5 text-sm shadow-md md:hidden">{[['Our little place','#story'],['Menu','#menu'],['Photos','#photos'],['Find us','#visit']].map(([label,href])=><a key={href} href={href} onClick={()=>setMobileOpen(false)} className="text-foreground no-underline">{label}</a>)}</nav>}
    </header>
    <section id="top" className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-16 pt-8 md:grid-cols-[.91fr_1.09fr] md:gap-14 md:px-12 md:pb-28 md:pt-10">
      <div className="reveal relative z-10 max-w-[510px]">
        <p className="mb-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.21em] text-primary"><span className="h-px w-8 bg-primary" /> Your neighbourhood pause</p>
        <h1 className="serif max-w-[560px] text-[clamp(3.45rem,8vw,7.35rem)] leading-[.94] tracking-[-.055em] text-foreground">A little<br/><em className="font-medium text-primary">more</em> afternoon.</h1>
        <p className="mt-7 max-w-[390px] text-[15px] leading-7 text-muted-foreground">Good coffee, something lovely to eat, and a seat waiting for you at Playshire.</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <a href="#menu" className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-[12px] font-semibold text-primary-foreground no-underline transition-transform hover:-translate-y-0.5">Come see the menu <ArrowRight size={15}/></a>
          <a href="#visit" className="px-2 py-3 text-[12px] font-semibold text-foreground no-underline">How to find us <ArrowDown size={13} className="ml-1 inline"/></a>
        </div>
        <div className="mt-10 flex items-center gap-3 text-[12px]"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-[#79916b] opacity-40"></span><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#79916b]"></span></span><span className="font-semibold">Open today from 2 pm</span><span className="text-muted-foreground">· Every day</span></div>
        <div className="mt-7 flex items-center gap-2 text-[11px] text-muted-foreground"><span className="flex text-[#a66046]"><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/></span><strong className="text-foreground">4.7</strong><span>from 372 Google reviews</span></div>
      </div>
      <div className="relative min-h-[360px] md:min-h-[570px]">
        <div className="photo-placeholder absolute right-[7%] top-[3%] h-[78%] w-[78%] rotate-[1.7deg] rounded-[47%_47%_3px_3px] border-[8px] border-[#e9dcc7] shadow-md md:right-[10%]" role="img" aria-label="Cafe interior photo placeholder, replaceable by owner"/>
        <div className="absolute bottom-[4%] left-[1%] w-[45%] rotate-[-3deg] border-[7px] border-[#f1e7d6] shadow-md"><div className="photo-placeholder aspect-[1.1] w-full" role="img" aria-label="Coffee photo placeholder, replaceable by owner"/></div>
        <div className="absolute bottom-[7%] right-[1%] max-w-[170px] rotate-[4deg] bg-[#dce0d0] px-5 py-4 text-center text-[11px] leading-5 text-[#43503c] shadow-sm"><span className="serif text-[18px] italic">Stay a while.</span><br/>You’re right where you need to be.</div>
        <div className="absolute left-[10%] top-[7%] -rotate-12 text-[10px] uppercase tracking-[.2em] text-primary">Since your next break</div>
      </div>
    </section>
    <div className="mx-auto max-w-[1180px] px-5 md:px-12"><div className="hand-rule"></div></div>
    <section id="story" data-reveal className="scroll-reveal mx-auto grid max-w-[1180px] gap-8 px-5 py-20 md:grid-cols-[.54fr_1fr] md:gap-20 md:px-12 md:py-28">
      <div><p className="eyebrow">A neighbourhood kind of place</p><h2 className="serif mt-4 text-4xl leading-tight md:text-[3.55rem]">Made for the<br/><em>in-between hours.</em></h2></div>
      <div className="max-w-[610px] pt-2"><p className="text-[16px] leading-8 text-foreground/85">Tucked inside Playshire Sports Club, Afternoons is the easy little stop between plans. Come in after a game, bring a friend, or take the quiet table for yourself.</p><p className="mt-5 text-[14px] leading-7 text-muted-foreground">We open our doors at 2 pm every day, right behind the Jio bp pulse charging station in Wagholi. Find a familiar cup, a friendly hello, and a moment that doesn’t need rushing.</p><div className="mt-8 flex items-center gap-3 text-[12px] text-muted-foreground"><span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[#54644c]"><Clock3 size={17}/></span><span><strong className="text-foreground">Daily, from 2 pm</strong><br/>A good time to drop by.</span></div></div>
    </section>
    <section id="menu" data-reveal className="scroll-reveal bg-[#e9ddca]">
      <div className="mx-auto max-w-[1180px] px-5 py-20 md:px-12 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow">Something for the table</p><h2 className="serif mt-3 text-4xl md:text-[3.5rem]">A few good things.</h2></div><p className="max-w-[270px] text-[12px] leading-6 text-muted-foreground">A little something for your cup, your plate, and the space between.</p></div>
        {menu.isLoading ? <div className="mt-12 grid gap-7 md:grid-cols-2">{[1,2].map(i=><div key={i} className="h-48 animate-pulse rounded-sm bg-background/50"/> )}</div> : menu.isError ? <div className="mt-10 flex items-center justify-between border-t border-border py-6 text-sm"><span>We couldn’t bring the menu in just now.</span><button onClick={()=>menu.refetch()} className="text-primary underline">Try again</button></div> : menu.data?.length ? <div className="mt-12 grid gap-x-20 gap-y-10 md:grid-cols-2">{menu.data.slice().sort((a,b)=>a.sort_order-b.sort_order).map((cat:MenuCategory)=><div key={cat.id}><div className="mb-5 flex items-baseline justify-between border-b border-[#bba991] pb-3"><h3 className="serif text-[27px]">{cat.name}</h3><span className="text-[9px] uppercase tracking-[.18em] text-muted-foreground">On the menu</span></div><div className="space-y-5">{cat.items.filter((item:MenuItem)=>item.is_available).sort((a,b)=>a.sort_order-b.sort_order).map(item=><div key={item.id} className="flex justify-between gap-4"><div><p className="text-[14px] font-semibold">{item.name}</p>{item.description&&<p className="mt-1 max-w-[330px] text-[12px] leading-5 text-muted-foreground">{item.description}</p>}</div><span className="shrink-0 text-[13px] font-semibold">₹{item.price}</span></div>)}</div></div>)}</div> : <div className="mt-12 border-y border-[#bba991] py-8 text-sm text-muted-foreground">Our menu is being refreshed. Ask us what’s good today.</div>}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-[#bba991] pt-6"><span className="text-[12px] text-muted-foreground">Around ₹200–400 per person</span><span className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[#7b926d]"/> Menu changes with the mood</span></div>
        <div className="mt-5 text-[12px] text-muted-foreground">Looking for the full menu? <span className="font-semibold text-primary">Full menu link coming soon</span></div><p className="mt-3 text-[10px] italic text-muted-foreground">Sample setup menu — please confirm these items before sharing the page with guests.</p>
      </div>
    </section>
    <section id="photos" data-reveal className="scroll-reveal mx-auto max-w-[1180px] px-5 py-20 md:px-12 md:py-28">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Little moments here</p><h2 className="serif mt-3 text-4xl md:text-[3.5rem]">A peek around.</h2></div><span className="max-w-[230px] text-[12px] leading-5 text-muted-foreground">The corners, cups and company that make this place ours.</span></div>
       {gallery.isLoading ? <div className="columns-2 gap-4 md:columns-3">{[1,2,3].map(n=><div key={n} className="mb-4 h-48 animate-pulse bg-muted"/>)}</div> : gallery.isError ? <div className="border-y border-border py-8 text-sm">Photos are taking a little longer. <button onClick={()=>gallery.refetch()} className="text-primary underline">Try again</button></div> : imageList.length ? <div className="columns-2 gap-4 md:columns-3">{imageList.slice().sort((a,b)=>a.sort_order-b.sort_order).map((image:GalleryImage,index)=><button key={image.id} onClick={()=>setLightbox(index)} className={`group mb-4 block w-full overflow-hidden border-[6px] border-[#eee2d0] bg-muted p-0 text-left shadow-sm ${index%3===1?'rotate-[1deg]':'rotate-[-.5deg]'}`}><img src={image.url} alt={image.caption||'Afternoons Cafe gallery photo'} width={800} height={600} loading="lazy" decoding="async" className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.025]"/>{image.caption&&<span className="block px-3 py-2 text-left text-[11px] text-muted-foreground">{image.caption}</span>}</button>)}</div> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{[0,1,2].map((n)=><div key={n} className={`photo-placeholder ${n===1?'aspect-[.8]':'aspect-[1.18]'} ${n===2?'hidden md:block':''}`} role="img" aria-label={`Replaceable cafe photo placeholder ${n+1}`}/>)}</div>}
    </section>
    <section data-reveal className="scroll-reveal bg-[#52604a] text-[#f5eedf]">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-20 md:grid-cols-[.8fr_1.2fr] md:px-12 md:py-24">
        <div><p className="text-[10px] uppercase tracking-[.22em] text-[#c8d0b9]">Kind words, shared</p><h2 className="serif mt-4 text-4xl md:text-[3.2rem]">From the<br/><em>neighbourhood.</em></h2><div className="mt-5 flex items-center gap-2 text-[12px]"><span className="flex text-[#e8bc7d]"><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/></span> 4.7 on Google · 372 reviews</div><p className="mt-3 text-[11px] text-[#d4dbc9]">Reviews below marked “sample setup” are examples only, not customer testimonials.</p></div>
        <div>{reviews.isLoading?<div className="h-36 animate-pulse bg-white/10"/>:reviews.isError?<div className="py-6 text-sm">Reviews couldn’t load. <button onClick={()=>reviews.refetch()} className="underline">Try again</button></div>:<div className="grid gap-4 md:grid-cols-2">{(reviews.data?.length?reviews.data:sampleReviews).slice(0,4).map((r:Review)=><article key={r.id} className="border border-white/20 p-5"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold">{r.name}</span><span className="flex text-[#e8bc7d]">{Array.from({length:r.rating}).map((_,i)=><Star key={i} size={11} fill="currentColor"/>)}</span></div><p className="serif mt-4 text-[17px] leading-6">{r.message}</p><p className="mt-3 text-[9px] uppercase tracking-[.15em] text-[#d4dbc9]">{r.id<0?'Sample setup content · not a testimonial':new Date(r.created_at).toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</p></article>)}</div>}
          <form onSubmit={submit} className="mt-7 grid gap-3 border-t border-white/25 pt-6 sm:grid-cols-2"><p className="serif col-span-full text-[21px]">Leave us a little note</p><label className="text-[10px] uppercase tracking-wider">Your name<input required name="name" maxLength={80} placeholder="Name" className="mt-2 block w-full border border-white/30 bg-white/10 px-3 py-3 text-sm normal-case tracking-normal text-white placeholder:text-white/60 outline-none focus:border-white"/></label><label className="text-[10px] uppercase tracking-wider">Rating<select name="rating" className="mt-2 block w-full border border-white/30 bg-[#52604a] px-3 py-3 text-sm text-white outline-none"><option value="5">5 — Loved it</option><option value="4">4 — Really good</option><option value="3">3 — Good</option><option value="2">2 — Could be better</option><option value="1">1 — Not for me</option></select></label><label className="col-span-full text-[10px] uppercase tracking-wider">Your note<textarea required name="message" minLength={8} maxLength={1200} rows={3} placeholder="Tell us how your visit felt" className="mt-2 block w-full resize-y border border-white/30 bg-white/10 px-3 py-3 text-sm normal-case tracking-normal text-white placeholder:text-white/60 outline-none focus:border-white"/></label><input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true"/><div className="col-span-full flex flex-wrap items-center justify-between gap-3"><span className="text-[11px] text-[#d4dbc9]">{reviewSent?'Thanks — your note is waiting for approval.':submitReview.isError?'Could not send just now. Please try again.':'Notes are reviewed before they appear here.'}</span><button disabled={submitReview.isPending} className="rounded-full bg-[#f0e7d6] px-5 py-3 text-[11px] font-semibold text-[#293325] disabled:opacity-50">{submitReview.isPending?'Sending…':'Send for review'}</button></div></form>
        </div>
      </div>
    </section>
    <section id="visit" data-reveal className="scroll-reveal mx-auto grid max-w-[1180px] gap-9 px-5 py-20 md:grid-cols-[.8fr_1.2fr] md:px-12 md:py-28">
       <div><p className="eyebrow">Come by this afternoon</p><h2 className="serif mt-4 text-4xl leading-tight md:text-[3.25rem]">Easy to find.<br/><em>Hard to leave.</em></h2><div className="mt-8 flex gap-3"><span className="mt-1 text-primary"><MapPin size={18}/></span><p className="max-w-[330px] text-[14px] leading-6">{address}</p></div><div className="mt-6 flex gap-3"><span className="mt-1 text-primary"><Clock3 size={18}/></span><p className="text-[14px] leading-6"><strong>Open daily from 2 pm</strong><br/><span className="text-muted-foreground">Drop in whenever the afternoon calls.</span></p></div><div className="mt-8 flex flex-wrap gap-3"><a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[11px] font-semibold text-primary-foreground no-underline">Get directions <ArrowUpRight size={14}/></a><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-[11px] font-semibold text-foreground no-underline"><MessageCircle size={14}/> WhatsApp {phone}</a><a href="tel:+918080884171" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-[11px] font-semibold text-foreground no-underline">Call the cafe</a></div></div>
       <div className="relative min-h-[300px] overflow-hidden border border-[#d5c6ac] bg-[#dce0d0] md:min-h-[400px]"><iframe title="Map to Afternoons Cafe in Wagholi" src={mapEmbed} width="800" height="500" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" /><div className="pointer-events-none absolute bottom-4 left-4 bg-[#f6efdf]/95 px-5 py-4 shadow-sm"><p className="serif text-[21px]">Afternoons Cafe</p><p className="mt-1 text-[10px] text-muted-foreground">Inside Playshire Sports Club, Wagholi</p></div></div>
    </section>
    <footer className="border-t border-border bg-[#e9ddca]"><div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-12"><div><a href="#top" className="serif text-[27px] text-foreground no-underline">Afternoons Cafe</a><p className="mt-2 text-[11px] text-muted-foreground">A small neighbourhood pause in Wagholi, Pune.</p></div><div className="flex flex-wrap gap-x-7 gap-y-3 text-[11px]"><a href={whatsapp} target="_blank" rel="noreferrer" className="text-foreground no-underline">WhatsApp {phone}</a><a href={mapHref} target="_blank" rel="noreferrer" className="text-foreground no-underline">Get directions</a><span className="text-muted-foreground">Instagram link coming soon</span></div><p className="text-[10px] text-muted-foreground">Made with care, for the hours after lunch.</p></div></footer>
    <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Chat with Afternoons Cafe on WhatsApp" className="fixed bottom-20 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#52604a] text-white shadow-md md:bottom-6"><MessageCircle size={22}/></a>
    <a href={mapHref} target="_blank" rel="noreferrer" className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-2 bg-primary py-4 text-[12px] font-semibold text-primary-foreground no-underline md:hidden"><MapPin size={15}/> Directions to Afternoons <ArrowUpRight size={14}/></a>
    {selectedImage&&<div role="dialog" aria-modal="true" aria-label="Gallery photo" onClick={()=>setLightbox(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-[#241a14]/90 p-5"><button onClick={()=>setLightbox(null)} aria-label="Close photo" className="absolute right-5 top-5 border-0 bg-transparent text-white"><X size={26}/></button><button onClick={(e)=>{e.stopPropagation();changePhoto(-1)}} aria-label="Previous photo" className="absolute left-4 border-0 bg-transparent text-white"><ChevronLeft size={32}/></button><figure onClick={e=>e.stopPropagation()} className="max-h-[85vh] max-w-[90vw]"><img src={selectedImage.url} alt={selectedImage.caption||'Afternoons Cafe gallery photo'} loading="eager" className="max-h-[76vh] max-w-full object-contain"/><figcaption className="pt-3 text-center text-sm text-white">{selectedImage.caption}</figcaption></figure><button onClick={(e)=>{e.stopPropagation();changePhoto(1)}} aria-label="Next photo" className="absolute right-4 border-0 bg-transparent text-white"><ChevronRight size={32}/></button></div>}
  </main>;
}

function AdminPage() {
  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    const previousRobots = robots?.getAttribute('content');
    const previousTitle = document.title;
    document.title = 'Owner sign-in | Afternoons Cafe';
    robots?.setAttribute('content', 'noindex, nofollow');
    return () => {
      document.title = previousTitle;
      if (previousRobots) robots?.setAttribute('content', previousRobots);
    };
  }, []);
  const client = useQueryClient(); const session=useGetAdminSession();
  const login=useAdminLogin(); const logout=useAdminLogout(); const [username,setUsername]=useState(''); const [password,setPassword]=useState('');
  const [tab,setTab]=useState<'reviews'|'menu'|'gallery'>('reviews'); const [notice,setNotice]=useState('');
  const authenticated=!!session.data?.authenticated;
  const refreshReviews=()=>{client.invalidateQueries({queryKey:getGetAdminReviewsQueryKey({status:'pending'})});client.invalidateQueries({queryKey:getGetReviewsQueryKey()});};
  const doLogin=(e:React.FormEvent)=>{e.preventDefault();login.mutate({data:{username,password}},{onSuccess:()=>{setPassword('');client.invalidateQueries({queryKey:getGetAdminSessionQueryKey()})}});};
  if (!authenticated) return <main className="paper min-h-[100dvh] px-5 py-8"><a href="/" className="serif text-xl text-foreground no-underline">Afternoons Cafe</a><div className="mx-auto mt-16 max-w-[470px] border border-border bg-card p-7 shadow-sm md:mt-24 md:p-10"><p className="eyebrow">Owner access</p><h1 className="serif mt-3 text-4xl">Good afternoon.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in to look after reviews, menu items and cafe photos.</p><form onSubmit={doLogin} className="mt-8 space-y-4"><label className="block text-xs font-semibold">Username<input value={username} onChange={e=>setUsername(e.target.value)} required autoComplete="username" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"/></label><label className="block text-xs font-semibold">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"/></label><button disabled={login.isPending} className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{login.isPending?'Signing in…':'Sign in securely'}</button></form>{login.isError&&<p role="alert" className="mt-4 text-sm text-destructive">{(login.error as Error).message||'Sign in failed. Check your credentials.'}</p>}<p className="mt-5 border-t border-border pt-4 text-[11px] leading-5 text-muted-foreground">Owner credentials must be configured on the server. If they are unset, sign-in is unavailable; contact the site administrator. There is no bypass login.</p>{session.isError&&<button onClick={()=>session.refetch()} className="mt-4 text-xs text-primary underline">Check owner session again</button>}</div></main>;
  return <main className="paper min-h-[100dvh]">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-5 md:px-10"><div><a href="/" className="serif text-2xl text-foreground no-underline">Afternoons</a><p className="mt-1 text-[9px] uppercase tracking-[.2em] text-muted-foreground">Owner’s desk</p></div><button onClick={()=>logout.mutate(undefined,{onSuccess:()=>client.invalidateQueries({queryKey:getGetAdminSessionQueryKey()})})} disabled={logout.isPending} className="rounded-full border border-border px-4 py-2 text-xs">{logout.isPending?'Signing out…':'Sign out'}</button></header>
    <div className="mx-auto max-w-[1100px] px-5 py-9 md:px-10 md:py-14"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">The behind-the-scenes bit</p><h1 className="serif mt-2 text-4xl md:text-5xl">Afternoons, looked after.</h1></div><p className="text-xs text-muted-foreground">Signed in as {session.data?.username||'owner'}</p></div>
      <div className="mt-9 flex gap-2 border-b border-border">{(['reviews','menu','gallery'] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`border-b-2 px-4 py-3 text-xs capitalize ${tab===t?'border-primary font-semibold text-primary':'border-transparent text-muted-foreground'}`}>{t}</button>)}</div>
      {notice&&<p role="status" className="mt-4 text-sm text-[#52604a]">{notice}</p>}
      {tab==='reviews'&&<ReviewDesk onChange={refreshReviews} onNotice={setNotice}/>}
      {tab==='menu'&&<MenuDesk onNotice={setNotice}/>}
      {tab==='gallery'&&<GalleryDesk onNotice={setNotice}/>}
    </div>
  </main>;
}
function ReviewDesk({onChange,onNotice}:{onChange:()=>void;onNotice:(s:string)=>void}) {
  const q=useGetAdminReviews({status:'pending'}); const moderate=useModerateReview(); const remove=useDeleteReview();
  const act=(id:number,status:'approved'|'rejected')=>moderate.mutate({id,data:{status}},{onSuccess:()=>{onNotice(status==='approved'?'Review approved and added to the public page.':'Review rejected.');onChange();}});
  return <section className="pt-7"><h2 className="serif text-2xl">Reviews waiting for a look</h2>{q.isLoading?<div className="mt-5 h-32 animate-pulse bg-muted"/>:q.isError?<p className="py-8 text-sm">Couldn’t load the review queue. <button onClick={()=>q.refetch()} className="text-primary underline">Try again</button></p>:q.data?.length?<div className="mt-5 space-y-3">{q.data.map(r=><article key={r.id} className="border border-border bg-card p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm font-semibold">{r.name} <span className="ml-2 text-[#a66046]">{'★'.repeat(r.rating)}</span></p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p></div><span className="h-fit rounded-full bg-[#e7d8c5] px-3 py-1 text-[10px] capitalize">{r.status}</span></div><p className="mt-4 max-w-3xl text-sm leading-6">{r.message}</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={()=>act(r.id,'approved')} disabled={moderate.isPending} className="inline-flex items-center gap-2 rounded-full bg-[#52604a] px-4 py-2 text-xs text-white"><Check size={14}/> Approve</button><button onClick={()=>act(r.id,'rejected')} disabled={moderate.isPending} className="rounded-full border border-border px-4 py-2 text-xs">Reject</button><button onClick={()=>{if(confirm('Delete this review permanently?'))remove.mutate({id:r.id},{onSuccess:()=>{onNotice('Review deleted.');onChange()}})}} className="rounded-full border border-border px-4 py-2 text-xs text-destructive">Delete</button></div></article>)}</div>:<div className="mt-6 border border-dashed border-border px-5 py-10 text-sm text-muted-foreground">Nothing waiting. New visitor notes will appear here for approval.</div>}</section>;
}
function MenuDesk({onNotice}:{onNotice:(s:string)=>void}) {
  const client=useQueryClient();const q=useGetAdminMenu();const createCat=useCreateMenuCategory();const updateCat=useUpdateMenuCategory();const deleteCat=useDeleteMenuCategory();const createItem=useCreateMenuItem();const updateItem=useUpdateMenuItem();const deleteItem=useDeleteMenuItem();
  const refresh=()=>{client.invalidateQueries({queryKey:getGetAdminMenuQueryKey()});client.invalidateQueries({queryKey:getGetMenuQueryKey()});};
  const addCategory=()=>{const name=prompt('Category name');if(name?.trim())createCat.mutate({data:{name:name.trim(),sort_order:q.data?.length??0}},{onSuccess:()=>{onNotice('Category added.');refresh()}})};
  const editCategory=(cat:MenuCategory)=>{const name=prompt('Category name',cat.name);if(name?.trim())updateCat.mutate({id:cat.id,data:{name:name.trim(),sort_order:cat.sort_order}},{onSuccess:()=>{onNotice('Category updated.');refresh()}})};
  const addItem=(cat:MenuCategory)=>{const name=prompt('Item name');if(!name?.trim())return;const price=Number(prompt('Price in rupees','0'));if(!Number.isFinite(price)||price<0)return;const description=prompt('Short description','')||'';createItem.mutate({data:{category_id:cat.id,name:name.trim(),description,price,is_available:true,sort_order:cat.items.length}},{onSuccess:()=>{onNotice('Menu item added.');refresh()}})};
  const editItem=(item:MenuItem)=>{const name=prompt('Item name',item.name);if(!name?.trim())return;const price=Number(prompt('Price in rupees',String(item.price)));if(!Number.isFinite(price)||price<0)return;const description=prompt('Short description',item.description)||'';updateItem.mutate({id:item.id,data:{name:name.trim(),price,description}},{onSuccess:()=>{onNotice('Menu item updated.');refresh()}})};
  return <section className="pt-7"><div className="flex items-center justify-between gap-4"><div><h2 className="serif text-2xl">Menu board</h2><p className="mt-1 text-xs text-muted-foreground">Changes appear on the visitor page after saving.</p></div><button onClick={addCategory} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><Plus size={14}/> Add category</button></div>
    {q.isLoading?<div className="mt-5 h-32 animate-pulse bg-muted"/>:q.isError?<p className="py-8 text-sm">Menu unavailable. <button onClick={()=>q.refetch()} className="text-primary underline">Try again</button></p>:q.data?.length?<div className="mt-6 space-y-5">{q.data.map(cat=><article key={cat.id} className="border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3"><h3 className="serif text-xl">{cat.name}</h3><div className="flex gap-2"><button onClick={()=>editCategory(cat)} className="text-xs text-primary underline">Rename</button><button onClick={()=>addItem(cat)} className="inline-flex items-center gap-1 text-xs text-primary"><Plus size={13}/> Add item</button><button onClick={()=>{if(confirm(`Delete “${cat.name}” and its items?`))deleteCat.mutate({id:cat.id},{onSuccess:()=>{onNotice('Category deleted.');refresh()}})}} className="text-xs text-destructive underline">Delete category</button></div></div>
      {cat.items.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 py-3 last:border-0"><div><p className="text-sm font-semibold">{item.name} <span className="ml-2 font-normal">₹{item.price}</span></p><p className="mt-1 text-xs text-muted-foreground">{item.description||'No description'} · {item.is_available?'Available':'Hidden'}</p></div><div className="flex gap-3 text-xs"><button onClick={()=>editItem(item)} className="text-primary underline">Edit</button><button onClick={()=>updateItem.mutate({id:item.id,data:{is_available:!item.is_available}},{onSuccess:()=>{onNotice(item.is_available?'Item hidden.':'Item available.');refresh()}})} className="text-foreground underline">{item.is_available?'Hide':'Show'}</button><button onClick={()=>{if(confirm(`Delete “${item.name}”?`))deleteItem.mutate({id:item.id},{onSuccess:()=>{onNotice('Menu item deleted.');refresh()}})}} className="text-destructive underline">Delete</button></div></div>)}</article>)}</div>:<p className="mt-6 border border-dashed border-border p-8 text-sm text-muted-foreground">No categories yet. Add the first one to start the menu.</p>}
  </section>;
}
function GalleryDesk({onNotice}:{onNotice:(s:string)=>void}) {
  const client=useQueryClient();const q=useGetAdminGallery();const create=useCreateGalleryImage();const update=useUpdateGalleryImage();const remove=useDeleteGalleryImage();const refresh=()=>{client.invalidateQueries({queryKey:getGetAdminGalleryQueryKey()});client.invalidateQueries({queryKey:getGetGalleryQueryKey()});};
  const add=()=>{const url=prompt('Image URL (uploaded photo address)');if(!url?.trim())return;const caption=prompt('Caption','')||'';create.mutate({data:{url:url.trim(),caption,sort_order:q.data?.length??0}},{onSuccess:()=>{onNotice('Photo added to the gallery.');refresh()}})};
  const edit=(image:GalleryImage)=>{const url=prompt('Image URL',image.url);if(!url?.trim())return;const caption=prompt('Caption',image.caption)||'';update.mutate({id:image.id,data:{url:url.trim(),caption,sort_order:image.sort_order}},{onSuccess:()=>{onNotice('Photo updated.');refresh()}})};
  return <section className="pt-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="serif text-2xl">Photo wall</h2><p className="mt-1 text-xs text-muted-foreground">Add image URLs and captions. Photo upload storage can be connected here.</p></div><button onClick={add} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><Plus size={14}/> Add photo</button></div>
    {q.isLoading?<div className="mt-5 h-32 animate-pulse bg-muted"/>:q.isError?<p className="py-8 text-sm">Gallery unavailable. <button onClick={()=>q.refetch()} className="text-primary underline">Try again</button></p>:q.data?.length?<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{q.data.map(image=><article key={image.id} className="border border-border bg-card p-3"><img src={image.url} alt={image.caption} className="aspect-[1.25] w-full object-cover"/><p className="mt-3 text-sm font-semibold">{image.caption||'Untitled photo'}</p><div className="mt-3 flex gap-4 text-xs"><button onClick={()=>edit(image)} className="text-primary underline">Edit</button><button onClick={()=>{if(confirm('Remove this photo from the gallery?'))remove.mutate({id:image.id},{onSuccess:()=>{onNotice('Photo removed.');refresh()}})}} className="text-destructive underline">Delete</button></div></article>)}</div>:<div className="mt-6 border border-dashed border-border p-8 text-sm text-muted-foreground">No gallery photos yet. Add a photo URL when you have one ready.</div>}
  </section>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
