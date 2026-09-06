function abrirModal(id){
  const m=document.getElementById(id);
  if(!m) return;
  m.classList.add('open');
  document.body.style.overflow='hidden';
}
function cerrarModal(id){
  const m=document.getElementById(id);
  if(!m) return;
  m.classList.remove('open');
  document.body.style.overflow='';
}
document.querySelectorAll('.modal-overlay').forEach(ov=>{
  ov.addEventListener('click', e=>{ if(e.target===ov) cerrarModal(ov.id); });
});

const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}
}),{threshold:.08});
document.querySelectorAll('.rev').forEach(el=>io.observe(el));
