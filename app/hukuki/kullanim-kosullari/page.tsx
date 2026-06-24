import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Kullanım Koşulları · ZestHome",
  description: "ZestHome web sitesinin kullanım koşulları.",
};

export default function KullanimKosullariPage() {
  return (
    <LegalPage
      title="Kullanım Koşulları"
      updatedAt="2026-06-19"
      intro="Bu Kullanım Koşulları, ZestHome web sitesini (www.zesthome.net) kullanan ziyaretçiler ve müşteriler için geçerlidir. Siteyi kullanarak aşağıdaki şartları kabul etmiş sayılırsınız."
      sections={[
        {
          title: "1. Taraflar",
          body: "Bu sözleşme, ZestHome (Halkalı Merkez Mahallesi, Halkalı Caddesi, MNG BlueBoutique Residence, Küçükçekmece, İstanbul / Türkiye — bundan sonra 'ZestHome' veya 'Satıcı' olarak anılacaktır) ile siteyi kullanan kullanıcı/alıcı (bundan sonra 'Kullanıcı' veya 'Alıcı') arasındadır.",
        },
        {
          title: "2. Tanımlar",
          body: "Site: www.zesthome.net adresinde yayınlanan web sitesidir.\nİçerik: Sitede yer alan tüm metin, görsel, video, marka ve veriler.\nÜrün: ZestHome tarafından site üzerinden satışa sunulan her türlü mutfak ve ev gereci.",
        },
        {
          title: "3. Hesap Açma ve Güvenlik",
          body: "Kullanıcı, hesap açarken doğru ve güncel bilgi vermekle yükümlüdür. Hesap bilgilerinin gizliliği ve hesap üzerinden yapılan tüm işlemler Kullanıcı'nın sorumluluğundadır. Şüpheli bir kullanım fark ettiğinizde derhal info@zest-home.net adresinden bize bildiriniz.",
        },
        {
          title: "4. Sipariş, Fiyat ve Stok",
          body: "Sitede yer alan ürün fiyatlarına KDV dahildir. Stok durumu ve fiyatlar haber verilmeksizin değiştirilebilir. Sipariş onaylanmadan önce ekranınızda gösterilen tutar geçerlidir. Stoğu tükenen ürünlerde siparişiniz iptal edilebilir; bu durumda ödediğiniz tutar tarafınıza iade edilir.",
        },
        {
          title: "5. Fikri Mülkiyet",
          body: "Site içeriği ve ZestHome markası, logosu ile tasarımları telif hakkı ve marka hukukuyla korunmaktadır. İzinsiz olarak çoğaltılamaz, dağıtılamaz veya ticari amaçla kullanılamaz.",
        },
        {
          title: "6. Sorumluluk Sınırlandırması",
          body: "Site, 'olduğu gibi' sunulmaktadır. Kesinti, bakım veya teknik aksaklıklar nedeniyle oluşabilecek dolaylı zararlardan ZestHome sorumlu tutulamaz. Ürünlerin doğru kullanımı için ürün etiketinde ve kullanım kılavuzunda belirtilen talimatlara uyulması esastır.",
        },
        {
          title: "7. Değişiklikler",
          body: "ZestHome, bu Kullanım Koşulları'nı dilediği zaman güncelleyebilir. Güncel sürüm bu sayfada yayınlanır; siteyi kullanmaya devam etmeniz değişiklikleri kabul ettiğiniz anlamına gelir.",
        },
        {
          title: "8. Uygulanacak Hukuk ve Yetkili Mahkeme",
          body: "Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Doğabilecek uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Müdürlükleri yetkilidir.",
        },
      ]}
    />
  );
}
