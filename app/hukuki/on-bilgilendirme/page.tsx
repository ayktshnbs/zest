import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Ön Bilgilendirme Formu · ZestHome",
  description: "ZestHome ön bilgilendirme formu.",
};

export default function OnBilgilendirmePage() {
  return (
    <LegalPage
      title="Ön Bilgilendirme Formu"
      updatedAt="2026-06-19"
      intro="Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, siparişinizi onaylamadan önce sizi bilgilendirmek amacıyla hazırlanmıştır."
      sections={[
        {
          title: "1. Satıcı Bilgileri",
          body: "Ünvan: ZestHome\nAdres: Halkalı Merkez Mahallesi, Halkalı Caddesi, MNG BlueBoutique Residence, Küçükçekmece, İstanbul / Türkiye\nE-posta: info@zest-home.net\nTelefon: +90 532 280 92 06",
        },
        {
          title: "2. Ürün ve Hizmetin Temel Nitelikleri",
          body: "Ürünün adı, modeli, rengi ve adedi sipariş onay sayfasında Alıcı'ya açıkça gösterilir. Ürün görselleri ve açıklamaları ürünü en doğru şekilde yansıtmak üzere hazırlanmıştır.",
        },
        {
          title: "3. Fiyat ve Ödeme",
          body: "Sitede gösterilen fiyatlar Türk Lirası cinsinden olup KDV dahildir. Ödeme, kredi/banka kartı veya site üzerinde sunulan diğer ödeme yöntemleri ile alınır. Kargo ücreti, sepet toplamına göre ücretsiz veya sabit tarifeli olabilir; sipariş özetinde net olarak gösterilir.",
        },
        {
          title: "4. Teslimat",
          body: "Ürün, Alıcı'nın belirttiği adrese ZestHome'un anlaşmalı kargo şirketi aracılığıyla en geç 30 gün içinde teslim edilir. Normal teslimat süresi 1-3 iş günüdür.",
        },
        {
          title: "5. Cayma Hakkı",
          body: "Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma bildirimi info@zest-home.net adresine veya iade formu ile yapılır.",
        },
        {
          title: "6. Cayma Hakkının Kullanılamayacağı Haller",
          body: "Hijyen kuralları gereği ambalajı açılan kişisel bakım ürünleri, kişiselleştirilmiş ürünler ve çabuk bozulabilen ürünlerde cayma hakkı kullanılamaz.",
        },
        {
          title: "7. Şikayet ve İtirazlar",
          body: "Alıcı, tüketici şikayetlerini info@zest-home.net adresine iletebilir. Ayrıca Ticaret Bakanlığı'nca belirlenen parasal sınırlar dahilinde Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri'ne başvurabilir.",
        },
      ]}
    />
  );
}
