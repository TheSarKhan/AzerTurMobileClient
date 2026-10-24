import {Platform} from 'react-native';
const base=(process.env.EXPO_PUBLIC_API_BASE_URL||(Platform.OS==='android'?'http://10.0.2.2:8080':'http://localhost:8080')).replace(/\/$/,'');
export interface Tour{slug:string;titleEn:string;titleRu:string;region:string;days:number;fromPriceEur:number;image:string}
export interface Quote{ id:string;currency:string;total:number;deposit:number;balance:number;due:string;expires:string;demo:boolean }
async function request<T>(path:string,body?:unknown):Promise<T>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);try{const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:controller.signal});if(!r.ok)throw Error('API request failed ('+r.status+').');return await r.json()}finally{clearTimeout(timeout)}}
export const getTours=()=>request<Tour[]>('/api/v1/tours');
export const createQuote=(tour:Tour,date:string,pax:number)=>request<Quote>('/api/v1/quotes',{slug:tour.slug,date,pax,hotel:'comfort',driver:true,stay:true,guide:true,guideLanguage:'en',transfer:false,activity:false,currency:'EUR'});
