export async function obtenerAPI(url){
   const data = await fetch(url)
   const response = await data.json();
   console.log(response);
   return response;
}