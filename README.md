# LANDWISE Mongolia — Render хувилбар (2.0)

Газрын зар, үнийн шинжилгээ, газар авах боломжийн мэдээлэл бүхий веб сайт. Node.js сервер дээр ажиллана. Cloudflare хувилбар нь `LANDWISE_Mongolia_Cloudflare.zip`-д байгаа бөгөөд сайтын код нь ижил.

## Render дээр deploy хийх

1. Файлуудыг GitHub repo-ийн **root**-д байрлуулж `main` руу push хийнэ.
2. [Render Dashboard](https://dashboard.render.com/) → **New → Blueprint** → repo-гоо сонгоно. `render.yaml` нь Node 22, free plan, тест, `npm start`, `/api/health`-ийг тохируулна.
3. `https://YOUR-SERVICE.onrender.com` хаягаар нээнэ.

Blueprint-гүйгээр: New → Web Service → Build: `npm ci && npm run build:check && npm test`, Start: `npm start`, Health check: `/api/health`.

Free plan 15 минут ашиглагдаагүй бол унтдаг тул эхний нээлт ~1 минут удаж болно.

## Local

```bash
npm ci && npm test && npm run dev   # http://localhost:10000
```

## Файлууд (бүгд repo-ийн root-д, хавтасгүй)

GitHub-ийн "Add files via upload"-аар файлуудыг хавтасгүйгээр шууд оруулж болно.

- `server.js` — сайт + `/api/health` (Render). Зөвхөн `index.html`, `app.js`, `style.css`, `listings.js`-ийг нийтэд үзүүлнэ; серверийн код, тохиргоо нээгдэхгүй.
- `worker.js`, `landwise-api.js` — хүсэлт боловсруулагч
- `index.html`, `style.css`, `app.js`, `listings.js` — сайт ба зарын өгөгдөл
- `make_sample_listings.py` — жишээ зар үүсгэгч (`npm run sample-data`)
- `*.test.js` — өгөгдөл, frontend, серверийн тест
- `ci.yml` — GitHub Actions ашиглах бол `.github/workflows/ci.yml` руу зөөнө (заавал биш)

## Сайтын бүтэц

1. **Зарууд** — бүс, зориулалт, эрхийн төрөл, үнэ, талбай, УБ-аас зай, дэд бүтцээр шүүнэ; 7 төрлийн эрэмбэ. Зар бүр дээр бүсийн медиан үнэтэй харьцуулсан тэмдэглэгээ (▼ доогуур / ≈ / ▲ дээгүүр).
2. **Дэлгэрэнгүй цонх** — бүх үзүүлэлт, бүсийн үнийн хүрээн дэх байршил, худалдан авахаас өмнө шалгах зүйлс.
3. **Шинжилгээ** — гол үзүүлэлтүүд, бүсийн медиан ₮/м² диаграм, зай-үнийн цэгэн диаграм, бүсийн хүснэгт, төсвийн тооцоолуур.
4. **Харьцуулах** — 3 хүртэл газрыг зэрэгцүүлж, хамгийн сайн утгыг тодруулна.
5. **Газар авах боломж** — үнэгүй өмчлөх, худалдан авах, дуудлага худалдаа; эх сурвалжтай.

Газрын зураг, албан WFS татах, файл импорт, CSV татах боломжийг энэ хувилбараас хассан.

## ⚠ Жишээ зарууд

`listings.js` доторх **42 зар бүгд жишээ (зохиомол)** бөгөөд сайт дээр “ЖИШЭЭ ЗАР” гэж тэмдэглэгдэнэ. Бодит ашиглалтад гаргахын өмнө баталгаажсан зараар солино уу. Шинжилгээ, диаграм, тооцоолуур бүгд энэ файлаас автоматаар тооцогдоно.

Зарын бүтэц:

```js
{
  id: 'LW-1001',            // давтагдахгүй
  sample: false,            // бодит зар бол false
  title: 'Гачуурт, Сансар — 0.08 га зуслангийн газар',
  region: 'gachuurt',       // regions доторх түлхүүр
  spot: 'Сансар',
  km: 22,                   // Улаанбаатараас зай, км
  area_m2: 800, price_mnt: 166500000,
  purpose: 'summer',        // summer | family | farm | commercial
  right: 'ownership',       // ownership | possession | use
  road: 'paved',            // paved | gravel | dirt
  power: true, water: 'well', fenced: true,   // water: central | well | none
  negotiable: true, loan: false, seller: 'owner',  // owner | agent
  posted: '2026-11-11', desc: 'Тайлбар'
}
```

Файлын эхэнд `sample: true` гэж байвал хуучирсан огноог `generatedAt`-аас тоолно; бодит өгөгдөлд `sample: false` болгоно. Жишээ өгөгдлийг дахин үүсгэх: `npm run sample-data`.

## Эх сурвалж (Газар авах боломж хэсэгт)

- Иргэнд газар өмчлүүлэх тухай хууль (5.1.4, 7.2) — legalinfo.mn
- Хуулийн хугацаа 2028.05.01, 2003–2025 оны тоо — ikon.mn/n/3o6k
- 2026 онд 2,843 иргэн, 156.42 га — ikon.mn/n/3r9v
- Дуудлага худалдааны анхны үнийн А/188 аргачлал — PwC Mongolia (2025)

Хуулийн мэдээлэл өөрчлөгдөж болох тул тогтмол шалгаж шинэчилнэ.
