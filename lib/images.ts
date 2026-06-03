const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}`;

export const productImagePool: Record<string, string[]> = {
  "saklama-kaplari": [
    u("photo-1583847268964-b28dc8f51f92"),
    u("photo-1604908176997-431b88e1be43"),
    u("photo-1593618998160-e34014e67546"),
    u("photo-1610137255937-8eb421b9cd0c"),
    u("photo-1556909114-f6e7ad7d3136"),
    u("photo-1620287341056-49a2f1ab2fdc"),
    u("photo-1574781330855-d0db8cc6a79c"),
    u("photo-1607082348824-0a96f2a4b9da"),
    u("photo-1566454419290-57a0589c9b51"),
    u("photo-1592194996308-7b43878e84a6"),
  ],
  "dograyicilar": [
    u("photo-1604908176997-431b88e1be43"),
    u("photo-1593618998160-e34014e67546"),
    u("photo-1593618998160-e34014e67546"),
    u("photo-1566454419290-57a0589c9b51"),
    u("photo-1556909114-f6e7ad7d3136"),
    u("photo-1583847268964-b28dc8f51f92"),
  ],
  "rendeler-dilimleyiciler": [
    u("photo-1567538096630-e0c55bd6374c"),
    u("photo-1604908176997-431b88e1be43"),
    u("photo-1592194996308-7b43878e84a6"),
    u("photo-1556909114-f6e7ad7d3136"),
    u("photo-1583847268964-b28dc8f51f92"),
  ],
  "servis-sofra": [
    u("photo-1607082348824-0a96f2a4b9da"),
    u("photo-1556910103-1c02745aae4d"),
    u("photo-1607301406259-dfb186e15de8"),
    u("photo-1574781330855-d0db8cc6a79c"),
    u("photo-1556911220-bff31c812dba"),
    u("photo-1620287341056-49a2f1ab2fdc"),
    u("photo-1593618998160-e34014e67546"),
    u("photo-1583847268964-b28dc8f51f92"),
    u("photo-1610137255937-8eb421b9cd0c"),
  ],
  "mutfak-aletleri": [
    u("photo-1556910103-1c02745aae4d"),
    u("photo-1610137255937-8eb421b9cd0c"),
    u("photo-1574781330855-d0db8cc6a79c"),
    u("photo-1604908176997-431b88e1be43"),
    u("photo-1592194996308-7b43878e84a6"),
  ],
  "mutfak-aksesuarlari": [
    u("photo-1610137255937-8eb421b9cd0c"),
    u("photo-1607082348824-0a96f2a4b9da"),
    u("photo-1556909114-f6e7ad7d3136"),
    u("photo-1620287341056-49a2f1ab2fdc"),
    u("photo-1556911220-bff31c812dba"),
  ],
};

const detailExtras = [
  u("photo-1556910103-1c02745aae4d"),
  u("photo-1556911220-bff31c812dba"),
  u("photo-1607301406259-dfb186e15de8"),
  u("photo-1593618998160-e34014e67546"),
  u("photo-1610137255937-8eb421b9cd0c"),
];

const hashString = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

export const pickImages = (categorySlug: string, productKey: string): string[] => {
  const pool =
    productImagePool[categorySlug] ?? productImagePool["saklama-kaplari"];
  if (pool.length === 0) return [];
  const h = hashString(productKey);
  const start = h % pool.length;
  const cover = pool[start];
  const second = pool[(start + 1 + (h % 3)) % pool.length];
  const third = pool[(start + 2 + ((h >> 3) % 3)) % pool.length];
  const fourth = detailExtras[h % detailExtras.length];
  const images = Array.from(new Set([cover, second, third, fourth]));
  return images;
};
