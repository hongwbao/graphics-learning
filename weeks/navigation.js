'use strict';
(()=>{
  const script=document.currentScript;
  const base=new URL('.',script.src),courses=window.GraphicsCourses||[],available=courses.filter(c=>c.path);
  const courseURL=path=>{const url=new URL(path,base);if(window.GraphicsCourseRevision)url.searchParams.set('v',window.GraphicsCourseRevision);return url.href;};
  const normalize=path=>path.endsWith('/')?path+'index.html':path;
  const current=available.find(c=>normalize(new URL(c.path,base).pathname)===normalize(location.pathname));
  const host=document.querySelector('#course-navigation');
  if(!host||!current)return;
  const home=document.createElement('a');home.href=courseURL('index.html');home.textContent='课程首页';home.className='course-home-link';
  const label=document.createElement('label');label.htmlFor='course-select';label.textContent='周次';
  const select=document.createElement('select');select.id='course-select';select.setAttribute('aria-label','选择课程周次');
  available.forEach(c=>{const option=document.createElement('option');option.value=c.path;option.textContent=`第 ${c.week} 周 · ${c.title}`;option.selected=c.week===current.week;select.append(option);});
  select.addEventListener('change',()=>{location.href=courseURL(select.value);});
  const switcher=document.createElement('div');switcher.className='course-picker';switcher.append(label,select);
  const siblings=document.createElement('div');siblings.className='course-siblings';
  const index=available.indexOf(current);
  for(const [offset,text]of [[-1,'上一周'],[1,'下一周']]){const target=available[index+offset];if(!target)continue;const link=document.createElement('a');link.href=courseURL(target.path);link.textContent=`${text}：第 ${target.week} 周`;siblings.append(link);}
  host.replaceChildren(home,switcher,siblings);
})();
