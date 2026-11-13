'use strict';
(()=>{
  const list=document.querySelector('#course-list'),planned=document.querySelector('#planned-list'),courses=window.GraphicsCourses||[];
  if(!courses.length)return;
  // The server-rendered fallback is authoritative when a cached registry is
  // older. Never erase available lessons because an older script knows fewer.
  const rendered=list.querySelectorAll('.course-row');
  if(rendered.length>courses.filter(c=>c.path).length){
    planned.replaceChildren();
    if(planned.closest('details'))planned.closest('details').hidden=true;
    document.querySelector('#course-count').textContent=`第 1–${rendered.length} 周均已制作，可按顺序或按主题学习。`;
    return;
  }
  list.replaceChildren();planned.replaceChildren();
  courses.forEach(course=>{
    const row=document.createElement('li'),number=document.createElement('span'),body=document.createElement('div'),title=document.createElement(course.path?'a':'strong'),description=document.createElement('p'),status=document.createElement('span');
    row.className=course.path?'course-row':'planned-row';number.className='course-number';number.textContent=String(course.week).padStart(2,'0');
    title.textContent=course.title;if(course.path){title.href=course.path+(window.GraphicsCourseRevision?'?v='+encodeURIComponent(window.GraphicsCourseRevision):'');title.className='course-title';title.setAttribute('aria-label',`第 ${course.week} 周：${course.title}`);}description.textContent=course.description;body.append(title,description);
    status.className='course-availability';status.textContent=course.path?(course.level||'可学习'):'计划中';row.append(number,body,status);(course.path?list:planned).append(row);
  });
  const ready=courses.filter(c=>c.path).length,remaining=courses.length-ready;
  document.querySelector('#course-count').textContent=remaining?`目前已制作 ${ready} 周；其余内容将逐周加入。`:`第 1–${ready} 周均已制作，可按顺序或按主题学习。`;
  if(planned.closest('details'))planned.closest('details').hidden=remaining===0;
})();
