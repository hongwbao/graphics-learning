'use strict';
(()=>{
  const list=document.querySelector('#course-list'),planned=document.querySelector('#planned-list'),courses=window.GraphicsCourses||[];
  if(!courses.length)return;
  list.replaceChildren();planned.replaceChildren();
  courses.forEach(course=>{
    const row=document.createElement('li'),number=document.createElement('span'),body=document.createElement('div'),title=document.createElement(course.path?'a':'strong'),description=document.createElement('p'),status=document.createElement('span');
    row.className=course.path?'course-row':'planned-row';number.className='course-number';number.textContent=String(course.week).padStart(2,'0');
    title.textContent=course.title;if(course.path){title.href=course.path;title.className='course-title';title.setAttribute('aria-label',`第 ${course.week} 周：${course.title}`);}description.textContent=course.description;body.append(title,description);
    status.className='course-availability';status.textContent=course.path?(course.level||'可学习'):'计划中';row.append(number,body,status);(course.path?list:planned).append(row);
  });
  document.querySelector('#course-count').textContent=`目前已制作 ${courses.filter(c=>c.path).length} 周；其余内容将逐周加入。`;
})();
