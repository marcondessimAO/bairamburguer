export function getImageUrl(url: string | undefined | null) {
  if (!url) return '/images/bairam-logo.jpg.jpg'; // Garante que nunca quebra se for null
  if (url.startsWith('http')) return url;
  
  
 const host = process.env.NEXT_PUBLIC_HOST_URL || 'http://2.25.131.139:8080';
  
  // Garante que a barra existe entre o host e o caminho
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${host}${cleanUrl}`;
}
