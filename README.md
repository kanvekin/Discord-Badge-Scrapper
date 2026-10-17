Kaanseas Discord Badge and Tag Scraper

Discord selfbot tabanli, hedef sunuculardaki ozel rozetlere ve ozel kullanici adlarina sahip kullanicilari tespit edip Discord webhook adresine raporlayan bir tarama araci.


Kurulum Adimlari

1. Proje dizininde terminali acin ve gerekli paketleri yukleyin:
   npm install

2. Proje ana dizininde config.json adinda bir dosya olusturun ve asagidaki sablonu ekleyerek doldurun:

   {
       "token": "BURAYA_DISCORD_USER_TOKEN_GIRIN",
       "webhook": "BURAYA_DISCORD_WEBHOOK_URL_GIRIN",
       "commandChannel": "BURAYA_KOMUT_VERILECEK_KANAL_ID_GIRIN"
   }


Config Dosyasi Detaylari

- token: Botun calisacagi Discord hesabinin User Token degeri.
- webhook: Sonuclarin ve baslangic kilavuzunun gonderilecegi Discord Webhook URL adresi.
- commandChannel: Botu tetikleyecek komutlari yazacaginiz Discord metin kanalinin Kanal ID numarasi.


Kullanim

1. Botu baslatmak icin terminale su komutu girin:
   node index.js

2. Bot basariyla aktif oldugunda, webhook adresine otomatik bir bilgi mesaji duser.
3. Discord uzerinden ayarladiginiz commandChannel kanalina giderek su komutla taramayi baslatabilirsiniz:
   !hq <hedef-sunucu-id>

ornek: !hq 123456789012345678


Ozellikler

- Dogrudan uye havuzu uzerinden hizli tarama yapar.
- Acilis sirasinda webhook kanalina otomatik kullanim rehberi gonderir.
- Rozetlerin yani sira 2 ve 3 haneli ozel kullanici adlarini da yakalar.
