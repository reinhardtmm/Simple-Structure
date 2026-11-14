import asyncio, sys, os
os.makedirs('tools/shots', exist_ok=True)
# Jalankan dari folder proyek: python tools/screenshot_all.py [komponen,komponen]
# Perlu: pip install playwright && playwright install chromium, serta server lokal di port 8765
from playwright.async_api import async_playwright
comps = sys.argv[1].split(',') if len(sys.argv)>1 else ['batukali','telapak','tiang','sloofpraktis','sloof','kolom','dinding','balok','pelat','tangga','bata','kolompraktis','hbk','gabungan']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1440,'height':880})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
        pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type=='error' else None)
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
        await pg.evaluate("localStorage.clear()")
        # halaman utama (tanpa hash): pembuka dan gambar mini komponen
        await pg.reload(); await pg.wait_for_timeout(3000)
        await pg.screenshot(path='tools/shots/beranda.png')
        for c in comps:
            for sysn in ['SRPMK','SRPMB']:
                await pg.goto(f'http://localhost:8765/index.html#{c}'); await pg.evaluate("localStorage.clear()")
                await pg.reload(); await pg.wait_for_timeout(1200)
                dis = await pg.evaluate("document.querySelector('#sysSeg button[data-sys=SRPMB]').disabled")
                if sysn=='SRPMB':
                    if dis: break
                    await pg.click('#sysSeg button[data-sys=SRPMB]'); await pg.wait_for_timeout(900)
                await pg.screenshot(path=f'tools/shots/{c}_{sysn}_3d.png')
                await pg.click('#tabs button[data-tab=cek]'); await pg.wait_for_timeout(200)
                txt = await pg.inner_text('#pane-cek .sum')
                fails = await pg.evaluate("[...document.querySelectorAll('#pane-cek .chk.bad .t')].map(e=>e.textContent+': '+e.nextElementSibling.textContent)")
                print(c, sysn, txt, fails)
                await pg.click('#tabs button[data-tab=gambar]'); await pg.wait_for_timeout(300)
                await pg.screenshot(path=f'tools/shots/{c}_{sysn}_gambar.png')
                await pg.click('#tabs button[data-tab=param]')
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
