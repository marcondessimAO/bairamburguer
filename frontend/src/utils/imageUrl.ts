export function getImageUrl(url: string | undefined | null) {
  if (!url) return '/images/bairam-logo.jpg.jpg'; // Garante que nunca quebra se for null
  if (url.startsWith('http')) return url;
  // Garante que a barra existe entre o host e o caminho
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `http://localhost:8080${cleanUrl}`;
}
