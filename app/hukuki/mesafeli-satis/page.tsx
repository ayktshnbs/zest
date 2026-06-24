import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Mesafeli Satış Sözleşmesi · ZestHome",
  description: "ZestHome mesafeli satış sözleşmesi.",
};

export default function MesafeliSatisPage() {
  return (
    <LegalPage
      title="Mesafeli Satış Sözleşmesi"
      updatedAt="2026-06-19"
      intro="Bu Mesafeli Satış Sözleşmesi, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında, ZestHome web sitesi üzerinden yapılan alışverişlerde Satıcı ile Alıcı arasındaki hak ve yükümlülükleri düzenler."
      sections={[
        {
          title: "1. Taraflar",
          body: "Satıcı: ZestHome — Küçükçekmece, İstanbul / Türkiye — info@zest-home.net — +90 532 280 92 06.\nAlıcı: Sipariş sırasında bilgileri kayıt edilen tüketici.",
        },
        {
          title: "2. Sözleşme Konusu",
          body: "Alıcı'nın site üzerinden elektronik ortamda sipariş ettiği, niteliği ve adedi sipariş onay sayfasında belirtilen ürün/ürünlerin satışı ile teslimine ilişkin koşulları kapsar.",
        },
        {
          title: "3. Ürün Bilgileri",
          body: "Ürünün adı, adedi, satış fiyatı (KDV dahil), ödeme şekli ve teslimat bilgileri sipariş özetinde Alıcı'ya gösterilir. Bu bilgiler sözleşmenin ayrılmaz parçasıdır.",
        },
        {
          title: "4. Genel Hükümler",
          body: "Alıcı, sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul ve beyan eder.",
        },
        {
          title: "5. Teslimat",
          body: "Ürün, Alıcı'nın sipariş sırasında belirttiği adrese, anlaşmalı kargo şirketi aracılığıyla en geç 30 gün içinde teslim edilir. Teslimat süresi normalde 1-3 iş günüdür; bu süreyi etkileyebilecek mücbir sebepler (kargo gecikmesi, hava koşulları vb.) ortaya çıkarsa Alıcı bilgilendirilir.",
        },
        {
          title: "6. Cayma Hakkı",
          body: "Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin sözleşmeden cayma hakkına sahiptir. Cayma bildirimi info@zest-home.net adresine veya iade formu ile yapılır. Cayma hakkının kullanılması halinde ürün, orijinal ambalajı ve fatura aslı ile birlikte ZestHome'a iade edilir. İade kargo ücreti, ürün ayıplı değilse Alıcı'ya aittir.",
        },
        {
          title: "7. Cayma Hakkının Kullanılamayacağı Haller",
          body: "Hijyen kuralları gereği ambalajı açılan kişisel bakım ürünleri, sipariş üzerine üretilen veya kişiselleştirilen ürünler ile çabuk bozulabilen ürünlerde cayma hakkı kullanılamaz (Mesafeli Sözleşmeler Yönetmeliği md. 15).",
        },
        {
          title: "8. Uyuşmazlıkların Çözümü",
          body: "Tüketici şikayetleri için Ticaret Bakanlığı'nca belirlenen parasal sınırlar dahilinde Alıcı'nın yerleşim yerindeki veya tüketici işleminin yapıldığı yerdeki Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir.",
        },
      ]}
    />
  );
}
