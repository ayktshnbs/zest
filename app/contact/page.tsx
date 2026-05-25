"use client";

import { Mail, Phone, MapPin, Send, Instagram, Twitter, Facebook, Sparkles, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Header */}
        <div className="mb-20 text-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 mb-6 inline-flex bg-primary/5 px-4 py-2 rounded-full mx-auto"
          >
            <Sparkles size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Bize Ulaşın</span>
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-display text-6xl md:text-8xl font-black text-foreground mb-8 tracking-tighter leading-tight"
          >
            Sizi Dinlemeye <br/>
            <span className="text-primary italic">Hazırız.</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-body text-xl text-foreground/50 max-w-2xl mx-auto font-medium"
          >
            Her türlü soru, öneri ve iş birliği teklifleriniz için buradayız. Ekibimiz en kısa sürede size geri dönüş yapacaktır.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Contact Info */}
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 space-y-8"
          >
            <div className="bg-white dark:bg-neutral-900 p-10 rounded-[3rem] border border-border shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              
              <h3 className="font-display text-2xl font-black mb-10 tracking-tighter">İletişim Kanalları</h3>
              
              <div className="space-y-10">
                {[
                  { icon: <Mail size={24} />, label: "E-posta", value: "hello@zeststudio.com", color: "bg-primary/10 text-primary" },
                  { icon: <Phone size={24} />, label: "Telefon", value: "+90 (212) 555 00 00", color: "bg-secondary/10 text-secondary-foreground" },
                  { icon: <MapPin size={24} />, label: "Adres", value: "Mutfak Sokak, No: 34, Beşiktaş, İstanbul", color: "bg-foreground/5 text-foreground/60" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-6 group cursor-pointer">
                    <div className={`p-4 ${item.color} rounded-2xl transition-transform group-hover:scale-110 duration-500`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">{item.label}</p>
                      <p className="font-bold text-foreground leading-relaxed">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 pt-10 border-t border-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-6">Sosyal Medya</p>
                <div className="flex gap-4">
                  {[Instagram, Twitter, Facebook].map((Icon, i) => (
                    <a key={i} href="#" className="p-4 bg-accent rounded-2xl hover:bg-primary hover:text-white transition-all duration-500 shadow-sm">
                      <Icon size={20} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-neutral-950 text-white p-10 rounded-[3rem] shadow-premium flex flex-col justify-between aspect-square">
              <MessageCircle size={48} className="text-secondary" />
              <div>
                <h4 className="font-display text-2xl font-black tracking-tighter mb-4">Canlı Destek</h4>
                <p className="text-neutral-400 font-medium mb-8">Hafta içi 09:00 - 18:00 saatleri arasında yanınızdayız.</p>
                <button className="btn-secondary w-full py-4 text-xs tracking-widest uppercase">Yardım Al</button>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-8"
          >
            <div className="bg-white dark:bg-neutral-900 p-10 md:p-16 rounded-[4rem] border border-border shadow-premium">
              <form className="space-y-10">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-4">Adınız</label>
                    <input 
                      type="text" 
                      placeholder="Ahmet Yılmaz"
                      className="w-full px-8 py-5 rounded-[2rem] bg-accent/50 border border-transparent focus:border-primary/20 outline-none font-medium transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-4">E-posta</label>
                    <input 
                      type="email" 
                      placeholder="ahmet@email.com"
                      className="w-full px-8 py-5 rounded-[2rem] bg-accent/50 border border-transparent focus:border-primary/20 outline-none font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-4">Konu</label>
                  <input 
                    type="text" 
                    placeholder="Nasıl yardımcı olabiliriz?"
                    className="w-full px-8 py-5 rounded-[2rem] bg-accent/50 border border-transparent focus:border-primary/20 outline-none font-medium transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-4">Mesajınız</label>
                  <textarea 
                    rows={6}
                    placeholder="Mesajınızı buraya yazın..."
                    className="w-full px-8 py-6 rounded-[2.5rem] bg-accent/50 border border-transparent focus:border-primary/20 outline-none font-medium transition-all resize-none"
                  ></textarea>
                </div>

                <button className="w-full md:w-auto btn-primary py-6 px-16 text-lg tracking-[0.2em] group uppercase">
                  Mesaj Gönder
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
