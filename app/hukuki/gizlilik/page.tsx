import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Gizlilik Politikası · ZestHome",
  description: "ZestHome gizlilik politikası.",
};

export default function GizlilikPage() {
  return (
    <LegalPage
      title="Gizlilik Politikası"
      updatedAt="2026-06-19"
      intro="ZestHome olarak ziyaretçilerimizin ve müşterilerimizin gizliliğine değer veriyoruz. Bu politika, kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar."
      sections={[
        {
          title: "1. Topladığımız Veriler",
          body: "Hesap bilgileri: ad, soyad, e-posta, telefon, şifre (hash'lenmiş).\nSipariş bilgileri: teslimat ve fatura adresi, sipariş geçmişi.\nTeknik veriler: IP adresi, tarayıcı türü, ziyaret edilen sayfalar, çerez verileri.",
        },
        {
          title: "2. Verileri Nasıl Kullanıyoruz",
          body: "• Siparişlerinizi işlemek ve teslimatı düzenlemek\n• Hesap güvenliğinizi sağlamak\n• Yasal yükümlülükleri yerine getirmek (fatura, vergi vb.)\n• İsteğe bağlı pazarlama bildirimleri (yalnızca onay verdiyseniz)\n• Sitenin teknik performansını iyileştirmek",
        },
        {
          title: "3. Verilerin Paylaşımı",
          body: "Kişisel verileriniz, sadece siparişinizi tamamlamak için gerekli olan hizmet sağlayıcılarla (kargo şirketleri, ödeme altyapısı sağlayıcıları) ve yasal zorunluluk halinde yetkili kamu kurumlarıyla paylaşılır. Üçüncü taraflara pazarlama amacıyla satılmaz.",
        },
        {
          title: "4. Veri Güvenliği",
          body: "Verileriniz, SSL şifreleme ve güncel güvenlik standartları kullanılarak korunur. Şifreler hash'lenerek saklanır ve düz metin olarak hiçbir yerde tutulmaz.",
        },
        {
          title: "5. Veri Saklama Süresi",
          body: "Hesap verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap kapatma talebinizden sonra, yasal saklama süreleri (örn. faturalama için 10 yıl) saklı kalmak üzere verileriniz silinir veya anonimleştirilir.",
        },
        {
          title: "6. Haklarınız",
          body: "KVKK kapsamında verilerinize erişme, düzeltme, silme ve işlenmesine itiraz etme hakkına sahipsiniz. Talepleriniz için info@zest-home.net adresine yazabilirsiniz.",
        },
        {
          title: "7. Çerezler",
          body: "Sitede çerezler kullanılmaktadır. Ayrıntılı bilgi için Çerez Politikamızı inceleyiniz.",
        },
        {
          title: "8. Politikanın Güncellenmesi",
          body: "Bu politika zaman zaman güncellenebilir. Güncel sürüm her zaman bu sayfada yayınlanır.",
        },
      ]}
    />
  );
}
