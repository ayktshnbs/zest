import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "KVKK Aydınlatma Metni · ZestHome",
  description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <LegalPage
      title="KVKK Aydınlatma Metni"
      updatedAt="2026-06-19"
      intro="6698 sayılı Kişisel Verilerin Korunması Kanunu ('KVKK') uyarınca, ZestHome olarak kişisel verilerinizi aşağıda açıklanan şekilde işlemekteyiz. Bu metin, KVKK md. 10 kapsamında veri sorumlusu sıfatımızla sizi bilgilendirmek için hazırlanmıştır."
      sections={[
        {
          title: "1. Veri Sorumlusu",
          body: "Veri Sorumlusu: ZestHome\nAdres: Küçükçekmece, İstanbul / Türkiye\nİletişim: info@zest-home.net · +90 532 280 92 06",
        },
        {
          title: "2. İşlenen Kişisel Veriler",
          body: "• Kimlik bilgileri: ad, soyad\n• İletişim bilgileri: e-posta, telefon, adres\n• Müşteri işlem bilgileri: sipariş, ödeme ve teslimat verileri\n• İşlem güvenliği: IP adresi, çerez verileri, oturum bilgileri",
        },
        {
          title: "3. İşleme Amaçları",
          body: "Kişisel verileriniz aşağıdaki amaçlarla işlenir:\n• Mal ve hizmet satış süreçlerinin yürütülmesi\n• Müşteri ilişkilerinin yönetimi ve iletişim faaliyetleri\n• Yasal yükümlülüklerin yerine getirilmesi (faturalama, vergi vb.)\n• Bilgi güvenliği süreçlerinin yürütülmesi\n• Açık rızanız bulunması halinde pazarlama faaliyetleri",
        },
        {
          title: "4. İşleme Hukuki Sebepleri",
          body: "Kişisel verileriniz, KVKK md. 5/2 hükmü gereğince bir sözleşmenin kurulması veya ifası, hukuki yükümlülüklerin yerine getirilmesi ve meşru menfaatlerimiz kapsamında işlenir. Pazarlama amacıyla işleme için ayrıca açık rızanız alınır.",
        },
        {
          title: "5. Verilerin Aktarılması",
          body: "Kişisel verileriniz, siparişinizi tamamlamak için gerekli olan kargo şirketleri, ödeme altyapısı sağlayıcıları (örn. Creem) ve e-posta gönderim servisleri (örn. Resend) ile paylaşılır. Yasal zorunluluk halinde yetkili kamu kurumlarıyla da paylaşılabilir. Yurt dışı aktarımlar yalnızca KVKK md. 9 koşullarına uygun olarak yapılır.",
        },
        {
          title: "6. KVKK Kapsamındaki Haklarınız",
          body: "KVKK md. 11 uyarınca:\n• Kişisel verilerinizin işlenip işlenmediğini öğrenme\n• İşlendiyse buna ilişkin bilgi talep etme\n• İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme\n• Yurt içi/yurt dışı aktarıldığı üçüncü kişileri bilme\n• Eksik veya yanlış işlenmişse düzeltilmesini isteme\n• KVKK'da öngörülen şartlarda silinmesini veya yok edilmesini isteme\n• Düzeltme, silme ve yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme\n• Otomatik sistemler ile analiz edilmesi sonucu aleyhinize bir sonuç ortaya çıkmasına itiraz etme\n• Hukuka aykırı işleme sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme",
        },
        {
          title: "7. Başvuru",
          body: "Yukarıdaki haklarınızı kullanmak için info@zest-home.net adresine talebinizi yazılı olarak iletebilirsiniz. Başvurunuz en geç 30 gün içinde sonuçlandırılır.",
        },
      ]}
    />
  );
}
