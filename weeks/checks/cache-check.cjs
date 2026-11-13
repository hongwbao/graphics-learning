/* Regression: a cached two-week registry must not hide 16 published pages. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_URL||'http://127.0.0.1:8010/';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const legacy=fs.readFileSync(path.join(__dirname,'../courses.js'),'utf8').replace(/window.GraphicsCourseRevision='[^']*';/,'').replace(/path:'week-(\d+)\/index.html'/g,(all,n)=>Number(n)>2?'path:null':all);
 const stale=await browser.newPage();await stale.route('**/courses.js*',r=>r.fulfill({contentType:'text/javascript',body:legacy}));await stale.goto(base);assert.equal(await stale.locator('#course-list .course-row').count(),16);assert.match(await stale.textContent('#course-count'),/16/);assert.equal(await stale.locator('#planned-list .planned-row').count(),0);await stale.close();
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const headers=await page.request.get(new URL('courses.js',base).href);assert.match(headers.headers()['cache-control'],/no-store/);const conditional=await page.request.get(new URL('courses.js',base).href,{headers:{'If-Modified-Since':headers.headers()['last-modified']}});assert.equal(conditional.status(),200);
 await page.goto(new URL('?v=20261113-course16-r2#courses',base).href);assert.equal(await page.locator('#course-list .course-row').count(),16);assert.equal(await page.locator('script[src]').evaluateAll(scripts=>scripts.every(s=>new URL(s.src).searchParams.has('v'))),true);
 await page.evaluate(()=>localStorage.setItem('graphics-cache-regression-note','keep-this'));
 await page.getByRole('link',{name:'第 16 周：期末项目',exact:true}).click();await page.waitForFunction(()=>LessonRuntime.ready&&!LessonRuntime.busy);assert.equal(await page.locator('#course-select option').count(),16);assert.equal(new URL(page.url()).searchParams.get('v'),'20261113-course16-r2');assert.equal(await page.evaluate(()=>localStorage.getItem('graphics-cache-regression-note')),'keep-this');await page.locator('.course-home-link').click();assert.equal(await page.locator('#course-list .course-row').count(),16);
 assert.deepEqual(errors,[]);console.log('PASS: 旧两周目录不覆盖16周静态入口；资源和页间导航带版本；no-store及条件请求200；第16周正常计算/16项切换；同源记录保留。');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
