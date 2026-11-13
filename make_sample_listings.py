"""Generate clearly-labelled SAMPLE land ads for the LANDWISE prototype.
Replace public/data/listings.js with real, verified listings before launch."""
import json, random, datetime, sys
random.seed(2026_11)
TODAY = datetime.date(2026, 11, 13)
REGIONS = {
 'gachuurt':      dict(name='Гачуурт',          aimag='Улаанбаатар · Баянзүрх', km=(18,28), ppm=(90_000,260_000), spots=['Гүнжийн хоолой','Сансар','Гачуурт тосгон','Улиастай']),
 'terelj':        dict(name='Тэрэлж',           aimag='Төв · Эрдэнэ',         km=(55,70), ppm=(110_000,320_000), spots=['Горхи','Мэлхий хад','Тэрэлжийн гол','Хагийн хар']),
 'emeelt':        dict(name='Эмээлт',           aimag='Улаанбаатар · Сонгинохайрхан', km=(30,40), ppm=(25_000,70_000), spots=['Эмээлт','Эмээлтийн гол','Шинэ суурьшил']),
 'nalaikh':       dict(name='Налайх',           aimag='Улаанбаатар · Налайх',  km=(35,42), ppm=(30_000,85_000), spots=['Налайхын зуслан','Хонхор','Шинэ Налайх']),
 'khushig':       dict(name='Хөшигийн хөндий',  aimag='Төв · Сэргэлэн',       km=(45,55), ppm=(40_000,130_000), spots=['Шинэ нисэх буудал орчим','Хөшигийн хөндий','Сэргэлэн']),
 'zuunmod':       dict(name='Зуунмод',          aimag='Төв · Зуунмод',        km=(40,46), ppm=(18_000,60_000), spots=['Зуунмод хот','Богд уулын ар','Мандшир орчим']),
 'bayanchandmani':dict(name='Баянчандмань',     aimag='Төв · Баянчандмань',   km=(55,65), ppm=(12_000,40_000), spots=['Сумын төв','Мянганы зам дагуу','Хөндий']),
 'baganuur':      dict(name='Багануур',         aimag='Улаанбаатар · Багануур', km=(125,135), ppm=(8_000,28_000), spots=['Багануур хот','Хэрлэн гол орчим']),
}
PURPOSE = {'summer':'Зуслан','family':'Гэр бүлийн хэрэгцээ','farm':'Газар тариалан','commercial':'Худалдаа, үйлчилгээ'}
RIGHT = {'ownership':'Өмчлөлийн гэрчилгээтэй','possession':'Эзэмших эрхтэй','use':'Ашиглах эрхтэй'}
DESC = {
 'summer': ['Зусланд тохиромжтой, ой модтой ойр.','Голын эргээс ойрхон, тайван орчин.','Хашаатай, байшин барих боломжтой.','Уулын бэлд, нар сайн тусдаг.'],
 'family': ['Гэр бүлийн хэрэгцээнд, хашаа хороотой.','Сургууль, дэлгүүрт ойр.','Байшин барих зөвшөөрөлтэй хэсэг.','Хорооллын дотор, зам ойр.'],
 'farm':   ['Хүлэмж, ногоо тариалахад тохиромжтой.','Худагтай, усалгааны боломжтой.','Тэгш талбай, хөрс сайн.'],
 'commercial': ['Засмал замын дагуу, худалдаа үйлчилгээнд.','Шатахуун түгээх, кафе барихад тохиромжтой.','Хөдөлгөөн ихтэй уулзвар орчим.'],
}
def pick_purpose(r):
    if r in ('gachuurt','terelj'): return random.choices(['summer','family','commercial'],[6,2,1])[0]
    if r in ('zuunmod','bayanchandmani','baganuur','nalaikh'): return random.choices(['family','summer','farm','commercial'],[4,2,2,1])[0]
    return random.choices(['summer','family','farm','commercial'],[3,3,2,2])[0]
out=[]; i=0
counts = {'gachuurt':7,'terelj':5,'emeelt':5,'nalaikh':5,'khushig':6,'zuunmod':6,'bayanchandmani':4,'baganuur':4}
for r,n in counts.items():
    R=REGIONS[r]
    for _ in range(n):
        i+=1; p=pick_purpose(r)
        if p=='farm': area=random.choice([5000,10000,10000,20000,30000,50000]); ppm=random.uniform(1500,6500)*(1.8 if r in('khushig','emeelt') else 1)
        else:
            area=random.choice([500,600,700,700,700,800,1000,1200,1500]) if p!='commercial' else random.choice([1000,1500,2000,3000])
            lo,hi=R['ppm']; ppm=random.uniform(lo,hi)*(1.35 if p=='commercial' else 1)
        price=round(area*ppm/500_000)*500_000
        right=random.choices(['ownership','possession','use'],[5,4,1] if p!='farm' else [1,5,3])[0]
        if r=='terelj' and right=='ownership': right='possession'   # tourism zone: possession is typical
        road=random.choices(['paved','gravel','dirt'],[2,3,3] if p!='commercial' else [6,1,0])[0]
        power=random.random()<(0.85 if road!='dirt' else 0.5)
        water=random.choices(['central','well','none'],[1,4,3])[0]
        spot=random.choice(R['spots']); ha=area/10000
        hatxt=(f'{ha:.2f}'.rstrip('0').rstrip('.') if ha<1 else f'{ha:g}')+' га'
        title=f"{R['name']}, {spot} — {hatxt} " + ('зуслангийн газар' if p=='summer' else 'гэр бүлийн хэрэгцээний газар')
        if p=='farm': title=f"{R['name']}, {spot} — {hatxt} газар тариалангийн талбай"
        if p=='commercial': title=f"{R['name']}, {spot} — {hatxt} үйлчилгээний газар"
        out.append(dict(
          id=f'LW-{1000+i}', sample=True, title=title, region=r, spot=spot,
          km=random.randint(*R['km']), area_m2=area, price_mnt=price, purpose=p, right=right,
          road=road, power=power, water=water, fenced=random.random()<0.55,
          negotiable=random.random()<0.6, loan=random.random()<0.2,
          seller=random.choices(['owner','agent'],[3,2])[0],
          posted=(TODAY-datetime.timedelta(days=random.randint(0,58))).isoformat(),
          desc=random.choice(DESC[p])))
data=dict(generatedAt=TODAY.isoformat(), sample=True,
  note='Жишээ (зохиомол) зарууд. Бодит, баталгаажсан зараар солих хүртэл худалдан авах шийдвэрт ашиглахгүй.',
  regions={k:dict(name=v['name'],aimag=v['aimag']) for k,v in REGIONS.items()},
  purposes=PURPOSE, rights=RIGHT, listings=out)
js='/* LANDWISE — ЖИШЭЭ ӨГӨГДӨЛ. Бодит зараар солих: tools/make_sample_listings.py-г үзнэ үү. */\nwindow.LANDWISE_DATA = '+json.dumps(data,ensure_ascii=False,indent=1)+';\n'
open(sys.argv[1],'w',encoding='utf-8').write(js)
print(len(out),'listings')
for p in out[:6]: print(p['id'],p['title'],p['area_m2'],f"{p['price_mnt']/1e6:.1f}M", round(p['price_mnt']/p['area_m2']))
