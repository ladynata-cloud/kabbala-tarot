'use strict';
((root)=>{
 function valid(n){if(!Number.isInteger(n)||n<1||n>9999)throw new RangeError('Введите целое число от 1 до 9999.');return n;}
 function reduction(n){valid(n);const chain=[n];while(n>9){n=String(n).split('').reduce((sum,x)=>sum+Number(x),0);chain.push(n);}return chain;}
 function arithmetic(n){valid(n);const sum=n*(n+1)/2;let x=sum,chain=[sum];while(x>9){x=String(x).split('').reduce((s,c)=>s+Number(c),0);chain.push(x);}return {n,reduced:reduction(n),sum,sumReduced:chain};}
 const names=['Йод · активное начало','Первое Хе · воспринимающее начало','Вав · связывающее начало','Второе Хе · завершение и переход'];
 function frame(n,start){if(![1,4,7].includes(start)||!Number.isInteger(n)||n<start||n>start+3)throw new RangeError('Число должно входить в выбранную группу.');return {n,start,position:n-start+1,role:names[n-start]};}
 const api={reduction,arithmetic,frame};root.BookInquiry=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
