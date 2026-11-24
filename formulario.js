/* Configure la URL de implementación de Google Apps Script en GAS_URL. */
const GAS_URL = "https://script.google.com/macros/s/AKfycbxHocQrkegi_StwZFrM4-QjUDSKTb6FWqs7RpURbuGXVQDJJ7qbRjZjgSBrGHfHa3_dSA/exec";
const form = document.getElementById("familyForm");
const modules = [...document.querySelectorAll(".module")];
const stepDots = [...document.querySelectorAll(".step-dot")];
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const statusBox = document.getElementById("status");
let current = 0;
let submitting = false;

function showStatus(message, type="info"){statusBox.textContent=message;statusBox.className="status "+type;}
function clearStatus(){statusBox.textContent="";statusBox.className="status";}
function goTo(index){
  current=Math.max(0,Math.min(index,5));
  modules.forEach((m,i)=>m.classList.toggle("active",i===current));
  stepDots.forEach((b,i)=>{b.classList.toggle("active",i===Math.min(current,4));b.classList.toggle("done",i<current);});
  const pct=current===5?100:(current+1)*20;
  document.getElementById("stepLabel").textContent=current===5?"Revisión final":`Módulo ${current+1} de 5`;
  document.getElementById("progressPercent").textContent=pct+" %";
  document.getElementById("progressBar").style.width=pct+"%";
  prevBtn.disabled=current===0;
  nextBtn.classList.toggle("hidden",current===5);
  submitBtn.classList.toggle("hidden",current!==5);
  clearStatus();window.scrollTo({top:0,behavior:"smooth"});
}
function validateModule(index){
  const module=modules[index];
  const required=[...module.querySelectorAll("[required]")];
  for(const el of required){if(!el.checkValidity()){el.reportValidity();el.focus();return false;}}
  if(index===0){
    const ci=digits(form.elements.ci.value);
    if(ci.length<7||ci.length>8){showStatus("Verifique la C.I. ingresada. Debe contener entre 7 y 8 dígitos, sin puntos ni guiones.","error");form.elements.ci.focus();return false;}
  }
  return true;
}
function digits(value){return String(value||"").replace(/\D/g,"");}
nextBtn.addEventListener("click",()=>{if(current<5&&validateModule(current)){if(current===4){buildReview();document.getElementById("confirmCi").value=form.elements.ci.value;}goTo(current+1);}});
prevBtn.addEventListener("click",()=>goTo(current-1));
stepDots.forEach(b=>b.addEventListener("click",()=>{const target=Number(b.dataset.go);if(target<=current)goTo(target);}));
document.getElementById("addMember").addEventListener("click",addMember);
function addMember(data={}){
  const node=document.getElementById("memberTemplate").content.firstElementChild.cloneNode(true);
  node.querySelectorAll("[data-key]").forEach(el=>{const key=el.dataset.key;el.value=data[key]||"";});
  node.querySelector(".remove-button").addEventListener("click",()=>node.remove());
  document.getElementById("familyMembers").appendChild(node);
}
addMember();
function buildYears(){
  const root=document.getElementById("schoolYears");
  [2026,2025,2024].forEach(year=>{
    const div=document.createElement("div");div.className="year-card";
    div.innerHTML=`<strong>${year}</strong><label>Nivel / grado<input data-year="${year}" data-field="level"></label><label>Fallo / calificación<input data-year="${year}" data-field="result"></label><label>Centro educativo y observaciones<input data-year="${year}" data-field="school"></label>`;
    root.appendChild(div);
  });
}
buildYears();
function collect(){
  const data={};
  for(const [key,value] of new FormData(form).entries()){
    if(["transport","housing","difficulties"].includes(key)){(data[key]??=[]).push(value);}
    else if(key!=="website"&&key!=="declaration")data[key]=value;
  }
  data.familyMembers=[...document.querySelectorAll("#familyMembers .repeat-card")].map(card=>{
    const item={};card.querySelectorAll("[data-key]").forEach(el=>item[el.dataset.key]=el.value.trim());return item;
  }).filter(item=>Object.values(item).some(v=>v));
  data.schoolHistory=[...document.querySelectorAll(".year-card")].map(card=>{
    const item={year:card.querySelector("strong").textContent};
    card.querySelectorAll("[data-field]").forEach(el=>item[el.dataset.field]=el.value.trim());return item;
  });
  data.studentName=form.elements.studentName.value.trim();
  data.ci=digits(form.elements.ci.value);
  data.declaration=true;
  return data;
}
function buildReview(){
  const d=collect(),root=document.getElementById("reviewSummary");
  root.innerHTML="";
  const lines=[["Estudiante",d.studentName],["C.I.",d.ci],["Fecha de nacimiento",d.birthDate||"No indicada"],["Integrantes convivientes",String(d.familyMembers.length)],["Centro educativo anterior",d.lastSchool||"No indicado"]];
  lines.forEach(([k,v])=>{const p=document.createElement("p");const b=document.createElement("strong");b.textContent=k+": ";p.append(b,document.createTextNode(v));root.append(p);});
}
function onMessage(event){
  if(event.origin!=="https://script.google.com"&&event.origin!=="https://script.googleusercontent.com")return;
  if(!event.data||event.data.type!=="ficha-psicosocial-result")return;
  if(window._submitTimer){clearTimeout(window._submitTimer);window._submitTimer=null;}
  submitting=false;submitBtn.disabled=false;submitBtn.textContent="Enviar ficha definitivamente";
  if(event.data.ok){
    form.reset();document.getElementById("familyMembers").innerHTML="";addMember();
    showStatus("La ficha fue recibida correctamente. Gracias por completar el formulario.","success");
    form.classList.add("hidden");document.querySelector(".form-actions").classList.add("hidden");
    document.querySelectorAll(".progress-wrap").forEach(el=>el.classList.add("hidden"));
    window.scrollTo({top:0,behavior:"smooth"});
  }else showStatus(event.data.message||"No fue posible registrar la ficha. Comuníquese con el liceo.","error");
}
window.addEventListener("message",onMessage);
form.addEventListener("submit",e=>{
  e.preventDefault();clearStatus();
  if(submitting)return;
  if(GAS_URL.includes("PEGAR_AQUI")){showStatus("Falta configurar la URL de Google Apps Script. Consulte el archivo INSTRUCCIONES.","error");return;}
  if(!form.elements.declaration.checked){showStatus("Debe aceptar la declaración antes de enviar.","error");return;}
  if(digits(document.getElementById("confirmCi").value)!==digits(form.elements.ci.value)){showStatus("La C.I. de confirmación no coincide con la ingresada al inicio.","error");return;}
  const payload=collect();
  if(!payload.studentName||!payload.ci){showStatus("Faltan el nombre o la C.I. del/de la estudiante.","error");return;}
  if(form.elements.website.value){return;}
  submitting=true;submitBtn.disabled=true;submitBtn.textContent="Enviando…";
  const iframe=document.getElementById("submitFrame");
  let hidden=document.getElementById("gasPayload");
  if(hidden)hidden.remove();
  hidden=document.createElement("input");hidden.type="hidden";hidden.name="payload";hidden.id="gasPayload";hidden.value=JSON.stringify(payload);form.appendChild(hidden);
  form.action=GAS_URL;form.method="POST";form.enctype="application/x-www-form-urlencoded";form.target="submitFrame";
  form.submit();
  showStatus("Enviando la ficha. No cierre esta ventana hasta recibir la confirmación.","info");
  if(window._submitTimer)clearTimeout(window._submitTimer);
  window._submitTimer=setTimeout(()=>{
    if(submitting){
      submitting=false;submitBtn.disabled=false;submitBtn.textContent="Enviar ficha definitivamente";
      form.reset();document.getElementById("familyMembers").innerHTML="";addMember();
      showStatus("La ficha fue enviada. Gracias por completar el formulario.","success");
      form.classList.add("hidden");document.querySelector(".form-actions").classList.add("hidden");
      document.querySelectorAll(".progress-wrap").forEach(el=>el.classList.add("hidden"));
      window.scrollTo({top:0,behavior:"smooth"});
    }
  },5000);
});

["birthDate", "healthCardExpiry"].forEach((fieldName) => {
  const input = form.elements[fieldName];
  if (!input) return;

  input.addEventListener("input", () => {
    const digits = input.value.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    input.value = formatted;
  });
});

goTo(0);
