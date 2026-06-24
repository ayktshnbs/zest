import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Çerez Politikası · ZestHome",
  description: "ZestHome'un çerez kullanım politikası.",
};

export default function CerezPage() {
  return (
    <LegalPage
      title="Çerez Politikası"
      updatedAt="2026-06-19"
      intro="ZestHome web sitesi, deneyiminizi iyileştirmek ve siteyi düzgün çalıştırmak için çerezler ve benzer teknolojiler kullanır. Bu politika, hangi çerezleri neden kullandığımızı açıklar."
      sections={[
        {
          title: "1. Çerez Nedir?",
          body: "Çerez (cookie), siteye ziyaretiniz sırasında tarayıcınız tarafından cihazınıza kaydedilen küçük metin dosyasıdır. Çerezler genellikle siteyi tanımak ve oturumunuzu sürdürmek için kullanılır.",
        },
        {
          title: "2. Kullandığımız Çerez Türleri",
          body: "Zorunlu çerezler — sitenin temel işlevleri için gereklidir. Örneğin oturum çerezi (access_token), sepet içeriği ve CSRF güvenlik çerezi (csrf, csrf_sid).\n\nİşlevsel çerezler — tema seçimi (açık/koyu), tercih edilen dil gibi ayarları hatırlamak için kullanılır.\n\nAnalitik çerezler — ziyaretçi davranışını anonim olarak ölçmek için kullanılır. Kullanıyorsak hangi servisi kullandığımız aşağıda belirtilir.",
        },
        {
          title: "3. Üçüncü Taraf Çerezleri",
          body: "Aşağıdaki üçüncü taraf hizmetlerin çerezleri kullanılmaktadır:\n• Google (Sign-In ile giriş — accounts.google.com)\n• Cloudinary (ürün görsellerinin sunumu — res.cloudinary.com)\n• Ödeme altyapı sağlayıcımız (ödeme işlemleri sırasında)",
        },
        {
          title: "4. Çerezleri Yönetme",
          body: "Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz. Ancak zorunlu çerezleri devre dışı bırakırsanız siteye giriş yapamayabilir, sepet işlevini kullanamayabilir veya bazı sayfaları görüntüleyemeyebilirsiniz.\n\nÖnemli tarayıcılarda çerez yönetimi:\n• Chrome: Ayarlar → Gizlilik ve güvenlik → Çerezler\n• Safari: Tercihler → Gizlilik\n• Firefox: Seçenekler → Gizlilik ve Güvenlik\n• Edge: Ayarlar → Tanımlama Bilgileri",
        },
        {
          title: "5. Politikanın Güncellenmesi",
          body: "Bu Çerez Politikası gerektiğinde güncellenir. Güncel sürüm her zaman bu sayfada yayınlanır.",
        },
        {
          title: "6. İletişim",
          body: "Çerez kullanımı hakkında sorularınız için info@zest-home.net adresine yazabilirsiniz.",
        },
      ]}
    />
  );
}
