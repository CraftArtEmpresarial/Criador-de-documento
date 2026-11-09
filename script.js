const $ = id => document.getElementById(id);
let pendingData = null, currentPdfUrl = null, currentPdfBlob = null;

$("year").textContent = new Date().getFullYear();
$("cpf").addEventListener("input", e => {
  let v=e.target.value.replace(/\D/g,"").slice(0,11);
  v=v.replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2");
  e.target.value=v;
});
$("phone").addEventListener("input", e => {
  let v=e.target.value.replace(/\D/g,"").slice(0,11);
  if(v.length>10) v=v.replace(/^(\d{2})(\d{5})(\d{4})$/,"($1) $2-$3");
  else if(v.length>6) v=v.replace(/^(\d{2})(\d{4})(\d{0,4})$/,"($1) $2-$3");
  else if(v.length>2) v=v.replace(/^(\d{2})(\d+)/,"($1) $2");
  e.target.value=v;
});
$("addField").addEventListener("click", () => {
  const row=document.createElement("div"); row.className="custom-row";
  row.innerHTML='<input aria-label="Nome do dado adicional" placeholder="Nome do dado"><input aria-label="Valor do dado adicional" placeholder="Informação"><button type="button" class="remove-field" aria-label="Remover campo">×</button>';
  row.querySelector("button").addEventListener("click",()=>row.remove());
  $("customFields").appendChild(row); row.querySelector("input").focus();
});
function money(v){return Number(String(v||"0").replace(/\./g,"").replace(",", "."))||0}
function brl(v){return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function getData(){
  const phone=$("phone").value.replace(/\D/g,"");
  const cpf=$("cpf").value.replace(/\D/g,"");
  const custom=[...document.querySelectorAll(".custom-row")].map(r=>({label:r.children[0].value.trim(),value:r.children[1].value.trim()})).filter(x=>x.label||x.value);
  return {name:$("clientName").value.trim(),cpf:$("cpf").value,age:$("age").value,phone,service:$("service").value.trim(),description:$("description").value.trim(),price:money($("price").value),priceText:$("price").value,payment:$("payment").value.trim(),deadline:$("deadline").value.trim(),validity:$("validity").value.trim(),custom,owner:$("owner").value.trim(),companyDoc:$("companyDoc").value.trim(),companyPhone:$("companyPhone").value.trim(),companyAddress:$("companyAddress").value.trim(),companyEmail:$("companyEmail").value.trim()};
}
function validate(){
  const d=getData();
  if(!d.name||d.cpf.replace(/\D/g,"").length!==11||!d.age||!d.phone||d.phone.length<10||!d.service||!d.priceText||d.price<=0){toast("Confira nome, CPF, idade, WhatsApp, serviço e valor.");return false}
  return true;
}
$("contractForm").addEventListener("submit",e=>{e.preventDefault();if(!validate())return;pendingData=getData();$("confirmModal").classList.remove("hidden")});
$("cancelGenerate").addEventListener("click",()=>$("confirmModal").classList.add("hidden"));
$("confirmGenerate").addEventListener("click",()=>{ $("confirmModal").classList.add("hidden");generatePdf(pendingData);});
function wrap(doc,text,x,y,maxWidth,lineHeight=5.2){const lines=doc.splitTextToSize(String(text||"—"),maxWidth);doc.text(lines,x,y);return y+lines.length*lineHeight}
function generatePdf(d){
  if(!window.jspdf){toast("Não foi possível carregar o gerador de PDF. Verifique a internet.");return}
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4"});
  const W=210, M=18, max=174;let y=20;
  doc.setFillColor(8,25,34);doc.rect(0,0,W,34,"F");
  doc.setTextColor(73,222,201);doc.setFont("helvetica","bold");doc.setFontSize(16);doc.text("CRAFT ART",M,16);
  doc.setTextColor(220,240,239);doc.setFontSize(8);doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS",M,24);
  doc.setTextColor(30,50,56);doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS",M,47);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(75,90,95);
  doc.text("Documento emitido em "+new Date().toLocaleDateString("pt-BR"),M,54);
  y=66;
  const section=(title)=>{if(y>255){doc.addPage();y=20}doc.setFillColor(230,246,243);doc.roundedRect(M,y-5,max,8,1,1,"F");doc.setTextColor(15,112,101);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.text(title,M+3,y);y+=9;doc.setTextColor(38,52,56);doc.setFont("helvetica","normal");doc.setFontSize(9)};
  const para=(s)=>{if(y>260){doc.addPage();y=20}y=wrap(doc,s,M,y,max,5)+3};
  section("1. IDENTIFICAÇÃO DAS PARTES");
  para("CONTRATANTE (CLIENTE): "+d.name+", CPF "+d.cpf+", "+d.age+" anos.");
  para("CONTRATADA: Craft Art, representada por "+(d.owner||"responsável indicado pela Craft Art")+". "+(d.companyDoc?"Documento: "+d.companyDoc+". ":"")+(d.companyAddress?"Endereço: "+d.companyAddress+". ":"")+(d.companyEmail?"E-mail: "+d.companyEmail+".":""));
  section("2. OBJETO E ESCOPO DO SERVIÇO");
  para("O presente contrato tem por objeto a prestação do seguinte serviço: "+d.service+".");
  para("Descrição e entregáveis: "+(d.description||"Conforme alinhado e aprovado entre as partes por escrito."));
  section("3. PREÇO E CONDIÇÕES DE PAGAMENTO");
  para("Pelo serviço descrito, o CONTRATANTE pagará o valor total de "+brl(d.price)+". Forma de pagamento: "+(d.payment||"a combinar e registrar por escrito entre as partes")+". Qualquer custo adicional deverá ser informado e aprovado previamente pelo CONTRATANTE.");
  section("4. PRAZO E ENTREGA");
  para("Prazo previsto: "+(d.deadline||"a ser definido e confirmado por escrito entre as partes")+". Eventuais alterações de prazo deverão ser comunicadas e acordadas entre as partes.");
  section("5. ALTERAÇÕES E SERVIÇOS ADICIONAIS");
  para("O escopo contratado é aquele descrito neste documento. Solicitações que alterem ou ampliem o escopo poderão ser objeto de orçamento separado, com preço e prazo informados previamente. Nenhuma cobrança recorrente será realizada automaticamente.");
  section("6. OBRIGAÇÕES DAS PARTES");
  para("A CONTRATADA deverá executar os serviços conforme o escopo acordado e manter comunicação razoável sobre o andamento. O CONTRATANTE deverá fornecer informações, materiais e aprovações necessários, além de cumprir os pagamentos nos termos combinados.");
  section("7. SERVIÇOS DE TERCEIROS");
  para("Domínio, hospedagem, plataformas, licenças, ferramentas externas e outros serviços de terceiros não estão incluídos, salvo previsão expressa. Sua contratação dependerá de aprovação prévia do CONTRATANTE.");
  section("8. PROPRIEDADE INTELECTUAL E USO");
  para("A utilização, entrega e eventual transferência de arquivos, códigos, artes ou outros materiais produzidos observará o que for expressamente combinado entre as partes, respeitados direitos de terceiros e licenças aplicáveis.");
  section("9. DADOS PESSOAIS E PRIVACIDADE");
  para("As partes comprometem-se a utilizar os dados pessoais recebidos apenas para execução deste contrato e cumprimento de obrigações relacionadas, adotando cuidados razoáveis de segurança e observando a legislação aplicável de proteção de dados.");
  section("10. RESCISÃO E DISPOSIÇÕES GERAIS");
  para("Qualquer parte poderá comunicar a intenção de encerrar a contratação. As partes deverão acertar os serviços efetivamente realizados, despesas previamente aprovadas e materiais já entregues. Alterações deste contrato deverão ser registradas por escrito.");
  if(d.custom.length){section("11. INFORMAÇÕES ADICIONAIS");d.custom.forEach(c=>para((c.label||"Informação")+": "+(c.value||"—")))}
  section("DECLARAÇÃO E ASSINATURAS");
  para("As partes declaram que tiveram oportunidade de ler este documento e esclarecer dúvidas antes de concordar com seus termos.");
  y+=9;if(y>245){doc.addPage();y=25}
  doc.setDrawColor(130,150,150);doc.line(M,y,M+76,y);doc.line(M+98,y,M+max,y);
  doc.setFontSize(8);doc.text("CONTRATANTE",M,y+6);doc.text("CRAFT ART / CONTRATADA",M+98,y+6);
  y+=20;doc.setFontSize(8);doc.text("Data: "+new Date().toLocaleDateString("pt-BR"),M,y);
  y+=16;
  if(y>255){doc.addPage();y=25}
  doc.setFillColor(231,247,239);doc.roundedRect(M,y,max,38,2,2,"F");
  doc.setTextColor(18,105,66);doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("CONFIRMAÇÃO DO DOCUMENTO",M+5,y+9);
  doc.setTextColor(55,78,67);doc.setFont("helvetica","normal");doc.setFontSize(8);
  doc.text(doc.splitTextToSize("Declaro que li e concordo com os termos deste contrato. A confirmação deverá ser realizada na página segura indicada pela Craft Art, após a visualização integral do documento.",max-10),M+5,y+17);
  doc.setFontSize(7);doc.setTextColor(110,130,120);doc.text("Área de confirmação ilustrativa no PDF. O registro eletrônico exige página online e sistema próprio.",M+5,y+32);
  const blob=doc.output("blob");currentPdfBlob=blob;if(currentPdfUrl)URL.revokeObjectURL(currentPdfUrl);currentPdfUrl=URL.createObjectURL(blob);
  $("pdfPreview").src=currentPdfUrl;$("emptyState").classList.add("hidden");$("pdfState").classList.remove("hidden");
  $("pdfName").textContent="Contrato - "+d.name;$("pdfMeta").textContent="Gerado em "+new Date().toLocaleString("pt-BR");
  $("recipientName").textContent=d.name;$("recipientPhone").textContent="+"+ (d.phone.startsWith("55")?d.phone:"55"+d.phone);
  $("whatsappBtn").disabled=false;toast("Contrato gerado! Revise a prévia antes de enviar.");
  $("pdfState").scrollIntoView({behavior:"smooth",block:"nearest"});
}
$("downloadBtn").addEventListener("click",()=>{if(!currentPdfBlob)return;const a=document.createElement("a");a.href=currentPdfUrl;a.download="Contrato-Craft-Art.pdf";a.click()});
$("whatsappBtn").addEventListener("click",()=>{
  if(!currentPdfBlob||!pendingData)return;
  const d=pendingData;let number=d.phone.replace(/\D/g,"");if(!number.startsWith("55"))number="55"+number;
  const msg=`Olá, ${d.name}! A Craft Art preparou seu contrato personalizado. Estou encaminhando o documento em PDF para sua análise. Por favor, visualize o contrato e utilize a área de confirmação indicada no documento/página de confirmação.`;
  const url="https://wa.me/"+number+"?text="+encodeURIComponent(msg);
  window.open(url,"_blank","noopener,noreferrer");
  toast("WhatsApp aberto para o número informado. Anexe o PDF antes de enviar.");
});
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3200)}
